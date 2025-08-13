Param(
  [int]$WebPort=3000,
  [int]$TrackerPort=8080,
  [switch]$NoKill
)

function Stop-PortProcess {
  param([int]$Port)
  $procIds = netstat -ano | Select-String ":$Port" | ForEach-Object { ($_ -split " +")[-1] } | Where-Object { $_ -match '^[0-9]+$' } | Sort-Object -Unique
  if($procIds){
    foreach($procId in $procIds){
      try {
        Write-Host "Killing PID $procId on port $Port" -ForegroundColor Yellow
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      } catch { }
    }
  }
}

if(-not $NoKill){
  Stop-PortProcess -Port $WebPort
  Stop-PortProcess -Port $TrackerPort
}

Write-Host "Starting tracker on $TrackerPort and web on $WebPort" -ForegroundColor Cyan
$env:TRACKER_PORT=$TrackerPort

# Start tracker (hidden window)
Start-Process -WindowStyle Hidden -FilePath "${env:ComSpec}" -ArgumentList '/c', 'node tracker/index.js' -WorkingDirectory $PSScriptRoot

# Start web (foreground so user can Ctrl+C)
Push-Location $PSScriptRoot/web
npx next dev -p $WebPort
Pop-Location
