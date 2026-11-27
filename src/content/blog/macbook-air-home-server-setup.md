---
title: "把老 MacBook Air 改造成 AI 家庭服务器:网卡排障、回环代理隔离与自动化落地实录"
description: "一台退役 Intel MacBook Air 装上 Linux Mint 后的真实踩坑记录:排查 WiFi 间歇断连与外电硬关机、在 AdGuard Home 共存下设计 Mihomo 回环按需代理,以及打通无头 SSH 远程 OAuth 自动化。"
pubDate: 2026-11-27
category: tech
tags: ["Linux", "家庭服务器", "Docker", "网络工程", "自动化"]
---

闲置下来的旧笔记本往往是性价比最高的家庭服务器:自带 UPS(哪怕电池已经老化)、功耗低、静音,跑十几个容器和定时任务绰绰有余。但一台退役的 Intel MacBook Air 装上 Linux Mint 22.3 真正 7×24 小时跑起来之后,真正的麻烦往往不在"怎么把服务跑起来",而在**隐蔽的硬件电源陷阱、无线网卡省电断连,以及多服务共存时的网络边界隔离**。

这篇笔记记录这台机器从"能用"收敛到"低维护稳态"的完整排障与改造过程。

## 一、先守住物理与内核基线:电源取证与 WiFi 间歇断连

服务器刚上线的前几天,偶尔会出现 SSH 突然卡死、过一会又自动恢复的情况。拉了一遍 `journalctl` 基线,立刻揪出两个独立但叠加的隐患。

### 1. 老电池不是真 UPS:一次非正常断电取证

查看系统启动日志时,发现前一天凌晨存在一次没有 `systemd-shutdown` 正常关机记录的冷启动。进一步核查电池状态:

- 电池设计容量与当前满充容量对比,健康度仅剩 **73.7%**。
- 老化的锂电池在瞬时高负载或外接电源接触松动时,无法像健康电池那样平稳接管供电,会直接触发硬件级掉电(Hard Power-off)。

对于跑着数据库(如 Umami 的 PostgreSQL)和本地文件镜像的机器来说,硬断电比重启危险得多。解决思路很朴素:**不要把老化电池当 UPS 依赖**——检查磁吸充电口与插排接触,并在路由器侧固定静态局域网 IP,避免重启后漂移。

### 2. Broadcom 闭源驱动的 `powersave` 陷阱

另一个高频异常藏在无线日志里:6 天内累计出现了 **185 次** `CTRL-EVENT-DISCONNECTED`。旧款 MacBook Air 的 `wlp3s0` 使用 Broadcom 闭源驱动,NetworkManager 默认的无线省电策略(`powersave=0` 跟随驱动默认)会让网卡在空闲窗口频繁进入休眠,导致 ICMP 延迟飙升甚至短时掉线。

直接修改对应连接配置并热重载即可,无需重启整机:

```bash
# 2 表示显式关闭无线省电
sudo nmcli con modify "<你的WiFi连接名>" 802-11-wireless.powersave 2

# 避免在当前 SSH 会话里直接 down/up 把自己踢掉,用独立瞬态单元重连
sudo systemd-run --on-active=3 --unit=wifi-reapply nmcli con up "<你的WiFi连接名>"
```

验证时不要只看 nmcli 配置文件,务必用驱动层命令确认运行时状态已经生效:

```bash
iwconfig wlp3s0 | grep -i "power management"   # 预期输出:Power Management:off
```

## 二、多服务共存的红线:在 AdGuard Home 旁部署零侵入回环代理

这台机器上已经稳定跑着 6 个 Docker 容器和一组 `systemd --user` 常驻单元,包括:

- 局域网 DNS 过滤(AdGuard Home 占用 53 与 3000 端口,宿主机 `systemd-resolved` 监听 `127.0.0.53:53`);
- 个人站点与数据统计(Nginx、自动构建器、Umami 及其数据库);
- 本地静态站镜像同步任务与工作流编排。

同时,宿主机上的 apt、pip、npm 和 Docker 全部配置了国内镜像源走直连。现在需要为外部 API 调用和 CLI 工具补充外网出口,但绝不能开 TUN 全局接管、不能碰 53 端口 DNS、也不能让全局环境变量污染国内镜像直连。

### 架构设计:`127.0.0.1` 回环监听 + 订阅净化器 + `px` 包装脚本

最终落地的方案非常克制——完全跑在用户态(`systemd --user`),零 sudo,零全局环境变量:

**安全净化器(`sanitize.py`)**:直接拿现成的 Clash/Mihomo 配置文件往服务器上丢非常危险,因为桌面端订阅通常默认开启 `allow-lan: true`、`dns.enable: true`(甚至抢占 `0.0.0.0:53`)或 `tun.enable: true`。写一个无第三方依赖的块级文本清洗脚本,在生成最终 `config.yaml`(权限 600)前强制剥离高危顶层键并注入安全头:

```yaml
mixed-port: 7890
bind-address: 127.0.0.1
allow-lan: false
external-controller: ""
port: 0
socks-port: 0
redir-port: 0
tproxy-port: 0
tun:
  enable: false
dns:
  enable: false
```

**按需调用包装器(`~/.local/bin/px`)**:不在 `.bashrc` 或 `/etc/environment` 里写任何 `HTTP_PROXY`,而是建一个 10 行的可执行包装器,只在显式需要走代理的命令前加 `px`:

```bash
#!/usr/bin/env bash
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
export all_proxy="http://127.0.0.1:7890"
export HTTP_PROXY="$http_proxy"
export HTTPS_PROXY="$https_proxy"
export ALL_PROXY="$all_proxy"
export no_proxy="localhost,127.0.0.1,192.168.1.0/24"
export NO_PROXY="$no_proxy"
exec "$@"
```

这样一来,宿主机和 Docker 容器继续高速直连国内镜像,`ss -tlnp` 里全机只多出唯一一条 `127.0.0.1:7890` 监听;只有执行 `px <command>` 时,子进程才会进入代理通道。

## 三、自动化流水线细节:GitHub 镜像超时与无头 OAuth 交互

基建稳住后,日常运维里还有两类容易被忽略的细节值得加固。

### 1. 给自动构建脚本加上 `timeout` 熔断

站点自动构建容器(`blog-builder`)每隔几分钟会执行一次 `git fetch --depth 1 origin main` 拉取最新文章。当上游加速代理域名偶发抽风时,没有设置超时参数的 `git fetch` 会一直挂在 TCP 等待队列里,导致整条构建流水线静默停摆数小时而不报错。

除了切换到响应稳定的代理前缀外,在 `sync.sh` 里加上一层 `timeout` 熔断是成本最低的保险:

```bash
if timeout 90 git -C /repo fetch --depth 1 origin "$BRANCH"; then
  # 校验本地与远端 commit 是否一致再触发构建
fi
```

### 2. 无头 SSH 环境下打通终端 TUI 的远程 OAuth

很多现代 CLI 工具在无图形界面的 SSH 会话里会切换为"远程回调 + 粘贴授权码"的 OAuth 模式(`redirect_uri` 指向官方 HTTPS 回调页而非 `localhost`)。如果终端没有分配伪终端(PTY),直接管道运行往往会因为检测不到交互设备而报错退出。

通过 `script -qefc` 提供伪终端、配合命名管道(FIFO)回填授权码,就能在纯无头 SSH 会话里丝滑完成一次离线刷新令牌(`access_type=offline`)的落盘,用完即焚清理临时管道与日志,不留任何明文痕量。

## 四、写在最后:克制折腾,把时间还给创造

折腾家庭服务器最容易陷入"为了运维而运维"的循环。经过这一轮收口,这台老 MacBook Air 已经收敛成一套清晰的边界:

- 基础设施层:关闭无线省电、守住电源物理接触、回环代理与 DNS 彻底隔离;
- 站点与服务层:构建脚本带超时熔断,静态镜像脚本区分 404 降级与真正网络故障,非零退出才告警;
- 时间分配:服务器进入"不报红就不碰"的只读稳态,把真正的精力留给项目开发、技术写作和开源社区贡献。
