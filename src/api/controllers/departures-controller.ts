import type { Context } from "koa";
import {
  DarwinService,
  type ServiceBoardOptions,
} from "../../services/national-rail/DarwinService";
import { XMLtoJSONConverter } from "../../services/national-rail/XMLtoJSONConverter";
import { config } from "../../utils/config";

export const getDepartures = async (ctx: Context) => {
  const darwinToken = config.DARWIN.TOKEN;
  const body = ctx.request.body as ServiceBoardOptions;

  if (!body || !body.crs) {
    ctx.status = 400;
    ctx.body = { error: "Missing 'crs' in request body" };
    return;
  }

  body.crs = body.crs.toUpperCase();

  const darwinService = new DarwinService(darwinToken);
  const xmlArrivals = await darwinService.fetchDepartures(body);

  if (!xmlArrivals) {
    ctx.status = 204;
    return;
  }

  const xmlToJsonConverter = new XMLtoJSONConverter(xmlArrivals);
  const jsonArrivals = await xmlToJsonConverter.convert();

  ctx.body = jsonArrivals;
  ctx.status = 200;
};
