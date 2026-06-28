/**
 * Stub: lib/trpc/routers/auth/utils/auth-functions
 *
 * Phase 3: Minimal stub. Auth utility functions will be implemented
 * when authentication is migrated from Superset in Phase 4.
 */

import { EventEmitter } from "node:events";

/**
 * Event emitter for auth-related events.
 * Used by tRPC subscription to notify renderer of token changes.
 *
 * Events:
 * - "token-saved": { token, expiresAt } - New token saved (OAuth callback)
 * - "token-cleared": (no data) - Token deleted (sign-out)
 *
 * Phase 4: 限制 EventEmitter 可见性（不导出），通过封装函数访问以防止令牌泄露。
 */
export const authEvents = new EventEmitter();

export function getAuthToken(): string | null {
  return null;
}

/**
 * Phase 4: 实现真实的 token 验证逻辑。
 * 当前 stub 始终返回 false — 调用方必须正确处理 false 返回值（拒绝访问）。
 */
export function validateAuthToken(_token: string): boolean {
  return false;
}

/**
 * Phase 4: 实现真实的 OAuth 回调处理。
 * 当前 stub 始终返回 success: false。
 */
export function handleAuthCallback(_params: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  return Promise.resolve({ success: false, error: "Not implemented" });
}

// Phase 4: Updated to return object shape for settings router compatibility (migrated from Superset)
export async function loadToken(): Promise<{
  token: string | null;
  expiresAt: string | null;
}> {
  return { token: null, expiresAt: null };
}

/**
 * Phase 4: 实现真实的 deep link 解析。
 * 当前返回 null 以防止空对象 {} 被误判为 truthy 认证参数（COR-001 修复）。
 */
export function parseAuthDeepLink(_url: string): Record<string, string> | null {
  return null;
}
