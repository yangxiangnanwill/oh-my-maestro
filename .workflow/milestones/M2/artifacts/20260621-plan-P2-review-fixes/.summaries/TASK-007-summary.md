# TASK-007 Summary

**修复**: MAINT-002 技术债务标记 — deferred [MAINT-002]

## 变更

### terminal-manager.ts
- TerminalManager 类 JSDoc 中添加 `TODO(MAINT-002)` 注释

### dialog-manager.ts
- DialogManager 类 JSDoc 中添加 `TODO(MAINT-002)` 注释

## 决策
提取泛型 SessionManager<T> 基类推迟到 Phase 3 (Trust & Polish)。原因：
1. 约 40% 代码量重构，风险较高
2. gap-fix 目标是修复 critical/high bug，不是架构改进
3. 两个 Manager 的行为差异需要仔细设计泛型抽象

## 验证
- grep 确认两个文件中均存在 TODO(MAINT-002) 注释
