// Stub: @superset/chat/client
// Provides tRPC React client for chat service communication.
// Full implementation pending chat package migration.

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "lib/trpc/routers";

export const chatServiceTrpc = createTRPCReact<AppRouter>({
  abortOnUnmount: true,
});
