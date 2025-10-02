import Router from "@koa/router";
import { healthController } from "../controllers/health-controller";

const router = new Router();

router.get("/health", healthController);

export default router;
