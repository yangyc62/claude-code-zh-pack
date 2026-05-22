$ErrorActionPreference = "Stop"

[string]$repo = if ($env:CCCN_DIR) { $env:CCCN_DIR } else { "$env:USERPROFILE\.claude-code-cn-plus" }
[string]$claudeExe = if ($env:CLAUDE_EXE) { $env:CLAUDE_EXE } elseif (Test-Path -LiteralPath "$env:USERPROFILE\.local\bin\claude.exe") { "$env:USERPROFILE\.local\bin\claude.exe" } elseif (Test-Path -LiteralPath "D:\ClaudeCode\bin\claude.exe") { "D:\ClaudeCode\bin\claude.exe" } else { (Get-Command claude -ErrorAction SilentlyContinue | Select-Object -First 1).Source }

if (-not (Test-Path -LiteralPath $repo)) {
  throw "claude-code-cn-plus not found: $repo"
}
if (-not (Test-Path -LiteralPath $claudeExe)) {
  throw "Claude executable not found. Set CLAUDE_EXE first."
}

$env:CLAUDE_EXE = $claudeExe
$env:CCCN_DIR = $repo

Push-Location $repo
try {
@'
import('tweakcc').then(async (m) => {
  const inst = { path: process.env.CLAUDE_EXE || 'D:\\ClaudeCode\\bin\\claude.exe', kind: 'native', version: process.env.CLAUDE_VERSION || '2.1.126' };
  const s = await m.readContent(inst);
  const checks = [
    'Welcome to Claude Code',
    'Select login method:',
    'Set up AWS Bedrock',
    'Set up Google Vertex AI',
    'Pin model versions',
    'Working Directory Has Changes',
    'Would you like to create a manifest.json file?',
    'Your organization has configured managed settings',
    'iTerm2 Split Pane Setup',
    'Submit Feedback / Bug Report',
    'Search settings\\u2026',
    'System diagnostics',
    'MCP Config Diagnostics',
    'Extra usage is required for 1M context',
    'Accessing workspace:',
    'Quick safety check: Is this a project you created or one you trust?',
    'Yes, I trust this folder',
    'Security notes:',
    'Claude can make mistakes',
    "You should always review Claude's responses",
    'Due to prompt injection risks',
  ];
  let failed = 0;
  for (const q of checks) {
    const idx = s.indexOf(q);
    console.log(`${idx === -1 ? 'OK  ' : 'LEFT'} ${q} @ ${idx}`);
    if (idx !== -1) failed++;
  }
  console.log(`failed=${failed}`);
  process.exit(failed ? 1 : 0);
});
'@ | node
} finally {
  Pop-Location
}
