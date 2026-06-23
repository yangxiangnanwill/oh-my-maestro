# TASK-003: 提取 extractFunctionSource 到共享测试工具模块

## 变更
- `src/renderer/test-utils/source-analysis.ts`: 新建文件，导出 extractFunctionSource(source, name) 函数，统一了两处内联实现的逻辑
- `src/renderer/components/CommandChainPanel/CommandChainPanel.test.tsx`: 删除内联 extractFunctionSource 定义（原第21-56行），改为从 test-utils/source-analysis 相对路径导入，调用改为传入 source 参数
- `src/renderer/components/NewWorkspaceModal/components/PromptGroup/PromptGroup.test.ts`: 删除内联 extractFunctionSource 定义（原第43-75行），改为从 test-utils/source-analysis 相对路径导入，调用改为传入 source 参数

## 验证
- [x] grep 确认 CommandChainPanel.test.tsx 中无 `function extractFunctionSource` 定义
- [x] grep 确认 PromptGroup.test.ts 中无 `function extractFunctionSource` 定义
- [x] grep 确认 source-analysis.ts 中有 `extractFunctionSource` 导出
- [x] bun test 两个测试文件: 10 pass / 0 fail

## 测试
- [x] `bun test src/renderer/components/CommandChainPanel/CommandChainPanel.test.tsx src/renderer/components/NewWorkspaceModal/components/PromptGroup/PromptGroup.test.ts`: 10 pass, 0 fail

## 偏差
- 导入路径: 任务计划使用 `renderer/test-utils/source-analysis` 别名路径，但 bun test 不经过 Vite，无法解析此别名。改为使用相对路径导入（`../../test-utils/source-analysis` 和 `../../../../test-utils/source-analysis`）
- 之前的 TASK-002 提交意外删除了 PromptGroup.test.ts，此提交将其恢复

## 备注
- extractFunctionSource 现在有唯一实现位于 test-utils/source-analysis.ts，未来其他静态源码分析测试可直接导入复用
