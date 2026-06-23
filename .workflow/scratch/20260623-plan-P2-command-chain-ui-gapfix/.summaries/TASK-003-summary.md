# TASK-003: 添加 Phase 2 新增文件的单元测试覆盖

## Changes
- `src/main/lib/command-chain-status-poller.test.ts`: 创建 Poller 单元测试（9 个 it 块），覆盖 start/stop 生命周期、getStatus 返回值、validateStatus 校验、无效 JSON/非对象/缺失字段等边界情况。使用 mkdtempSync + writeFileSync + rmSync 管理临时文件，遵循 bundled-cli.test.ts 模式
- `src/renderer/contexts/TranslationContext.test.tsx`: 创建 TranslationContext 单元测试（10 个 it 块），覆盖 TRANSLATIONS 映射表、translateLogic 纯函数（simple/advanced 模式、overrideMode、未匹配 key fallback）、useTranslation 未挂载 Provider 时的 fallback 行为。提取 translateLogic 纯函数避免 React 渲染依赖，遵循 useCurrentPlan.test.ts 模式
- `src/renderer/components/CommandChainPanel/CommandChainPanel.test.tsx`: 创建 CommandChainPanel 源码静态分析测试（8 个 test 块），验证 EmptyState/LoadingState/ErrorState 三个内部组件定义、CommandChainPanel 主组件包含关键 section（步骤进度/决策节点/完成确认）、ListChecks 图标使用。遵循 PromptGroup.test.ts 的源码静态分析模式
- `test-setup.ts`: 从 git 历史恢复（该文件在 a7651ee58 提交中被删除，但 bunfig.toml 仍引用它，导致所有测试无法运行）

## Verification
- [x] 文件 command-chain-status-poller.test.ts 存在且包含 >=3 个 it/test 块: 9 个 it 块
- [x] 文件 TranslationContext.test.tsx 存在且包含 >=3 个 it/test 块: 10 个 it 块
- [x] 文件 CommandChainPanel.test.tsx 存在且包含 >=2 个 it/test 块: 8 个 test 块
- [x] bun test 运行所有新增测试，通过率 >=80%: 27 pass, 0 fail (100%)
- [x] grep -l "from 'bun:test'" 在上述 3 个测试文件中均有匹配: 全部匹配

## Tests
- [x] `bun test src/main/lib/command-chain-status-poller.test.ts`: 9 pass, 0 fail
- [x] `bun test src/renderer/contexts/TranslationContext.test.tsx`: 10 pass, 0 fail
- [x] `bun test src/renderer/components/CommandChainPanel/CommandChainPanel.test.tsx`: 8 pass, 0 fail
- [x] 三文件联合运行: 27 pass, 0 fail

## Deviations
- 恢复了 test-setup.ts 文件（从 git 历史 a7651ee58^ 中提取）。该文件在之前的提交中被删除，但 bunfig.toml 仍将其列为 preload 依赖，导致所有 bun test 命令无法运行。这是项目预存问题，非本任务引入
- TranslationContext 测试采用纯函数提取模式（translateLogic），而非 React 组件渲染测试。这与 useCurrentPlan.test.ts 的测试模式一致，且任务 rationale 中明确允许此方式

## Notes
- test-setup.ts 的恢复是必要的副作用，后续任务如果也运行测试会受益
- CommandChainPanel 测试使用源码静态分析而非 DOM 渲染，无法捕获运行时错误，但这是项目现有模式且避免了搭建完整 tRPC/React 测试环境的复杂性
