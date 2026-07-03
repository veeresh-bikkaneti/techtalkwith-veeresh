#Requires -Version 5.1
<#
.SYNOPSIS
  Verifies blog claims for the 2026-07-02 Cucumber BDD post and runs evidence tests.
#>
param(
    [string]$UpstreamRepo = "",
    [string]$JavaHome = ""
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$reportDir = Join-Path $here "results"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$logFile = Join-Path $reportDir "verification-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log($Message) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $Message"
    Add-Content -Path $logFile -Value $line
    Write-Host $line
}

function Resolve-JavaHome {
    param([string]$Override)
    if ($Override -and (Test-Path $Override)) { return $Override }
    $candidates = @(
        "$env:JAVA_HOME",
        "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot",
        "C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot"
    ) | Where-Object { $_ -and (Test-Path $_) }
    if ($candidates.Count -eq 0) {
        throw "JDK 21 not found. Set -JavaHome or install Eclipse Adoptium JDK 21."
    }
    return $candidates[0]
}

function Resolve-UpstreamRepo {
    param([string]$Override)
    if ($Override -and (Test-Path (Join-Path $Override "pom.xml"))) { return $Override }
    $local = "C:\Users\veere\source\repos\cucumberBDDParallel\cucumberBDDParallel"
    if (Test-Path (Join-Path $local "pom.xml")) { return $local }
    throw "Upstream cucumberBDDParallel not found. Clone it or pass -UpstreamRepo."
}

Write-Log "Blog verification: 2026-07-02-get-started-cucumber-bdd-parallel-java"

# --- Live pom.xml from GitHub ---
$pomUrl = "https://raw.githubusercontent.com/veeresh-bikkaneti/cucumberBDDParallel/main/pom.xml"
Write-Log "Fetching $pomUrl"
$pomXml = Invoke-WebRequest -Uri $pomUrl -UseBasicParsing | Select-Object -ExpandProperty Content

$expectedVersions = @{
    "cucumber.version" = "7.34.4"
    "selenium.version" = "4.45.0"
    "testng.version" = "7.12.0"
    "java.version" = "21"
    "cucable-plugin.version" = "1.16.0"
}

$versionResults = @()
foreach ($key in $expectedVersions.Keys) {
    $expected = $expectedVersions[$key]
    $pattern = "<$key>$expected</$key>"
    $ok = $pomXml -match [regex]::Escape($pattern)
    $versionResults += [pscustomobject]@{ Property = $key; Expected = $expected; Pass = $ok }
    Write-Log ("  {0}: expected {1} -> {2}" -f $key, $expected, ($(if ($ok) { "PASS" } else { "FAIL" })))
}

# --- Local upstream file checks ---
$upstream = Resolve-UpstreamRepo -Override $UpstreamRepo
Write-Log "Checking local upstream at $upstream"

$checks = @(
    @{
        Name = "Two Maven modules"
        Pass = (Test-Path (Join-Path $upstream "framework\pom.xml")) -and (Test-Path (Join-Path $upstream "example-tests\pom.xml"))
    },
    @{
        Name = "Failsafe forkCount=2"
        Pass = (Select-String -Path (Join-Path $upstream "example-tests\pom.xml") -Pattern "<forkCount>2</forkCount>" -Quiet)
    },
    @{
        Name = "Cucable parallelizationMode=features"
        Pass = (Select-String -Path (Join-Path $upstream "example-tests\pom.xml") -Pattern "<parallelizationMode>features</parallelizationMode>" -Quiet)
    },
    @{
        Name = "DriverManager ThreadLocal"
        Pass = (Select-String -Path (Join-Path $upstream "framework\src\main\java\com\cucumberbddparallel\framework\driver\DriverManager.java") -Pattern "ThreadLocal<WebDriver>" -Quiet)
    },
    @{
        Name = "HomePage @FindBy locators"
        Pass = (Select-String -Path (Join-Path $upstream "example-tests\src\test\java\com\cucumberbddparallel\example\homepage\HomePage.java") -Pattern '@FindBy\(css = "#hplogo"\)' -Quiet)
    }
)

foreach ($c in $checks) {
    Write-Log ("  {0} -> {1}" -f $c.Name, ($(if ($c.Pass) { "PASS" } else { "FAIL" })))
}

# --- Citation URL smoke checks ---
$citationUrls = @(
    "https://cucumber.io/docs/cucumber/step-definitions/",
    "https://cucumber.io/docs/gherkin/",
    "https://maven.apache.org/surefire/maven-failsafe-plugin/",
    "https://github.com/trivago/cucable-plugin",
    "https://www.selenium.dev/documentation/webdriver/"
)

Write-Log "Checking citation URLs (HTTP status)"
$urlResults = @()
foreach ($url in $citationUrls) {
    try {
        $resp = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -MaximumRedirection 5
        $ok = $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400
        Write-Log ("  {0} -> {1}" -f $url, $resp.StatusCode)
    } catch {
        $ok = $false
        Write-Log ("  {0} -> FAIL ({1})" -f $url, $_.Exception.Message)
    }
    $urlResults += [pscustomobject]@{ Url = $url; Pass = $ok }
}

# --- Run evidence demo (no browser) ---
$java = Resolve-JavaHome -Override $JavaHome
$env:JAVA_HOME = $java
$env:PATH = "$java\bin;$env:PATH"
$demoDir = Join-Path $here "threadlocal-driver-demo"

Write-Log "Running threadlocal-driver-demo tests (mvn test)"
Push-Location $demoDir
try {
    & mvn -q test 2>&1 | Tee-Object -FilePath (Join-Path $reportDir "threadlocal-driver-demo-test.log")
    if ($LASTEXITCODE -ne 0) { throw "threadlocal-driver-demo tests failed with exit $LASTEXITCODE" }
    Write-Log "threadlocal-driver-demo: PASS (3 tests)"
} finally {
    Pop-Location
}

# --- Run upstream DriverManagerTest ---
Write-Log "Running upstream DriverManagerTest"
Push-Location $upstream
try {
    if (Test-Path ".\mvnw.cmd") {
        & .\mvnw.cmd -q -pl framework test -Dtest=DriverManagerTest 2>&1 | Tee-Object -FilePath (Join-Path $reportDir "upstream-driver-manager-test.log")
    } else {
        & mvn -q -pl framework test -Dtest=DriverManagerTest 2>&1 | Tee-Object -FilePath (Join-Path $reportDir "upstream-driver-manager-test.log")
    }
    if ($LASTEXITCODE -ne 0) { throw "upstream DriverManagerTest failed with exit $LASTEXITCODE" }
    Write-Log "upstream DriverManagerTest: PASS"
} finally {
    Pop-Location
}

$allPass = ($versionResults | Where-Object { -not $_.Pass }).Count -eq 0 `
    -and ($checks | Where-Object { -not $_.Pass }).Count -eq 0 `
    -and ($urlResults | Where-Object { -not $_.Pass }).Count -eq 0

Write-Log ("OVERALL: {0}" -f ($(if ($allPass) { "PASS" } else { "FAIL — see log" })))
Write-Log "Log written to $logFile"
exit $(if ($allPass) { 0 } else { 1 })