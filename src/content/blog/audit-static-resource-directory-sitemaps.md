---
title: 批量上新后，用 sitemap 差集核查静态资源目录
description: 用一个 Python 脚本分离详情页与静态入口，再用匿名抽查核对页面版本和领取说明。
pubDate: 2026-11-22
category: tech
tags: [静态站, sitemap, Python]
draft: false
---

我维护的[资料星球](https://resources.packscena.com/)有次批量上新，在 2026 年 11 月 21 日保存的 sitemap 快照中列出 619 个地址，其中 605 个是资料详情。剩下的 14 页包括首页、分类和其他入口。把 619 当作条目数，会把这些页面也算进去。

### 对比两份发布清单

先保存发布前后的 sitemap。这个例子只比较单个 sitemap 文件中的 HTTPS 详情地址，其他路径单列。如果站点用 sitemap 索引，把相关的内容地图展开后，再合并详情集合。URL 查询和片段在这套目录里不属于规范地址，留待单独排查。

~~~python
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree import ElementTree

SITEMAP_NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def detail_urls(xml_text, host):
    root = ElementTree.fromstring(xml_text)
    if root.tag != f"{{{SITEMAP_NS['s']}}}urlset":
        raise ValueError("Expected a sitemap urlset")

    details = set()
    for page in root.findall("s:url/s:loc", SITEMAP_NS):
        address = (page.text or "").strip()
        parsed = urlsplit(address)
        if parsed.scheme != "https" or parsed.netloc != host:
            continue
        if parsed.query or parsed.fragment:
            continue
        if parsed.path.startswith("/resources/") and parsed.path[len("/resources/"):].strip("/"):
            details.add(address)
    return details


def read_details(filename, host):
    return detail_urls(Path(filename).read_text(encoding="utf-8"), host)


if __name__ == "__main__":
    host = "example.org"
    before = read_details("before.xml", host)
    after = read_details("after.xml", host)
    for label, urls in (("Added", after - before), ("Removed", before - after)):
        print(f"{label}: {len(urls)}")
        for url in sorted(urls):
            print(url)
~~~

把示例域名和路径前缀换成自己的站点。差集里如果各有十条、总量却相同，说明新增和移除刚好抵消，仍需逐条与本次发布清单比对。

### 到详情页检查领取说明

从变化最多的分类里抽几页，使用匿名会话确认页面能打开，标题和 canonical 指向正确，并在当前条目的领取区域核对按钮、平台标签和登录说明。只在整页搜索一个网盘名，可能命中底部相关推荐。需要看的是当前条目的领取区域。

下面这三个字段够做第一次验收。

| 地址 | 结果 | 备注 |
| --- | --- | --- |
| 详情 URL | 标题、canonical、领取区域是否一致 | 条目需要登录或有其他前置条件时，记录页面上明确写出的条件 |

如果某批条目都出现同一问题，先查那一批的导入数据与详情模板。详情能打开但不在地图里时，核对页面构建和地图生成是否读取同一份发布清单。地图包含地址可以证明发布流程提供了这条地址，搜索引擎是否收录还要看各自的站长后台。

作者 Jake Tao。示例来自作者对公开站点的只读检查，写作有 AI 协助。
