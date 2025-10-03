import type { ParsedUrlQuery } from "node:querystring";
import type { Context } from "koa";
import {
  DarwinService,
  type ServiceBoardOptions,
} from "@/services/national-rail/DarwinService";
import { XMLtoJSONConverter } from "@/services/national-rail/XMLtoJSONConverter";
import { config } from "@/utils/config";

export type DarwinOperation =
  | "GetArrivalBoardResponse"
  | "GetArrBoardWithDetailsResponse"
  | "GetDepartureBoardResponse"
  | "GetDepBoardWithDetailsResponse";

export type DarwinMethodNames =
  | "fetchArrivals"
  | "fetchDepartures"
  | "fetchDetailedArrivals"
  | "fetchDetailedDepartures";

export abstract class BaseServiceController {
  protected abstract readonly methodName: DarwinMethodNames;
  protected abstract readonly responseType: DarwinOperation;

  protected async fetchServiceData(
    darwinService: DarwinService,
    options: ServiceBoardOptions,
  ): Promise<string> {
    switch (this.methodName) {
      case "fetchArrivals":
        return await darwinService.fetchArrivals(options);
      case "fetchDepartures":
        return await darwinService.fetchDepartures(options);
      case "fetchDetailedArrivals":
        return await darwinService.fetchDetailedArrivals(options);
      case "fetchDetailedDepartures":
        return await darwinService.fetchDetailedDepartures(options);
      default:
        throw new Error(`Invalid method name: ${this.methodName}`);
    }
  }

  private getQueryParam(
    queries: ParsedUrlQuery,
    key: string,
  ): string | undefined {
    const query = queries[key];

    if (Array.isArray(query)) {
      return query[0];
    }

    return query;
  }

  async handle(ctx: Context): Promise<void> {
    const darwinToken = config.DARWIN.TOKEN;
    const query = ctx.request.query;

    const options: ServiceBoardOptions = {
      crs: this.getQueryParam(query, "crs"),
      numRows: this.getQueryParam(query, "numRows") ?? "10",
      filterCrs: this.getQueryParam(query, "filterCrs"),
      filterType: this.getQueryParam(query, "filterType") as
        | "to"
        | "from"
        | undefined,
      timeOffset: this.getQueryParam(query, "timeOffset"),
      timeWindow: this.getQueryParam(query, "timeWindow"),
    };

    if (!options.crs) {
      ctx.status = 400;
      ctx.body = { error: "Missing 'crs' query parameter" };
      return;
    }

    if (options.crs.length !== 3) {
      ctx.status = 400;
      ctx.body = { error: "invalid 'crs'" };
      return;
    }

    options.crs = options.crs.toUpperCase();

    const darwinService = new DarwinService(darwinToken);
    const xmlResponse = await this.fetchServiceData(darwinService, options);

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

class DetailedDeparturesController extends BaseServiceController {
  protected readonly methodName = "fetchDetailedDepartures";
  protected readonly responseType = "GetDepBoardWithDetailsResponse";
}

const arrivalsController = new ArrivalsController();
const departuresController = new DeparturesController();
const detailedArrivalsController = new DetailedArrivalsController();
const detailedDeparturesController = new DetailedDeparturesController();

export const getArrivals = (ctx: Context) => arrivalsController.handle(ctx);
export const getDepartures = (ctx: Context) => departuresController.handle(ctx);
export const getDetailedArrivals = (ctx: Context) =>
  detailedArrivalsController.handle(ctx);
export const getDetailedDepartures = (ctx: Context) =>
  detailedDeparturesController.handle(ctx);
