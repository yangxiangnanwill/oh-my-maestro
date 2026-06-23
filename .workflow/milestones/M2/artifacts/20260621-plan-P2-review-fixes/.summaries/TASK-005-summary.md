# TASK-005: 用 DOMPurify 替代手写正则修复 XSS 防护

## 变更

- `src/lib/client/components/AIDialog.svelte`: 
  - 在 script 顶部添加 `import DOMPurify from 'dompurify';` 导入
  - 删除 `sanitizeHtml` 函数（原第 41-48 行，含 4 个手写正则替换）
  - 修改 `renderMarkdown` 函数，将 `sanitizeHtml(raw)` 替换为 `DOMPurify.sanitize(raw)`
  - 修改 `renderMarkdown` 的 catch 分支，将 `sanitizeHtml(text)` 替换为 `DOMPurify.sanitize(text)`

## 验证

- [x] grep -n "dompurify" package.json 返回匹配行: 第 20 行 `@types/dompurify`、第 25 行 `dompurify`
- [x] grep -n "import DOMPurify" AIDialog.svelte 返回匹配行: 第 6 行
- [x] grep -n "DOMPurify.sanitize" AIDialog.svelte 返回匹配行: 第 45、47 行
- [x] grep -n "function sanitizeHtml" AIDialog.svelte 无匹配 (函数已删除)
- [x] grep -n "\.replace(/<script" AIDialog.svelte 无匹配 (手写正则已删除)
- [x] npx tsc --noEmit 通过 (无错误输出)

## 测试

- [x] npx tsc --noEmit: 通过 (无错误)
- [x] npm ls dompurify: 通过 (dompurify@3.4.11)

## 偏差

- 无。所有变更严格按照任务定义执行。implementation 第 1 步（安装依赖）已事先完成，直接跳过。

## 备注

- dompurify 和 @types/dompurify 已通过 npm install 预先安装
- SEC-005 问题修复完成，手写正则过滤代码已完全移除
