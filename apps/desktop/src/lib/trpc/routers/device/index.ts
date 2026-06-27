import { getHostId } from "main/lib/host-service-coordinator";
import { publicProcedure, router } from "../..";

export const createDeviceRouter = () => {
	return router({
		getMachineId: publicProcedure.query((): { machineId: string } => {
			return { machineId: getHostId() };
		}),
	});
};
