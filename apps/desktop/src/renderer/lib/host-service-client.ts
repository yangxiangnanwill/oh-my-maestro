import type { AppRouter, HostServiceProcedures } from "./host-service/host-service-router";
import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import { getHostServiceHeaders } from "./host-service-auth";

const clientCache = new Map<
  string,
  ReturnType<typeof createTRPCClient<AppRouter>>
>();

export type HostServiceClient = ReturnType<typeof createTRPCClient<AppRouter>>;

/**
 * Typed accessor for host-service procedures. Since the AppRouter is a stub
 * (extends AnyRouter), the tRPC client doesn't know the procedure tree shape.
 * This helper casts the client to the known procedure interface so hooks
 * can call methods without type errors.
 *
 * Phase 5: Remove this cast when the actual host-service AppRouter type
 * is integrated from the host-service package.
 */
export function getHostServiceProcedures(
  hostUrl: string,
): HostServiceProcedures {
  return getHostServiceClientByUrl(hostUrl) as unknown as HostServiceProcedures;
}

export function getHostServiceClient(port: number): HostServiceClient {
  return getHostServiceClientByUrl(`http://127.0.0.1:${port}`);
}

export function getHostServiceClientByUrl(hostUrl: string): HostServiceClient {
  const cached = clientCache.get(hostUrl);
  if (cached) return cached;

  const client = createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${hostUrl}/trpc`,
        transformer: superjson,
        headers: () => getHostServiceHeaders(hostUrl),
      }),
    ],
  });

  clientCache.set(hostUrl, client);
  return client;
}
