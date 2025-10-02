import type { Context } from "koa";
import {
  DarwinService,
  type ServiceBoardOptions,
} from "@/services/national-rail/DarwinService";
import { XMLtoJSONConverter } from "@/services/national-rail/XMLtoJSONConverter";
import { config } from "@/utils/config";

type DarwinOperation =
  | "GetArrivalBoardResponse"
  | "GetDepartureBoardResponse"
  | "GetArrBoardWithDetailsResponse";

type methodName = "fetchArrivals" | "fetchDepartures" | "fetchDetailedArrivals";

export abstract class BaseServiceController {
  protected abstract readonly methodName: methodName;
  protected abstract readonly responseType: DarwinOperation;

  protected async fetchServiceData(
    darwinService: DarwinService,
    body: ServiceBoardOptions,
  ): Promise<string> {
    switch (this.methodName) {
      case "fetchArrivals":
        return await darwinService.fetchArrivals(body);
      case "fetchDepartures":
        return await darwinService.fetchDepartures(body);
      case "fetchDetailedArrivals":
        return await darwinService.fetchDetailedArrivals(body);
      default:
        throw new Error(`Invalid method name: ${this.methodName}`);
    }
  }

  async handle(ctx: Context): Promise<void> {
    const darwinToken = config.DARWIN.TOKEN;
    const body = ctx.request.body as ServiceBoardOptions;

    if (!body.crs) {
      ctx.status = 400;
      ctx.body = { error: "Missing 'crs' in request body" };
      return;
    }

    if (body.crs.length !== 3) {
      ctx.status = 400;
      ctx.body = { error: "invalid 'crs'" };
      return;
    }

    body.crs = body.crs.toUpperCase();

    const darwinService = new DarwinService(darwinToken);
    const xmlResponse = await this.fetchServiceData(darwinService, body);

    const xmlToJsonConverter = new XMLtoJSONConverter(
      xmlResponse,
      this.responseType,
    );
    const jsonData = await xmlToJsonConverter.convert();

    ctx.body = jsonData;
    ctx.status = 200;
  }
}

class ArrivalsController extends BaseServiceController {
  protected readonly methodName = "fetchArrivals";
  protected readonly responseType = "GetArrivalBoardResponse";
}

class DeparturesController extends BaseServiceController {
  protected readonly methodName = "fetchDepartures";
  protected readonly responseType = "GetDepartureBoardResponse";
}

class DetailedArrivalsController extends BaseServiceController {
  protected readonly methodName = "fetchDetailedArrivals";
  protected readonly responseType = "GetArrBoardWithDetailsResponse";
}

const arrivalsController = new ArrivalsController();
const departuresController = new DeparturesController();
const detailedArrivalsController = new DetailedArrivalsController();

export const getArrivals = (ctx: Context) => arrivalsController.handle(ctx);
export const getDepartures = (ctx: Context) => departuresController.handle(ctx);
export const getDetailedArrivals = (ctx: Context) =>
  detailedArrivalsController.handle(ctx);
