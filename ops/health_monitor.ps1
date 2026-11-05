# 网站健康监控:每 10 分钟检查公网站点 + 家服镜像
# 连续 3 次失败 → 弹窗提醒;全程写日志备查
$ErrorActionPreference = "Continue"
$root = "E:\blog"
$log = "$root\ops\health.log"
$stateFile = "$root\ops\fail_count.txt"
$sites = @(
    @{ name = "公网站点"; url = "https://ulyssesyang.top/" },
    @{ name = "本地预览"; url = "http://localhost:4399/blog/" }
)

function Log($msg) {
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $log -Value "[$stamp] $msg" -Encoding UTF8
}

foreach ($site in $sites) {
    $ok = $false
    try {
        $r = Invoke-WebRequest -Uri $site.url -UseBasicParsing -TimeoutSec 20
        $ok = ($r.StatusCode -eq 200)
    } catch {
        $ok = $false
    }

    $countFile = "$root\ops\fail_$($site.name -replace '\s','').txt"
    if ($ok) {
        $prev = 0
        if (Test-Path $countFile) { $prev = [int](Get-Content $countFile -Raw) }
        if ($prev -gt 0) { Log "$($site.name): 恢复正常(此前连续失败 $prev 次)" }
        Set-Content $countFile "0"
    } else {
        $prev = 0
        if (Test-Path $countFile) { $prev = [int](Get-Content $countFile -Raw) }
        $now = $prev + 1
        Set-Content $countFile "$now"
        Log "$($site.name): 连续第 $now 次失败"

        # 公网站点连续 3 次失败 → 弹窗提醒
        if ($now -ge 3 -and $site.name -eq "公网站点") {
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.MessageBox]::Show(
                "你的博客网站连续 $now 次无法访问!`n`n请检查网络/GitHub 状态,或联系 AI 协助排查。",
                "网站告警", "OK", "Warning") | Out-Null
            Set-Content $countFile "0"  # 弹窗只提醒一次,重置计数
        }
    }
}

Log "===== 本轮监控结束 ====="
