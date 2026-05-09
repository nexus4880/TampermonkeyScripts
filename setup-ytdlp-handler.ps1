# 1. Define paths
$BinDir = Join-Path $env:USERPROFILE ".local" "bin"
$HandlerPath = "$BinDir/yt-dlp-handler.ps1"

New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

# 2. Create the handler script
@'
param(
    [string]$InputUrl
)

# Trim the ytdl:// prefix
$RawInput = $InputUrl -replace '^ytdl://', ''

# Fix Windows/protocol colon-stripping issue:
# Example: https//youtu.be/... -> https://youtu.be/...
$Url = $RawInput -replace '^(https?)//', '$1://'

# Go to Downloads
$Downloads = Join-Path $env:USERPROFILE "Downloads"
Set-Location $Downloads

# Run yt-dlp
yt-dlp "$Url"

Write-Host ""
Write-Host "Download complete. Press Enter to close."
'@ | Set-Content -Encoding UTF8 -Path $HandlerPath

# 3. Register the ytdl:// protocol handler in the Windows Registry
$ProtocolKey = "HKCU:\Software\Classes\ytdl"
$CommandKey = "$ProtocolKey\shell\open\command"

New-Item -Force -Path $ProtocolKey | Out-Null
New-ItemProperty -Force -Path $ProtocolKey -Name "URL Protocol" -Value "" | Out-Null
Set-ItemProperty -Path $ProtocolKey -Name "(default)" -Value "URL:yt-dlp Handler"

New-Item -Force -Path "$ProtocolKey\shell" | Out-Null
New-Item -Force -Path "$ProtocolKey\shell\open" | Out-Null
New-Item -Force -Path $CommandKey | Out-Null

# This launches PowerShell in a visible window and runs the handler script
$Command = "pwsh.exe -NoExit -ExecutionPolicy Bypass -File `"$HandlerPath`" `"%1`""

Set-ItemProperty -Path $CommandKey -Name "(default)" -Value $Command

Write-Host "-----------------------------------------------"
Write-Host "Setup Complete!"
Write-Host "The 'ytdl://' protocol is active and the URL fix is applied."
Write-Host ""
Write-Host "Test it from Win+R or a browser:"
Write-Host "ytdl://https://youtu.be/1O0yazhqaxs"
Write-Host "-----------------------------------------------"
