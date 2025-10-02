import Router from "@koa/router";
import {
  getArrivals,
  getDepartures,
  getDetailedArrivals,
} from "@/api/controllers/darwin-base-class-controller";

const router = new Router();

router.post("/arrivals", getArrivals);
router.post("/departures", getDepartures);
router.post("/arrivals/detailed", getDetailedArrivals);

export default router;
