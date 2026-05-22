const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

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
    '? for shortcuts',
    '? 查看快捷键',
  ],
  [
    'Auto mode lets Claude handle permission prompts automatically — Claude checks each tool call for risky actions and prompt injection before executing. Actions Claude identifies as safe are executed, while actions Claude identifies as risky are blocked and Claude may try a different approach. Ideal for long-running tasks. Sessions are slightly more expensive. Claude can make mistakes that allow harmful commands to run, it\'s recommended to only use in isolated environments. Shift+Tab to change mode.',
    '自动模式会让 Claude 自动处理权限提示：Claude 会在执行前检查每个工具调用是否包含风险操作和提示注入。Claude 认为安全的操作会被执行，认为有风险的操作会被阻止，并可能尝试其他方式。适合长时间运行的任务。会话费用会略高。Claude 也可能判断失误，导致有害命令运行，因此建议只在隔离环境中使用。可按 Shift+Tab 切换模式。',
  ],
  [
    'Claude can make mistakes that allow harmful commands to run, it\'s recommended to only use in isolated environments. Shift+Tab to change mode.',
    'Claude 也可能判断失误，导致有害命令运行，因此建议只在隔离环境中使用。可按 Shift+Tab 切换模式。',
  ],
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
  const tweakccPackage = path.join(repoDir, 'node_modules', 'tweakcc', 'package.json');
  const tweakccMain = JSON.parse(fs.readFileSync(tweakccPackage, 'utf8')).main;
  const tweakccPath = path.join(path.dirname(tweakccPackage), tweakccMain);
  const tweakcc = await import(pathToFileURL(tweakccPath).href);
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
