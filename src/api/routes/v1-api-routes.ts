import Router from "@koa/router";
import { getArrivals } from "../controllers/arrivals-controller";
import { getDepartures } from "../controllers/departures-controller";
import { healthController } from "../controllers/health-controller";

const router = new Router({ prefix: "/api/v1" });

router.get("/health", healthController);
router.post("/arrivals", getArrivals);
router.post("/departures", getDepartures);

export default router;
