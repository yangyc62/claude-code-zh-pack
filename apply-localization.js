const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function firstExisting(paths) {
  return paths.find((item) => item && fs.existsSync(item));
}

function findClaudeExe() {
  const explicit = process.env.CLAUDE_EXE;
  if (explicit) return explicit;

  const bundled = firstExisting([
    path.join(process.env.USERPROFILE || '', '.local', 'bin', 'claude.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Claude Code', 'claude.exe'),
  ]);
  if (bundled) return bundled;

  throw new Error('Claude executable not found. Set CLAUDE_EXE to the full path of claude.exe.');
}

function detectClaudeVersion(exePath) {
  if (process.env.CLAUDE_VERSION) return process.env.CLAUDE_VERSION;

  const output = execFileSync(exePath, ['--version'], { encoding: 'utf8' }).trim();
  const match = output.match(/^(\d+\.\d+\.\d+)/);
  if (!match) throw new Error(`Unable to parse Claude version from: ${output}`);
  return match[1];
}

const repoDir = process.env.CCCN_DIR || path.join(process.env.USERPROFILE || '', '.claude-code-cn-plus');
const targetExe = findClaudeExe();
const targetClaudeDir = process.env.CLAUDE_DIR || path.join(path.dirname(path.dirname(targetExe)), '.claude');
const packKeyword = path.join(__dirname, 'keyword.js');
const repoKeyword = path.join(repoDir, 'localize', 'keyword.js');

const postPatchReplacements = [
  [
    'gc8.default.createElement(MY,null,"(",w," to ",K,")")',
    'gc8.default.createElement(MY,null,"(",w," ",K,")")',
  ],
  [
    'gc8.default.createElement(MY,null,w," to ",K)',
    'gc8.default.createElement(MY,null,w," ",K)',
  ],
];

async function applyPostPatch(installation) {
  const tweakcc = await import('tweakcc');
  if (typeof tweakcc.readContent !== 'function' || typeof tweakcc.writeContent !== 'function') {
    return { replacements: 0 };
  }

  let content = await tweakcc.readContent(installation);
  let replacements = 0;
  for (const [source, target] of postPatchReplacements) {
    const count = content.split(source).length - 1;
    if (count > 0) {
      content = content.split(source).join(target);
      replacements += count;
    }
  }

  if (replacements > 0) {
    await tweakcc.writeContent(installation, content);
  }

  return { replacements };
}

async function main() {
  if (!fs.existsSync(targetExe)) throw new Error(`Claude executable not found: ${targetExe}`);
  if (!fs.existsSync(repoDir)) throw new Error(`cccn repo not found: ${repoDir}`);
  if (!fs.existsSync(packKeyword)) throw new Error(`keyword.js not found: ${packKeyword}`);

  fs.copyFileSync(packKeyword, repoKeyword);

  const { patchCli } = require(path.join(repoDir, 'src', 'installer'));
  const installation = { kind: 'native', path: targetExe, version: detectClaudeVersion(targetExe) };
  const result = await patchCli({ claudeDir: targetClaudeDir, installDir: repoDir, installation }, installation);
  const postPatch = await applyPostPatch(installation);

  console.log(JSON.stringify({
    targetExe,
    version: installation.version,
    matchedEntries: result.report.matchedEntries,
    replacements: result.report.replacements,
    postPatchReplacements: postPatch.replacements,
    hashChanged: result.originalHash !== result.patchedHash,
  }, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
