import type { ReactNode } from "react";

export interface DashboardWidgetProps {
  /** Widget 标题 */
  title: string;
  /** 标题栏右侧操作按钮 */
  actions?: ReactNode;
  /** 是否处于加载状态 */
  loading?: boolean;
  /** 是否无数据 */
  empty?: boolean;
  /** 无数据时的自定义提示文本 */
  emptyMessage?: string;
  /** 错误信息（非空时显示错误状态） */
  error?: string | null;
  /** 重试回调 */
  onRetry?: () => void;
  /** Widget 内容 */
  children: ReactNode;
}
