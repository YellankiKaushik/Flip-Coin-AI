$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$expected = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'config\toolchain-expected.json') | ConvertFrom-Json
$toolRoot = Join-Path $projectRoot '.local\tools'
New-Item -ItemType Directory -Force -Path $toolRoot | Out-Null
$archivePath = Join-Path $toolRoot $expected.oasdiff.archive
$version = $expected.oasdiff.version
Invoke-WebRequest -Uri ('https://github.com/oasdiff/oasdiff/releases/download/v'+$version+'/'+$expected.oasdiff.archive) -OutFile $archivePath
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath).Hash -ne $expected.oasdiff.archiveSha256) { throw 'Pinned oasdiff archive checksum mismatch' }
tar -xzf $archivePath -C $toolRoot
if ($LASTEXITCODE -ne 0) { throw 'Extraction failed' }
$binaryPath = Join-Path $toolRoot 'oasdiff.exe'
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $binaryPath).Hash -ne $expected.oasdiff.binarySha256) { throw 'Pinned oasdiff binary checksum mismatch' }
& $binaryPath --version
if ($LASTEXITCODE -ne 0) { throw 'oasdiff executable smoke test failed' }
