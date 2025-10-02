import { parseStringPromise } from "xml2js";

export interface Service {
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
}

export interface ServicesContainer {
  service: Service | Service[];
}

export interface StationBoard {
  generatedAt?: string;
  locationName?: string;
  crs?: string;
  platformAvailable?: string;
  trainServices?: ServicesContainer;
  busServices?: ServicesContainer;
}

type DarwinOperation =
  | "GetDepartureBoardResponse"
  | "GetArrivalBoardResponse"
  | "GetArrBoardWithDetailsResponse";

export class XMLtoJSONConverter {
  private xmlString: string;
  private readonly operation: DarwinOperation;

  constructor(xmlString: string, opertation: DarwinOperation) {
    this.xmlString = xmlString;
    this.operation = opertation;
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

  private flattenServices(obj?: StationBoard): StationBoard | undefined {
    if (!obj) return obj;

    const flattenService = (service: Service): Service => {
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

    const normalizeAndFlatten = (services: Service | Service[] | undefined) => {
      if (!services) return [];
      if (Array.isArray(services)) return services.map(flattenService);
      return [flattenService(services)];
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

  async convert(): Promise<StationBoard | undefined> {
    const rawJson = (await parseStringPromise(this.xmlString, {
      explicitArray: false,
      trim: true,
      explicitRoot: false,
      mergeAttrs: false,
    })) as {
      "soap:Body": {
        [K in DarwinOperation]: { GetStationBoardResult: object };
      };
    };

    const stationBoardData =
      rawJson["soap:Body"][this.operation]["GetStationBoardResult"];

    const removedNamespaces = this.stripNamespaces(stationBoardData);
    const flattenedResponse = this.flattenServices(removedNamespaces);

    if (flattenedResponse && "$" in flattenedResponse) {
      delete flattenedResponse["$"];
    }

    return flattenedResponse;
  }
}
