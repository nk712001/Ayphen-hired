# Run this script as administrator
# Enable long path support in Windows
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
    -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Configure Git to handle long paths
git config --system core.longpaths true

Write-Host "Long path support has been enabled. Please restart your system for changes to take effect."
