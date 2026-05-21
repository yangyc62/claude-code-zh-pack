param(
  [string]$ClaudeExe = "",
  [string]$CccnDir = "$env:USERPROFILE\.claude-code-cn-plus",
  [string]$ClaudeVersion = "2.1.126"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ClaudeExe)) {
  if (Test-Path -LiteralPath "D:\ClaudeCode\bin\claude.exe") {
    $ClaudeExe = "D:\ClaudeCode\bin\claude.exe"
  } else {
    $candidate = (Get-Command claude -ErrorAction SilentlyContinue | Select-Object -First 1).Source
    if ($candidate) {
      $ClaudeExe = $candidate
    }
  }
}

if (-not (Test-Path -LiteralPath $ClaudeExe)) {
  throw "Claude executable not found: $ClaudeExe"
}

if (-not (Test-Path -LiteralPath $CccnDir)) {
  throw "claude-code-cn-plus not found: $CccnDir. Clone https://github.com/Gdenian/claude-code-cn-plus first."
}

Get-Process -Name claude -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -eq $ClaudeExe } |
  Stop-Process -Force

$env:CLAUDE_EXE = $ClaudeExe
$env:CCCN_DIR = $CccnDir
$env:CLAUDE_VERSION = $ClaudeVersion
node (Join-Path $PSScriptRoot "apply-localization.js")
