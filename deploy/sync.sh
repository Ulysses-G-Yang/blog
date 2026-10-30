#!/bin/sh
# 从 GitHub 拉取最新代码并构建,产物发布到 /out(由 docker-compose 挂载到 ./site)
set -e

apk add --no-cache git >/dev/null 2>&1 || true
git config --global --add safe.directory /repo || true

if [ -d /repo/.git ]; then
  echo "[$(date '+%F %T')] pulling latest..."
  git -C /repo fetch --depth 1 origin "$BRANCH"
  git -C /repo reset --hard "origin/$BRANCH"
else
  echo "[$(date '+%F %T')] cloning..."
  rm -rf /repo
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" /repo
fi

cd /repo

echo "[$(date '+%F %T')] building..."
npm ci --no-audit --no-fund
npm run build

echo "[$(date '+%F %T')] publishing to /out ..."
mkdir -p /out
find /out -mindepth 1 -delete
cp -r dist/. /out/

echo "[$(date '+%F %T')] done at commit $(git rev-parse --short HEAD)"
