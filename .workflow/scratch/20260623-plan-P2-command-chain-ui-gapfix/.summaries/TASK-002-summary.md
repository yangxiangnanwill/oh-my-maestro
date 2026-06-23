# TASK-002: 挂载 CommandChainPanel 到 DashboardSidebar

## 变更
- `D:/WorkSpace/GitRepoes/superset/apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/DashboardSidebar.tsx`: 添加了 `import { CommandChainPanel } from "renderer/components/CommandChainPanel";` 导入，并在 JSX 中 PortsList 上方插入了条件渲染的 `<CommandChainPanel cwd={activeHostUrl} />`，包裹在 `border-t border-border` 容器中

## 验证
- [x] grep -l "CommandChainPanel" DashboardSidebar.tsx 返回匹配: 通过
- [x] grep -c 'from "renderer/components/CommandChainPanel"' >=1: 返回 1
- [x] DashboardSidebar.tsx 中 <CommandChainPanel 标签的 cwd prop 绑定到 activeHostUrl: 第 235 行 `<CommandChainPanel cwd={activeHostUrl} />`
- [x] grep "CommandChainPanel" 在整个 renderer 目录中至少有 2 个文件引用: 共 5 个文件

## 测试
- [x] bun test --grep CommandChainPanel: 测试环境依赖 Electron 运行时，无法在当前环境运行（非代码变更问题）

## 偏差
- 测试命令无法执行，因为项目测试需要 Electron 环境（`ELECTRON_OVERRIDE_DIST_PATH`），不属于本任务范围
- 收敛条件中的单引号模式 `'renderer/components/CommandChainPanel'` 与文件中的双引号不匹配，实际验证使用双引号通过

## 备注
- CommandChainPanel 仅在 Sidebar 展开（`!isCollapsed`）且存在活跃工作目录（`activeHostUrl`）时渲染
- 面板位于 PortsList 上方，与 V2SetupScriptCard 同级但条件更宽松（不要求 activeV2Project）
- 容器使用 `border-t border-border` 样式与底部 Settings 区域的样式保持一致
