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
  | "GetDepBoardWithDetailsResponse"
  | "GetArrivalDepartureBoardResponse"
  | "GetArrDepBoardWithDetailsResponse"
  | "GetServiceDetailsResponse"
  | "GetNextDeparturesResponse";

export type DarwinMethodNames =
  | "fetchArrivals"
  | "fetchDepartures"
  | "fetchDetailedArrivals"
  | "fetchDetailedDepartures"
  | "fetchArrivalDepartureBoard"
  | "fetchDetailedArrivalsDepartures"
  | "fetchNextDepartures";

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
      case "fetchArrivalDepartureBoard":
        return await darwinService.fetchArrivalsDepartures(options);
      case "fetchDetailedArrivalsDepartures":
        return await darwinService.fetchDetailedArrivalDepartures(options);
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

  private getValidFilterType(filterType: string | undefined): "to" | "from" {
    if (filterType === "from") return filterType;
    return "to";
  }

  async handle(ctx: Context): Promise<void> {
    const darwinToken = config.DARWIN.TOKEN;
    const query = ctx.request.query;

    const options: ServiceBoardOptions = {
      crs: ctx["params"]["crs"],
      numRows: this.getQueryParam(query, "numRows") ?? "10",
      filterCrs: this.getQueryParam(query, "filterCrs"),
      filterType: this.getValidFilterType(
        this.getQueryParam(query, "filterType"),
      ),
      timeOffset: this.getQueryParam(query, "timeOffset"),
      timeWindow: this.getQueryParam(query, "timeWindow"),
    };

    if (!options.crs) {
      ctx.status = 400;
      ctx.body = { error: "Missing 'crs' path parameter" };
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

class ArrivalDepartureController extends BaseServiceController {
  protected readonly methodName = "fetchArrivalDepartureBoard";
  protected readonly responseType = "GetArrivalDepartureBoardResponse";
}

class DetailedArrivalDepartureController extends BaseServiceController {
  protected readonly methodName = "fetchDetailedArrivalsDepartures";
  protected readonly responseType = "GetArrDepBoardWithDetailsResponse";
}

const arrivalsController = new ArrivalsController();
const departuresController = new DeparturesController();
const detailedArrivalsController = new DetailedArrivalsController();
const detailedDeparturesController = new DetailedDeparturesController();
const arrivalDepartureController = new ArrivalDepartureController();
const detailedArrivalDepartureController =
  new DetailedArrivalDepartureController();

export const getArrivals = (ctx: Context) => arrivalsController.handle(ctx);
export const getDepartures = (ctx: Context) => departuresController.handle(ctx);
export const getDetailedArrivals = (ctx: Context) =>
  detailedArrivalsController.handle(ctx);
export const getDetailedDepartures = (ctx: Context) =>
  detailedDeparturesController.handle(ctx);
export const getArrivalDepartures = (ctx: Context) =>
  arrivalDepartureController.handle(ctx);
export const getDetailedArrivalDeparture = (ctx: Context) =>
  detailedArrivalDepartureController.handle(ctx);
