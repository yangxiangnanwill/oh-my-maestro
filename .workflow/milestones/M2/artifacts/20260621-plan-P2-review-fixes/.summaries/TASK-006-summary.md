# TASK-006 Summary

**修复**: terminal-manager.ts shell 参数白名单验证 [SEC-001]

## 变更

### terminal-manager.ts
1. **新增 SHELL_WHITELIST 常量**: Set 包含 8 个允许的 shell（powershell.exe, cmd.exe, pwsh.exe, bash, zsh, sh, fish, dash）
2. **createTerminal 中添加验证**: 提取 shell 路径的文件名部分（防止路径遍历），检查是否在白名单中，不在则抛出 Error

## 验证
- 25/25 vitest 测试通过
- tsc --noEmit 无错误
- 所有 8 个 convergence criteria 通过
- 默认 shell（powershell.exe / /bin/bash）在白名单中，不影响正常使用
