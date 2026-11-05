# 自动发布监控:publish_inbox 里的 .md → 校验 → 进博客 → 推送上线
# 由 Windows 计划任务每 30 分钟触发一次;失败会写日志,不影响下次运行
$ErrorActionPreference = "Continue"
$root = "E:\blog"
$inbox = "$root\publish_inbox"
$rejected = "$root\ops\rejected"
$log = "$root\ops\publish.log"
$retry = "$root\ops\retry_queue.txt"

function Log($msg) {
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $log -Value "[$stamp] $msg" -Encoding UTF8
}

Log "===== 自动发布检查开始 ====="

$files = Get-ChildItem -Path $inbox -Filter "*.md" -File -ErrorAction SilentlyContinue
if (-not $files) {
    Log "收件箱为空,结束"
    exit 0
}

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8

    # 基础校验:必须有 frontmatter 和 title
    if ($content -notmatch "(?s)^---.*?title:.*?---") {
        Log "跳过 $($f.Name): 缺少 frontmatter 或 title"
        Move-Item $f.FullName "$rejected\$($f.Name)" -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path $rejected)) { New-Item -ItemType Directory -Path $rejected | Out-Null; Move-Item $f.FullName "$rejected\$($f.Name)" -Force }
        continue
    }

    # 移入博客内容目录(文件名即 URL slug)
    $dest = "$root\src\content\blog\$($f.Name)"
    Move-Item $f.FullName $dest -Force

    # 提交 + 推送(重试 3 次)
    Set-Location $root
    git add $dest
    git commit -m "auto-publish: $($f.BaseName)" 2>&1 | Out-Null

    $pushed = $false
    for ($i = 1; $i -le 3; $i++) {
        git push 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $pushed = $true; break }
        Log "push 第 $i 次失败(网络),30 秒后重试"
        Start-Sleep -Seconds 30
    }

    if ($pushed) {
        Log "已发布上线: $($f.BaseName)"
    } else {
        Log "推送失败(网络): $($f.BaseName) 已提交本地,下次运行继续推"
    }
}

Log "===== 检查结束 ====="
