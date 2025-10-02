import type { Context, Next } from "koa";
import { logger } from "../../utils/logger";

export const logRoute = async (ctx: Context, next: Next) => {
  const start = Date.now();
  try {
    await next();
  } finally {
    const ms = Date.now() - start;
    logger.info({
      method: ctx.method,
      url: ctx.url,
      status: ctx.status,
      headers: ctx.headers,
      duration: `${ms}ms`,
      body: ctx.request.body,
    });
  }
};
