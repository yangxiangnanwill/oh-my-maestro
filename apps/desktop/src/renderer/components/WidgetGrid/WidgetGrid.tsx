import type { CSSProperties } from "react";
import type { WidgetGridProps } from "./types";

export function WidgetGrid({ columns = 2, gap = 16, children }: WidgetGridProps) {
  const gridStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: `${gap}px`,
    padding: "16px",
    overflow: "auto",
    alignContent: "flex-start",
  };

  // 响应式：窄屏单列
  const itemStyle: CSSProperties = {
    flex: `1 1 calc(${100 / columns}% - ${gap * (columns - 1) / columns}px)`,
    minWidth: "280px",
    minHeight: "200px",
    maxHeight: "480px",
  };

  return (
    <div style={gridStyle}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list, no reordering
            <div key={index} style={itemStyle}>
              {child}
            </div>
          ))
        : (
          <div style={itemStyle}>{children}</div>
        )}
    </div>
  );
}
