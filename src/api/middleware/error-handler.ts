import type { Context, Next } from "koa";
import { logger } from "../../utils/logger";

export const globalErrorCatcher = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof Error) {
      logger.error(`Unhandled error: ${err}`);
      ctx.status = 500;
      ctx.body = { error: err.message || "Internal Server Error" };
    }
  }
};
