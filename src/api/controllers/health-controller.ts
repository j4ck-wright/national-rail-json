import type { Context } from "koa";

export const healthController = (ctx: Context) => {
  ctx.status = 200;
  ctx.body = { status: "ok", uptime: process.uptime() };
};
