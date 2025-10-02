import Router from "@koa/router";
import {
  getArrivals,
  getDepartures,
  getDetailedArrivals,
  getDetailedDepartures,
} from "@/api/controllers/darwin-base-class-controller";

const router = new Router();

router.post("/arrivals", getArrivals);
router.post("/arrivals/detailed", getDetailedArrivals);
router.post("/departures", getDepartures);
router.post("/departures/detailed", getDetailedDepartures);

export default router;
