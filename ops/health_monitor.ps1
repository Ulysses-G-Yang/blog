# 网站健康检查(手动诊断工具,非定时任务)
# 强制直连检测(绕过系统代理/梯子),测量网站真实可达性;绝不弹窗
$ErrorActionPreference = "Continue"
$root = "E:\blog"
$log = "$root\ops\health.log"
$url = "https://ulyssesyang.top/"

function Test-Direct($target) {
    try {
        $req = [System.Net.HttpWebRequest]::Create($target)
        $req.Proxy = $null            # 关键:绕过系统代理(梯子),测真实可达性
        $req.Timeout = 15000
        $req.UserAgent = "blog-health-monitor"
        $resp = $req.GetResponse()
        $code = [int]$resp.StatusCode
        $resp.Close()
        return ($code -eq 200)
    } catch {
        return $false
    }
}

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
if (Test-Direct $url) {
    Add-Content -Path $log -Value "[$stamp] 公网站点直连 200 OK" -Encoding UTF8
    Write-Host "公网站点直连: 200 OK"
    exit 0
}
Add-Content -Path $log -Value "[$stamp] 公网站点直连失败(已绕过代理,属真实可达性问题)" -Encoding UTF8
Write-Host "公网站点直连失败"
exit 1
