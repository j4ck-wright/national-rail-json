import cors from "@koa/cors";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { globalErrorCatcher } from "@/api/middleware/error-handler";
import { logRoute } from "@/api/middleware/log-route";
import darwinRoutes from "@/api/routes/darwin-routes";
import healthRoute from "@/api/routes/health-route";
import swaggerRoutes from "@/api/routes/swagger-routes";
import { config } from "@/utils/config";
import { logger } from "@/utils/logger";

const app = new Koa();
const SERVER_PORT = config.SERVER.PORT;

app.use(globalErrorCatcher);
app.use(logRoute);
app.use(cors());
app.use(bodyParser());

app.use(swaggerRoutes.routes());
app.use(darwinRoutes.routes());
app.use(healthRoute.routes());

app.listen(SERVER_PORT, async () => {
  logger.info(
    `Server started on port ${SERVER_PORT}, using Darwin endpoint ${config.DARWIN.ENDPOINT}`,
  );
});
