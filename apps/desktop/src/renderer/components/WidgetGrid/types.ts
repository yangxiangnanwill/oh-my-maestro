import type { ReactNode } from "react";

export interface WidgetGridProps {
  /** 列数，默认 2 */
  columns?: number;
  /** 间距（px），默认 16 */
  gap?: number;
  /** 网格内容 */
  children: ReactNode;
}
