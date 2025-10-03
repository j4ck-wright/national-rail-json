import Router from "@koa/router";
import {
  getArrivals,
  getDepartures,
  getDetailedArrivals,
  getDetailedDepartures,
} from "@/api/controllers/darwin-base-class-controller";

const router = new Router();

router.get("/arrivals", getArrivals);
router.get("/arrivals/detailed", getDetailedArrivals);
router.get("/departures", getDepartures);
router.get("/departures/detailed", getDetailedDepartures);

export default router;
