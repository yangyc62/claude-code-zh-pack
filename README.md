# Claude Code 简体中文增强汉化包

这是一个面向 Windows 版 Claude Code 的简体中文汉化资源包，基于 [Gdenian/claude-code-cn-plus](https://github.com/Gdenian/claude-code-cn-plus) 的补丁引擎整理。

本仓库不替代 `claude-code-cn-plus`，而是提供一份增强后的 `keyword.js` 词库和一键安装脚本。当前词库针对 `Claude Code 2.1.126` 做了可见页面补充，覆盖登录、AWS Bedrock、Google Vertex AI、模型固定、设置、状态、MCP、权限、反馈、统计、Teleport、extra usage、后台任务等常见界面分支。

## 工作原理

```text
Gdenian/claude-code-cn-plus = 补丁引擎
claude-code-zh-pack = 增强词库 + 一键复用脚本
```

安装脚本会把本仓库的 `keyword.js` 同步到本机的 `claude-code-cn-plus/localize/keyword.js`，然后调用 `claude-code-cn-plus` 的 `patchCli` 给 `claude.exe` 打补丁。

## 前置条件

- Windows
- Node.js
- 已安装 Claude Code
- 已克隆并安装 `claude-code-cn-plus`

示例：

```powershell
git clone https://github.com/Gdenian/claude-code-cn-plus.git $env:USERPROFILE\.claude-code-cn-plus
cd $env:USERPROFILE\.claude-code-cn-plus
npm install
```

## 安装汉化

```powershell
git clone https://github.com/yangyc62/claude-code-zh-pack.git
cd claude-code-zh-pack
.\install.ps1
```

默认会优先查找：

- `D:\ClaudeCode\bin\claude.exe`
- PATH 中的 `claude`

如果你的路径不同，可以手动指定：

```powershell
.\install.ps1 `
  -ClaudeExe "D:\ClaudeCode\bin\claude.exe" `
  -CccnDir "$env:USERPROFILE\.claude-code-cn-plus" `
  -ClaudeVersion "2.1.126"
```

脚本会自动结束正在占用目标 `claude.exe` 的旧 `claude` 进程，然后重新打补丁。

## 验证

```powershell
.\verify-visible.ps1
```

输出 `failed=0` 表示关键可见页面英文检查通过。

## 更新词库后重新应用

```powershell
git pull
.\install.ps1
.\verify-visible.ps1
```

## 覆盖范围说明

本包重点覆盖用户能直接看到的终端 UI 文案。二进制内仍会保留一些不建议翻译的英文内容，例如：

- SDK / API 协议字段
- HTTP header、URL、模型 ID、环境变量
- 命令名、配置 key、文件名
- 第三方库内部错误和调试日志

这些内容被保留是为了避免破坏运行逻辑。

## 致谢

- 补丁引擎来自 [Gdenian/claude-code-cn-plus](https://github.com/Gdenian/claude-code-cn-plus)
- 本仓库维护增强词库和 Windows 一键复用脚本
