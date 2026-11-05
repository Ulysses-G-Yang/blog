# 运维手册 & 交接文档

> 本文档供新对话/新协作者快速接手博客运维。打开新对话时说一句「读 E:\blog\docs\ops.md 和 README.md」即可恢复全部上下文。

## 一句话架构

```
写文章(E:\blog\src\content\blog\xxx.md 或丢进 publish_inbox)
        ↓ git push / 定时任务自动发布
   GitHub Actions 构建(约 40 秒)
        ↓ 自动部署
┌─────────────────┴─────────────────┐
│  🌍 https://ulyssesyang.top(公网)  │
│  🏠 192.168.1.33:8088(家服镜像)   │
└───────────────────────────────────┘
```

## 关键地址

| 什么 | 值 |
| --- | --- |
| 正式网站 | https://ulyssesyang.top(自定义域名,HTTPS 强制) |
| 旧地址 | ulysses-g-yang.github.io(301 自动跳转,不用管) |
| 仓库 | https://github.com/Ulysses-G-Yang/blog |
| 家服镜像 | http://192.168.1.33:8088/(仅局域网) |
| umami 统计 | http://192.168.1.33:3001(仅局域网) |

## 自动化任务(ZCode 定时任务:博客定时维护,每天 8:00/20:00)

一个任务干两件事:

1. **自动发布**:检查 `E:\blog\publish_inbox\` 里的 .md → 校验 → git 提交推送 → 上线(脚本 `ops\auto_publish.ps1`)
2. **巡检**:公网站点 200 检查 + 本地监控日志 + git 同步状态(逻辑在任务 prompt 里)

配套文件:

- `ops\auto_publish.ps1` —— 自动发布逻辑(校验/移动/提交/推送重试)
- `ops\health_monitor.ps1` —— 健康检查(公网站点 3 连败弹窗提醒;注意此脚本目前仅手动运行,定时触发走的是任务 prompt 内置的 curl 检查)
- `ops\publish.log` / `ops\health.log` —— 运行日志
- `ops\fail_*.txt` —— 失败计数(弹窗用)

## 家服(192.168.1.33,uly@)~/blog/

- `docker-compose.yml`:web(nginx 8088)+ builder(每 5 分钟拉取构建,发布到 /out 根)+ umami(3001)+ postgres
- `sync.sh`:拉取 → 构建 → 发布到 /out 根(自动重试 3 次;凭据在 .env,不在仓库)
- `health_check.sh` + crontab(每 10 分钟):公网站点监测,连续 3 次失败写 ~/blog/HEALTH_ALERT
- 已知问题:家服偶尔离线/重启(容器 restart:unless-stopped 自动恢复,恢复后 builder 自动追平);如果修改了仓库里的 sync.sh,记得同步更新家服本地挂载的 ~/blog/sync.sh

## 安全历史(2026-11)

- alice9178(疑似即提"压测"之人,白帽):披露邮件可伪造(SPF/DMARC 缺失)+ deploy 目录信息泄露 → 全部修复:SPF `-all`、DMARC reject、通配符 TXT、README/deploy 脱敏(凭据改 .env 注入)
- 邮件防伪已全球生效(SPF/DMARC/通配符,经腾讯云 API 添加)
- umami 后台密码已改(存家服 ~/blog/umami-admin-password.txt)
- 待办:CSP/HSTS 响应头需 CDN 边缘层,列入"国内加速"升级项;腾讯云临时 SecretKey(AKID0Pde...)应已禁用,未确认

## 常见故障排查

1. **公网站点打不开(国内)**:先 Ctrl+F5;再确认访问的是 ulyssesyang.top 而非 localhost;github.io 旧域名国内"薛定谔可达"是常态,新域名已绕开 DNS 污染层
2. **镜像站样式乱**:检查家服 ~/blog/sync.sh 是否为"发布到 /out 根"版本(域名切换适配版)
3. **部署失败**:GitHub Actions → 看失败步骤;已知 upload-pages-artifact 有 409 竞态,工作流已改为手动 tar + overwrite:true,别改回去
4. **本地 git 与远程分叉**:网络抽风期间用 API 建过文件导致——`git fetch && git reset --hard origin/main` 对齐(本地无独立工作时)

## 已知技术坑(改代码前必读)

1. View Transitions 换页替换整个 body:全局脚本**禁止缓存 DOM 引用**(幕布例外,有 transition:persist);主题脚本必须带 `data-astro-rerun`
2. base 当前为 `'/'`(自定义域名);如迁回 github.io 项目站点,改回 `'/blog'`,所有链接走 `withBase()`
3. 幕布转场每会话只播一次(sessionStorage `curtain-used`)——这是产品决策,别加回高频动效
4. 中文 frontmatter 含英文冒号要加引号;Astro 模板表达式里正则不能含反引号
