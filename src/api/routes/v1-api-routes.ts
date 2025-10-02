import Router from "@koa/router";
import { getArrivals } from "../controllers/arrivals-controller";
import { getDepartures } from "../controllers/departures-controller";
import { getDetailedArrivals } from "../controllers/detailed-arrivals-controller.ts";
import { healthController } from "../controllers/health-controller";

const router = new Router({ prefix: "/api/v1" });

router.get("/health", healthController);
router.post("/arrivals", getArrivals);
router.post("/departures", getDepartures);
router.post("/arrivals/detailed", getDetailedArrivals);

export default router;
