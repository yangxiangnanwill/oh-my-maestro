# Context: S4 — 编译验证

**Date**: 2026-06-27
**Areas discussed**: S4 范围定义, excluded 文件处理策略, 缺失模块处理, stub 修复, 路由类型, 隐式 any

---

## Decisions

### Decision 1: S4 范围重新定义
- **Context**: 原计划 S4 是纯验证里程碑（编译+启动），但实际发现非 excluded 代码已有 532 个类型错误
- **Options**:
  1. 仅解除 excluded 文件（不可行 — 非 excluded 代码本身无法编译）
  2. 修复所有错误 + 解除 excluded 文件（推荐）
  3. 拆分 S4 为 S4a + S4b
- **Chosen**: 选项 2 — 修复所有错误 + 分阶段解除 excluded 文件
- **Reason**: 非 excluded 代码的类型错误必须先修复，否则解除 excluded 文件无意义

### Decision 2: DashboardSidebar.tsx 推迟到 S5
- **Context**: 12 个缺失依赖文件，属于未迁移的完整功能模块
- **Options**:
  1. 在 S4 中完整迁移（工作量大，风险高）
  2. 推迟到 S5（推荐）
  3. 永久移除
- **Chosen**: 选项 2 — 推迟到 S5
- **Reason**: 编译验证里程碑不适合做功能模块迁移

### Decision 3: 缺失 npm 包 — bun add 安装
- **Context**: 160 个 TS2307 错误，其中 ~90 个是 npm 包未安装
- **Options**:
  1. bun add 安装所有缺失包（推荐）
  2. 创建 stub 替代
  3. 移除引用代码
- **Chosen**: 选项 1 — bun add 安装
- **Reason**: 这些是 Superset Chat 组件的运行时依赖，S3 迁移时遗漏了声明

### Decision 4: shadcn/ui Stub — 扩展 Props
- **Context**: 126 个 TS2322 错误，主要是 stub 组件缺少 props
- **Options**:
  1. 扩展 stub props（推荐）
  2. 替换为真实 shadcn/ui
  3. 混合策略
- **Chosen**: 选项 1 — 扩展 stub props
- **Reason**: S4 目标是编译通过，UI 完善留给后续里程碑

### Decision 5: 路由类型 — 重新生成 routeTree
- **Context**: 11 个路由类型错误，routeTree.gen.ts 只有 root route
- **Options**:
  1. 重新生成路由树（推荐）
  2. 手动添加类型声明
  3. @ts-nocheck 跳过
- **Chosen**: 选项 1 — 重新生成路由树
- **Reason**: 类型安全，自动同步

---

## Constraints

### Locked
1. **S4 范围**: 修复现有 532 个类型错误 + 解除 index.full.ts 和 -layout.tsx 的排除
2. **DashboardSidebar.tsx**: 保持 excluded，推迟到 S5
3. **pty-subprocess.ts**: 先修复 process-tree-stub.ts 签名，再解除排除
4. **缺失 npm 包**: 使用 `bun add` 安装，不创建替代 stub
5. **shadcn/ui stub**: 扩展 props，不替换为真实组件
6. **路由类型**: 重新生成 routeTree.gen.ts
7. **每个 excluded 文件解除**: 单独 commit，支持独立 revert

### Free
1. **隐式 any 修复策略**: 逐文件添加类型注解 或 临时放宽 `noImplicitAny`
2. **修复顺序**: 实现者可自行决定各修复类别的执行顺序
3. **Stub 模块实现细节**: 最小导出即可，不需要完整实现

### Deferred
1. **DashboardSidebar 完整迁移**: 推迟到 S5 里程碑
2. **真实 shadcn/ui 替换**: 推迟到 UI 打磨里程碑
3. **pty-subprocess.ts 解除排除**: 依赖 process-tree-stub.ts 修复完成后
4. **原生模块 Windows 运行时验证**: 编译通过后进行
5. **CI/CD 配置**: 编译通过后配置

---

## Code Context

### 关键文件
- `apps/desktop/tsconfig.json` — 编译配置，4 个 excluded 文件
- `apps/desktop/package.json` — 缺失 35 个 npm 包依赖
- `apps/desktop/src/renderer/routeTree.gen.ts` — 只有 root route，需重新生成
- `apps/desktop/src/main/lib/terminal-host/process-tree-stub.ts` — 3 个函数签名不兼容
- `apps/desktop/src/renderer/components/Chat/stubs/ui/*.tsx` — 39 个 stub 需扩展 props

### 错误分布
| 错误代码 | 数量 | 修复策略 |
|---------|------|---------|
| TS2307 | 160 | bun add (~90) + 创建 stub (~70) |
| TS2322 | 126 | 扩展 stub props (~50) + 其他修复 (~76) |
| TS7006 | 104 | 添加类型注解 |
| TS7031 | 39 | 添加类型注解 |
| TS2339 | 60 | 逐一修复 |
| 其他 | 43 | 逐一修复 |
