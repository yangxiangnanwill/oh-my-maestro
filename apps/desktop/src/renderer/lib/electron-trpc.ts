import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "lib/trpc/routers";

export const electronTrpc = createTRPCReact<AppRouter>();
