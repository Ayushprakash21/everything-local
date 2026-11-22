<#
.SYNOPSIS
    Automated Local Build Script for Everything Local Native Android Applications.
    Produces:
      - release/customer/EverythingLocal-Customer.apk
      - release/merchant/EverythingLocal-Merchant.apk
#>

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Everything Local — Native Android Multi-Application Build System" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Validate Java / JDK Version
Write-Host "`n[1/5] Validating Java Runtime Environment..." -ForegroundColor Yellow
$javaCmd = Get-Command java.exe -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Error "ERROR: Java executable (java.exe) not found on PATH. Please set JAVA_HOME."
    exit 1
}
$javaVersionOutput = & java --version | Out-String
Write-Host "Detected Java:" -ForegroundColor Green
Write-Host $javaVersionOutput.Trim()

# 2. Validate Android SDK
Write-Host "`n[2/5] Validating Android SDK..." -ForegroundColor Yellow
$sdkDir = $env:ANDROID_HOME
if (-not $sdkDir -or -not (Test-Path $sdkDir)) {
    $sdkDir = "$env:LOCALAPPDATA\Android\Sdk"
}
if (-not (Test-Path $sdkDir)) {
    Write-Error "ERROR: Android SDK not found at '$sdkDir'. Please set ANDROID_HOME environment variable."
    exit 1
}
Write-Host "Android SDK Root: $sdkDir" -ForegroundColor Green

$platformsDir = Join-Path $sdkDir "platforms"
if (-not (Test-Path $platformsDir)) {
    Write-Error "ERROR: No Android platforms found in '$platformsDir'."
    exit 1
}
$platforms = Get-ChildItem -Path $platformsDir | Select-Object -ExpandProperty Name
Write-Host "Installed Android Platforms: $($platforms -join ', ')" -ForegroundColor Green

# 3. Locate Gradle Wrapper in android-native
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$androidNativeDir = Join-Path $rootDir "android-native"
$gradlew = Join-Path $androidNativeDir "gradlew.bat"

if (-not (Test-Path $gradlew)) {
    Write-Error "ERROR: Gradle wrapper not found at '$gradlew'."
    exit 1
}

# 4. Build Customer APK
Write-Host "`n[3/5] Building Customer Application (:customer:app:assembleDebug)..." -ForegroundColor Yellow
Push-Location $androidNativeDir
try {
    & $gradlew :customer:app:assembleDebug
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERROR: Customer APK build failed with exit code $LASTEXITCODE."
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

# 5. Build Merchant APK
Write-Host "`n[4/5] Building Merchant Application (:merchant:app:assembleDebug)..." -ForegroundColor Yellow
Push-Location $androidNativeDir
try {
    & $gradlew :merchant:app:assembleDebug
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERROR: Merchant APK build failed with exit code $LASTEXITCODE."
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

# 6. Copy APKs to release directory
Write-Host "`n[5/5] Packaging and Publishing APK Deliverables..." -ForegroundColor Yellow

$releaseCustomerDir = Join-Path $rootDir "release\customer"
$releaseMerchantDir = Join-Path $rootDir "release\merchant"

if (-not (Test-Path $releaseCustomerDir)) { New-Item -ItemType Directory -Path $releaseCustomerDir -Force | Out-Null }
if (-not (Test-Path $releaseMerchantDir)) { New-Item -ItemType Directory -Path $releaseMerchantDir -Force | Out-Null }

$sourceCustomerApk = Join-Path $androidNativeDir "customer\app\build\outputs\apk\debug\app-debug.apk"
$destCustomerApk = Join-Path $releaseCustomerDir "EverythingLocal-Customer.apk"

$sourceMerchantApk = Join-Path $androidNativeDir "merchant\app\build\outputs\apk\debug\app-debug.apk"
$destMerchantApk = Join-Path $releaseMerchantDir "EverythingLocal-Merchant.apk"

Copy-Item -Path $sourceCustomerApk -Destination $destCustomerApk -Force
Copy-Item -Path $sourceMerchantApk -Destination $destMerchantApk -Force

# 7. Print APK Details
Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host " BUILD COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

$customerItem = Get-Item $destCustomerApk
$merchantItem = Get-Item $destMerchantApk

$customerSizeMB = [math]::Round($customerItem.Length / 1MB, 2)
$merchantSizeMB = [math]::Round($merchantItem.Length / 1MB, 2)

Write-Host "`n1. Everything Local — Customer Application" -ForegroundColor Cyan
Write-Host "   Application ID : com.ayushp0021.everythinglocal"
Write-Host "   Artifact Path  : $($customerItem.FullName)"
Write-Host "   File Size      : $customerSizeMB MB ($($customerItem.Length) bytes)"

Write-Host "`n2. Everything Local Merchant — Seller Application" -ForegroundColor Cyan
Write-Host "   Application ID : com.ayushp0021.everythinglocal.merchant"
Write-Host "   Artifact Path  : $($merchantItem.FullName)"
Write-Host "   File Size      : $merchantSizeMB MB ($($merchantItem.Length) bytes)"

Write-Host "`nBoth native APKs are ready for phone installation via adb or file transfer." -ForegroundColor Green
