# 一次性执行:注册两个计划任务(当前用户,无需管理员)
# 任务 1:自动发布(每 30 分钟 + 每次登录时)
# 任务 2:健康监控(每 10 分钟)
schtasks /Create /TN "BlogAutoPublish" /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File E:\blog\ops\auto_publish.ps1" /SC MINUTE /MO 30 /F
schtasks /Create /TN "BlogAutoPublishLogon" /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File E:\blog\ops\auto_publish.ps1" /SC ONLOGON /F
schtasks /Create /TN "BlogHealthMonitor" /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File E:\blog\ops\health_monitor.ps1" /SC MINUTE /MO 10 /F
Write-Host "计划任务注册完成"
schtasks /Query /TN "BlogAutoPublish" 2>&1 | Select-String "BlogAutoPublish"
schtasks /Query /TN "BlogHealthMonitor" 2>&1 | Select-String "BlogHealthMonitor"
