# Download CUDA Toolkit 11.8
$cudaUrl = "https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda_11.8.0_522.06_windows.exe"
$cudaInstaller = "$env:TEMP\cuda_installer.exe"
Invoke-WebRequest -Uri $cudaUrl -OutFile $cudaInstaller

# Install CUDA Toolkit silently
Start-Process -FilePath $cudaInstaller -ArgumentList "/s" -Wait

# Add CUDA to PATH
$cudaPath = "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8"
$env:Path += ";$cudaPath\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::Machine)

# Install cuDNN
# Note: cuDNN requires NVIDIA Developer Program membership
# Download manually from: https://developer.nvidia.com/cudnn
Write-Host "Please download cuDNN v8.6.0 for CUDA 11.x from NVIDIA Developer website"
Write-Host "Extract and copy the files to the CUDA toolkit directory"
