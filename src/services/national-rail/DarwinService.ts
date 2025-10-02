import { DarwinError } from "../../errors/DarwinError";
import { config } from "../../utils/config";
import { SoapXmlFactory } from "../../utils/SoapXmlFactory";

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
    try {
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
    } catch (e) {
      console.log("ERROR - ", e);
    }
  }

  async fetchArrivals({
    crs,
    numRows = "10",
    filterCrs,
    filterType,
    timeOffset,
    timeWindow,
  }: ServiceBoardOptions) {
    const xmlBuiler = new SoapXmlFactory(this.apiToken);

    const payload = xmlBuiler.getArrivals({
      crs,
      numRows,
      filterCrs,
      filterType,
      timeOffset,
      timeWindow,
    });

    const data = await this.fetchFromDarwin(payload);
    return data;
  }

  async fetchDepartures({
    crs,
    numRows = "10",
    filterCrs,
    filterType,
    timeOffset,
    timeWindow,
  }: ServiceBoardOptions) {
    const xmlBuiler = new SoapXmlFactory(this.apiToken);

    const payload = xmlBuiler.getDepartures({
      crs,
      numRows,
      filterCrs,
      filterType,
      timeOffset,
      timeWindow,
    });

    const data = await this.fetchFromDarwin(payload);
    return data;
  }
}
