import { createTRPCRouter } from "./create-context";
import { licenseRouter } from "./routes/license";

export const appRouter = createTRPCRouter({
  license: licenseRouter,
});

export type AppRouter = typeof appRouter;
