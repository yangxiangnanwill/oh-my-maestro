/**
 * 共享测试工具：从源码字符串中提取指定函数的完整定义。
 *
 * 用于静态源码分析测试（无需渲染组件即可验证函数/组件结构）。
 */

/**
 * 从源码字符串中提取指定函数的完整定义。
 *
 * 通过 `function <name>` marker 定位函数定义，追踪括号深度到参数列表结束，
 * 追踪大括号深度到函数体结束，返回完整函数源码字符串。
 *
 * @param source - 源码字符串
 * @param name   - 函数名
 * @returns 从 `function ${name}` 到闭合 `}` 的完整函数源码
 * @throws 如果找不到函数定义或无法解析参数列表/函数体
 */
export function extractFunctionSource(source: string, name: string): string {
	// 匹配 "function Name" 开头（不要求紧跟括号，兼容泛型参数等变体）
	const marker = `function ${name}`;
	const start = source.indexOf(marker);
	if (start === -1) throw new Error(`${name} not found in source`);

	// 找到参数列表结束位置（追踪括号深度）
	let parenDepth = 0;
	let paramsEnd = -1;
	for (let i = start + marker.length; i < source.length; i++) {
		const ch = source[i];
		if (ch === "(") parenDepth++;
		else if (ch === ")") {
			parenDepth--;
			if (parenDepth === 0) {
				paramsEnd = i;
				break;
			}
		}
	}
	if (paramsEnd === -1)
		throw new Error(`Could not find end of ${name} parameter list`);

	// 找到函数体（追踪大括号深度）
	const braceStart = source.indexOf("{", paramsEnd);
	let depth = 0;
	for (let i = braceStart; i < source.length; i++) {
		const ch = source[i];
		if (ch === "{") depth++;
		else if (ch === "}") {
			depth--;
			if (depth === 0) return source.slice(start, i + 1);
		}
	}
	throw new Error(`Could not find end of ${name} function`);
}
