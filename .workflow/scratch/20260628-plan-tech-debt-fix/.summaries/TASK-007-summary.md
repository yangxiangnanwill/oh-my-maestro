# TASK-007: 提取 host-service-coordinator 类型到 shared/

## 变更
- 新建 `src/shared/host-info-types.ts`: 提取所有纯类型定义 (ARCH-001)
- `host-service-coordinator.ts`: 从 shared 导入类型，re-export 保持向后兼容
- `tsconfig.json`: @superset/shared/host-info 路径指向 shared/host-info-types.ts

## 验证
- [x] `bun run typecheck` exit 0
- [x] 所有类型从 shared 层导出
- [x] tsconfig paths 不再指向 main/ 层
- [x] 向后兼容：host-service-coordinator.ts re-export 所有类型
