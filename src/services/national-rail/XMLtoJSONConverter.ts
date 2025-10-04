import { parseStringPromise } from "xml2js";
import type { DarwinOperation } from "@/api/controllers/darwin-base-class-controller";

type Service = {
  sta?: string;
  eta?: string;
  platform?: string;
  operator?: string;
  operatorCode?: string;
  serviceType?: string;
  length?: string;
  serviceID?: string;
  rsid?: string;
  origin?: { locationName: string; crs: string };
  destination?: { locationName: string; crs: string };
};

type ServicesContainer = {
  service: Service | Service[];
};

type StationBoard = {
  generatedAt?: string;
  locationName?: string;
  crs?: string;
  platformAvailable?: string;
  trainServices?: ServicesContainer;
  busServices?: ServicesContainer;
};

type DepartureBoardInput = StationBoard & {
  departures?: {
    destination?:
      | {
          $?: { crs: string };
          crs?: string;
          service?: Service | Service[];
        }
      | Array<{
          $?: { crs: string };
          crs?: string;
          service?: Service | Service[];
        }>;
  };
};

type DepartureBoard = StationBoard & {
  departures?: Array<{
    crs: string;
    service: Service;
  }>;
};

export class XMLtoJSONConverter {
  private xmlString: string;
  private readonly operation: DarwinOperation;

  constructor(xmlString: string, opertation: DarwinOperation) {
    this.xmlString = xmlString;
    this.operation = opertation;
  }

  private getResultPropertyName(): string {
    switch (this.operation) {
      case "GetServiceDetailsResponse":
        return "GetServiceDetailsResult";
      case "GetNextDeparturesResponse":
        return "DeparturesBoard";
      default:
        return "GetStationBoardResult";
    }
  }

  private stripNamespaces = (obj: object): object => {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.stripNamespaces(item));
    }

    if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj).reduce<Record<string, unknown>>(
        (acc, [key, value]) => {
          const cleanKey = key.includes(":") ? key.split(":")[1] : key;
          acc[cleanKey] = this.stripNamespaces(value);
          return acc;
        },
        {},
      );
    }

    return obj;
  };

  private flattenService = (service: Service): Service => {
    // biome-ignore lint/suspicious/noExplicitAny: <field could be any type here>
    const flatten = (field?: any) => {
      if (field && typeof field === "object" && "location" in field) {
        return { ...field.location };
      }
      return field;
    };

    return {
      ...service,
      origin: flatten(service.origin),
      destination: flatten(service.destination),
    };
  };

  private flattenDepartures(
    obj?: DepartureBoardInput,
  ): DepartureBoard | undefined {
    if (!obj?.departures?.destination) return obj as DepartureBoard;

    const destination = obj.departures.destination;
    const result = { ...obj } as DepartureBoard;

    const flattenSingleService = (
      service: Service | Service[] | undefined,
    ): Service | undefined => {
      if (!service) return undefined;
      if (Array.isArray(service)) {
        return service.length > 0 ? this.flattenService(service[0]) : undefined;
      }
      return this.flattenService(service);
    };

    if (Array.isArray(destination)) {
      result.departures = destination
        .map((dest) => {
          const crs = dest.$?.crs || dest.crs;
          const service = flattenSingleService(dest.service);
          return crs && service ? { crs, service } : null;
        })
        .filter(
          (item): item is { crs: string; service: Service } => item !== null,
        );
    } else {
      const crs = destination.$?.crs || destination.crs;
      const service = flattenSingleService(destination.service);
      result.departures = crs && service ? [{ crs, service }] : [];
    }

    return result;
  }

  private flattenServices(
    obj?: StationBoard | DepartureBoardInput,
  ): StationBoard | DepartureBoardInput | undefined {
    if (!obj) return obj;

    const normalizeAndFlatten = (services: Service | Service[] | undefined) => {
      if (!services) return [];
      if (Array.isArray(services)) return services.map(this.flattenService);
      return [this.flattenService(services)];
    };

    if (obj.trainServices?.service) {
      obj.trainServices.service = normalizeAndFlatten(
        obj.trainServices.service,
      );
    }

    if (obj.busServices?.service) {
      obj.busServices.service = normalizeAndFlatten(obj.busServices.service);
    }

    return obj;
  }

  async convert(): Promise<StationBoard | DepartureBoard | undefined> {
    const rawJson = (await parseStringPromise(this.xmlString, {
      explicitArray: false,
      trim: true,
      explicitRoot: false,
      mergeAttrs: false,
    })) as {
      "soap:Body": {
        [K in DarwinOperation]: { [resultKey: string]: object };
      };
    };

    const resultPropertyName = this.getResultPropertyName();
    const stationBoardData =
      rawJson["soap:Body"][this.operation][resultPropertyName];

    const removedNamespaces = this.stripNamespaces(stationBoardData);
    const flattenedResponse = this.flattenServices(removedNamespaces);
    const flattenedDepartures = this.flattenDepartures(
      flattenedResponse as DepartureBoardInput,
    );

    if (flattenedDepartures && "$" in flattenedDepartures) {
      delete flattenedDepartures["$"];
    }

    return flattenedDepartures;
  }
}
