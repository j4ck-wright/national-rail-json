import { DarwinError } from "@/errors/DarwinError";
import { config } from "@/utils/config";
import { SoapXmlFactory } from "@/utils/SoapXmlFactory";

export type ServiceBoardOptions = {
  numRows: string | undefined;
  crs: string | undefined;
  filterCrs: string | undefined;
  filterType: "to" | "from" | undefined;
  timeOffset: string | undefined;
  timeWindow: string | undefined;
};

export class DarwinService {
  private readonly apiToken: string;

  constructor(darwinToken: string) {
    this.apiToken = darwinToken;
  }

  private async fetchFromDarwin(body: string) {
    const response = await fetch(config.DARWIN.ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DarwinError(
        "Darwin API failure",
        response.status,
        response.statusText,
        errorText,
      );
    }

    return await response.text();
  }

  async fetchArrivals(options: ServiceBoardOptions) {
    const xmlBuiler = new SoapXmlFactory(this.apiToken);

    const payload = xmlBuiler.getArrivals(options);

    const data = await this.fetchFromDarwin(payload);
    return data;
  }

  async fetchDepartures(options: ServiceBoardOptions) {
    const xmlBuiler = new SoapXmlFactory(this.apiToken);

    const payload = xmlBuiler.getDepartures(options);

    const data = await this.fetchFromDarwin(payload);
    return data;
  }

  async fetchDetailedArrivals(options: ServiceBoardOptions) {
    const xmlBuiler = new SoapXmlFactory(this.apiToken);

    const payload = xmlBuiler.getDetailedArrivals(options);

    const data = await this.fetchFromDarwin(payload);
    return data;
  }

  async fetchDetailedDepartures(options: ServiceBoardOptions) {
    const xmlBuiler = new SoapXmlFactory(this.apiToken);

    const payload = xmlBuiler.getDetailedDepartures(options);

    const data = await this.fetchFromDarwin(payload);
    return data;
  }

  async fetchArrivalsDepartures(options: ServiceBoardOptions) {
    const xmlBuilder = new SoapXmlFactory(this.apiToken);

    const payload = xmlBuilder.getArrivalDepartures(options);
    console.log(payload);

    const data = await this.fetchFromDarwin(payload);
    return data;
  }

  async fetchDetailedArrivalDepartures(options: ServiceBoardOptions) {
    const xmlBuilder = new SoapXmlFactory(this.apiToken);
    const payload = xmlBuilder.getDetailedArrivalDepartures(options);

    const data = await this.fetchFromDarwin(payload);
    return data;
  }
}
