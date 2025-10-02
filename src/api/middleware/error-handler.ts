import type { Context, Next } from "koa";
import { DarwinError } from "../../errors/DarwinError";
import { logger } from "../../utils/logger";

export const globalErrorCatcher = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof Error) {
      ctx.status = 500;
      ctx.body = { error: err.message ?? "Internal Server Error" };
    }

    if (err instanceof DarwinError) {
      ctx.status = err.statusCode ?? 500;
      ctx.body = err.statusText;
    }

    logger.error(`Unhandled error: ${err}`);
  }
};
