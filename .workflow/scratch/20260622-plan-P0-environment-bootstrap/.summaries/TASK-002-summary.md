# TASK-002: Shell 环境适配 — getDefaultShell PowerShell 优先 + setup.local.ps1

## Changes
- `D:/WorkSpace/GitRepoes/superset/apps/desktop/src/main/lib/terminal/env.ts`: 
  - `getDefaultShell()` (line 90-104): 修改 win32 分支，优先探查 pwsh.exe (PowerShell 7) 和内置 WindowsPowerShell\\powershell.exe，回退到 COMSPEC 或 cmd.exe
  - `startLocaleProbe()` (line 20-43): 在函数开头添加 `if (os.platform() === "win32") { cachedUtf8Locale = "en_US.UTF-8"; return; }` 跳过 POSIX locale 探测
- `D:/WorkSpace/GitRepoes/superset/.superset/setup.local.ps1`: 新建，最小化 Windows PowerShell 环境引导脚本，检查 bun/node 版本，复制 .env.local.example → .env

## Verification
- [x] grep -c 'powershell.exe' env.ts 返回 >= 1: 返回 1
- [x] startLocaleProbe 包含 win32 跳过逻辑: 第 24-25 行 confirmed (os.platform() === "win32" → cachedUtf8Locale = "en_US.UTF-8")
- [x] D:/WorkSpace/GitRepoes/superset/.superset/setup.local.ps1 文件存在: EXISTS
- [x] D:/WorkSpace/GitRepoes/superset/.superset/setup.local.ps1 包含 'bun --version' 检查: 返回 1
- [x] findBinaryPathsWindows 在 utils.ts 已存在: confirmed at line 41

## Tests
- [x] grep -n 'powershell' env.ts: passed (line 95-96)
- [x] grep -n 'win32' env.ts: passed (lines 24, 52, 90, 306, 422)
- [x] cat setup.local.ps1: exists

## Deviations
- 第一个收敛标准 `grep -c 'win32.*en_US'` 返回 0，因为 win32 和 en_US 在不同行（第 24 行和第 25 行）。实际逻辑正确实现：`os.platform() === "win32"` 检查后设置 `cachedUtf8Locale = "en_US.UTF-8"`。
- shell-wrappers.ts 的 `getShellEnv()` 函数在 shell 为 powershell.exe 时返回空对象 {}（已有逻辑 match shellName !== "zsh"），无需额外修改 buildTerminalEnv()。

## Notes
- PowerShell 7 路径 `C:\Program Files\PowerShell\7\pwsh.exe` 优先于内置 WindowsPowerShell
- setup.local.ps1 是最小化版本，不包含 Docker/Postgres 设置（Windows 上 Phase 0 不需要）
- FALLBACK_SHELL 常量（第 52 行）保持 `cmd.exe` 作为后备，与 getDefaultShell 的优先级变更一致
