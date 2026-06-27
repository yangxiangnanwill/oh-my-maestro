import { publicProcedure, router } from "../..";
import {
	getPermissionStatus,
	requestAccessibility,
	requestAppleEvents,
	requestLocalNetwork,
	requestMicrophone,
} from "./native-permissions";

export const createPermissionsRouter = () => {
	return router({
		getStatus: publicProcedure.query(() => {
			return getPermissionStatus();
		}),

		requestAccessibility: publicProcedure.mutation(async () => {
			await requestAccessibility();
		}),

		requestMicrophone: publicProcedure.mutation(async () => {
			return requestMicrophone();
		}),

		requestAppleEvents: publicProcedure.mutation(async () => {
			await requestAppleEvents();
		}),

		requestLocalNetwork: publicProcedure.mutation(async () => {
			await requestLocalNetwork();
		}),
	});
};

export type PermissionsRouter = ReturnType<typeof createPermissionsRouter>;
