import type { ParsedUrlQuery } from "node:querystring";
import type { Context } from "koa";
import {
  DarwinService,
  type LinearDepartureOptions,
} from "@/services/national-rail/DarwinService";
import { XMLtoJSONConverter } from "@/services/national-rail/XMLtoJSONConverter";
import { config } from "@/utils/config";
import type { DarwinOperation } from "./darwin-class-controller";

export type DarwinServiceMethodNames =
  | "fetchNextDepartures"
  | "fetchNextDeparturesWithDetails";

export abstract class BaseLinearDepartureController {
  protected abstract readonly methodName: DarwinServiceMethodNames;
  protected abstract readonly responseType: DarwinOperation;

  protected async fetchServiceData(
    darwinService: DarwinService,
    options: LinearDepartureOptions,
  ): Promise<string> {
    switch (this.methodName) {
      case "fetchNextDepartures":
        return await darwinService.fetchNextDepartures(options);
      case "fetchNextDeparturesWithDetails":
        return await darwinService.fetchNextDeparturesWithDetails(options);
      default:
        throw new Error(`Invalid method name: ${this.methodName}`);
    }
  }

  private getDestinationCrsArray(
    queries: string | string[] | undefined,
  ): string[] {
    if (Array.isArray(queries)) {
      return queries.filter((crs) => crs.length === 3);
    }

    if (typeof queries === "string") {
      return [queries];
    }

    return [];
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

    const params = ctx.query;

    const crs: string = ctx["params"]["crs"]?.toUpperCase();
    const destinationCrs = this.getDestinationCrsArray(
      params["destinationCrs"],
    );
    const timeOffset = this.getQueryParam(params, "timeOffset");
    const timeWindow = this.getQueryParam(params, "timeWindow");

    if (!destinationCrs.length) {
      ctx.status = 400;
      ctx.body = "No 'destinationCrs' provided";
      return;
    }

    const darwinService = new DarwinService(darwinToken);
    const xmlResponse = await this.fetchServiceData(darwinService, {
      crs,
      crsDestinations: destinationCrs,
      timeOffset,
      timeWindow,
    });

    const xmlToJsonConverter = new XMLtoJSONConverter(
      xmlResponse,
      this.responseType,
    );
    const jsonData = await xmlToJsonConverter.convert();

    ctx.body = jsonData;
    ctx.status = 200;
  }
}

class NextDepartureController extends BaseLinearDepartureController {
  protected readonly methodName = "fetchNextDepartures";
  protected readonly responseType = "GetNextDeparturesResponse";
}

class NextDepartureDetailedController extends BaseLinearDepartureController {
  protected readonly methodName = "fetchNextDeparturesWithDetails";
  protected readonly responseType = "GetNextDeparturesWithDetailsResponse";
}

const nextDepartureController = new NextDepartureController();

export const getNextDepartures = (ctx: Context) =>
  nextDepartureController.handle(ctx);

export const getNextDeparturesDetailed = (ctx: Context) => {
  const nextDepartureDetailedController = new NextDepartureDetailedController();
  return nextDepartureDetailedController.handle(ctx);
};
