import type { Context } from "koa";
import {
  DarwinService,
  type ServiceIdOptions,
} from "@/services/national-rail/DarwinService";
import { XMLtoJSONConverter } from "@/services/national-rail/XMLtoJSONConverter";
import { config } from "@/utils/config";
import type { DarwinOperation } from "./darwin-class-controller";

export type DarwinServiceMethodNames = "fetchServiceDetails";

export abstract class BaseServiceIdController {
  protected abstract readonly methodName: DarwinServiceMethodNames;
  protected abstract readonly responseType: DarwinOperation;

  protected async fetchServiceData(
    darwinService: DarwinService,
    options: ServiceIdOptions,
  ): Promise<string> {
    switch (this.methodName) {
      case "fetchServiceDetails":
        return await darwinService.fetchServiceDetails(options);
      default:
        throw new Error(`Invalid method name: ${this.methodName}`);
    }
  }

  async handle(ctx: Context): Promise<void> {
    const darwinToken = config.DARWIN.TOKEN;

    const serviceID: string = ctx["params"]["serviceId"];

    const darwinService = new DarwinService(darwinToken);
    const xmlResponse = await this.fetchServiceData(darwinService, {
      serviceID,
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

class ServiceDetailsController extends BaseServiceIdController {
  protected readonly methodName = "fetchServiceDetails";
  protected readonly responseType = "GetServiceDetailsResponse";
}

const serviceDetailsController = new ServiceDetailsController();

export const getServiceDetails = (ctx: Context) =>
  serviceDetailsController.handle(ctx);
