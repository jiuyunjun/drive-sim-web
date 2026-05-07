Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Content
  )

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Build-MapJsonContent {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ImageFileName,
    [Parameter(Mandatory = $true)]
    [int]$MapWidth,
    [Parameter(Mandatory = $true)]
    [double]$StartX,
    [Parameter(Mandatory = $true)]
    [double]$StartZ,
    [Parameter(Mandatory = $true)]
    [double]$Heading
  )

  return @"
{
  "image": "$ImageFileName",
  "mapWidth": $MapWidth,
  "maxSpeed": 10,
  "startPose": {
    "x": $StartX,
    "z": $StartZ,
    "heading": $Heading
  }
}
"@
}

function Build-IndexJsonContent {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Maps
  )

  $lines = @('{', '  "maps": [')
  for ($i = 0; $i -lt $Maps.Count; $i++) {
    $suffix = if ($i -lt ($Maps.Count - 1)) { ',' } else { '' }
    $lines += ('    "{0}"{1}' -f $Maps[$i], $suffix)
  }
  $lines += '  ]'
  $lines += '}'
  return ($lines -join "`n") + "`n"
}

function Get-DefaultMapConfig {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ImagePath
  )

  Add-Type -AssemblyName System.Drawing
  $image = [System.Drawing.Image]::FromFile($ImagePath)
  try {
    $mapWidth = [int][Math]::Round($image.Width / 16.384)
    if ($mapWidth -lt 200) {
      $mapWidth = 200
    } elseif ($mapWidth -gt 800) {
      $mapWidth = 800
    }
    $mapHeight = $mapWidth * ($image.Height / $image.Width)
    return @{
      MapWidth = $mapWidth
      StartX = [Math]::Round(-$mapWidth * 0.32, 1)
      StartZ = [Math]::Round($mapHeight * 0.18, 1)
      Heading = 1.57079633
    }
  } finally {
    $image.Dispose()
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$mapsDir = Join-Path $repoRoot 'public\assets\maps'
$indexPath = Join-Path $mapsDir 'index.json'

if (-not (Get-Command magick -ErrorAction SilentlyContinue)) {
  throw 'ImageMagick `magick` command not found in PATH.'
}

if (-not (Test-Path $mapsDir)) {
  throw "Maps directory not found: $mapsDir"
}

$indexData = Get-Content -Raw -Encoding UTF8 $indexPath | ConvertFrom-Json
$maps = [System.Collections.Generic.List[string]]::new()
if ($indexData.maps) {
  foreach ($mapName in $indexData.maps) {
    $maps.Add([string]$mapName)
  }
}

$processed = @()
$jpgFiles = Get-ChildItem -Path $mapsDir -File | Where-Object { $_.Extension -in '.jpg', '.jpeg' } | Sort-Object Name

foreach ($jpgFile in $jpgFiles) {
  $baseName = $jpgFile.BaseName
  $webpPath = Join-Path $mapsDir ($baseName + '.webp')
  $jsonPath = Join-Path $mapsDir ($baseName + '.json')
  $didWork = $false

  if (-not (Test-Path $webpPath)) {
    & magick $jpgFile.FullName -quality 82 $webpPath
    $didWork = $true
  }

  if (-not (Test-Path $jsonPath)) {
    $config = Get-DefaultMapConfig -ImagePath $jpgFile.FullName
    $jsonContent = Build-MapJsonContent `
      -ImageFileName ($baseName + '.webp') `
      -MapWidth $config.MapWidth `
      -StartX $config.StartX `
      -StartZ $config.StartZ `
      -Heading $config.Heading
    Write-Utf8NoBom -Path $jsonPath -Content $jsonContent
    $didWork = $true
  }

  if (-not $maps.Contains($baseName)) {
    $maps.Add($baseName)
    $didWork = $true
  }

  if ($didWork) {
    $processed += $baseName
  }
}

$updatedIndexContent = Build-IndexJsonContent -Maps $maps.ToArray()
Write-Utf8NoBom -Path $indexPath -Content $updatedIndexContent

if ($processed.Count -eq 0) {
  Write-Host 'No new JPG assets needed processing.'
} else {
  Write-Host ('Processed maps: ' + ($processed -join ', '))
}
