import Router from "@koa/router";
import {
  getArrivals,
  getDepartures,
  getDetailedArrivals,
} from "@/api/controllers/darwin-base-class-controller";
import { healthController } from "@/api/controllers/health-controller";

const router = new Router({ prefix: "/api/v1" });

router.get("/health", healthController);
router.post("/arrivals", getArrivals);
router.post("/departures", getDepartures);
router.post("/arrivals/detailed", getDetailedArrivals);

export default router;
