#!/bin/sh
# 从 GitHub 拉取最新代码并构建,产物发布到 /out/blog(对应访问路径 /blog/)
set -e

apk add --no-cache git >/dev/null 2>&1 || true
git config --global --add safe.directory /repo || true

# 拉取仓库(GitHub 直连不稳定,自动重试 3 次)
attempt=1
while [ $attempt -le 3 ]; do
  if [ -d /repo/.git ]; then
    echo "[$(date '+%F %T')] pulling latest... (第 $attempt 次)"
    if git -C /repo fetch --depth 1 origin "$BRANCH" &&
       git -C /repo reset --hard "origin/$BRANCH"; then
      break
    fi
  else
    echo "[$(date '+%F %T')] cloning... (第 $attempt 次)"
    # 只清空卷内容,不能删 /repo 本身(挂载点会报 Resource busy)
    find /repo -mindepth 1 -delete 2>/dev/null || true
    if git clone --depth 1 --branch "$BRANCH" "$REPO_URL" /repo; then
      break
    fi
  fi
  attempt=$((attempt + 1))
  sleep 30
done
[ -d /repo/.git ] || { echo "[$(date '+%F %T')] 仓库拉取失败"; exit 1; }

cd /repo

echo "[$(date '+%F %T')] building..."
npm ci --no-audit --no-fund
npm run build

echo "[$(date '+%F %T')] publishing to /out/blog ..."
mkdir -p /out/blog
find /out/blog -mindepth 1 -delete
cp -r dist/. /out/blog/

echo "[$(date '+%F %T')] done at commit $(git rev-parse --short HEAD)"
