import type { Context, Next } from "koa";
import { config } from "../../utils/config";
import { logger } from "../../utils/logger";

export const darwinAuth = async (ctx: Context, next: Next) => {
  if (!ctx.get(config.SERVER.AUTH_HEADER_NAME)) {
    const body = `The '${config.SERVER.AUTH_HEADER_NAME}' header does not contain an API token`;
    ctx.status = 401;
    ctx.body = body;
    logger.info(body);
    return;
  }

  await next();
};
