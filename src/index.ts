import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { globalErrorCatcher } from "@/api/middleware/error-handler";
import { logRoute } from "@/api/middleware/log-route";
import v1apiRoutes from "@/api/routes/v1-api-routes";
import { config } from "@/utils/config";
import { logger } from "@/utils/logger";

const app = new Koa();
const SERVER_PORT = config.SERVER.PORT;

app.use(globalErrorCatcher);
app.use(logRoute);
app.use(bodyParser());

app.use(v1apiRoutes.routes());

app.listen(SERVER_PORT, async () => {
  logger.info(`Server started on port ${SERVER_PORT}`);
});
