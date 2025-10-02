import type { ServiceBoardOptions } from "@/services/national-rail/DarwinService";

type DarwinMethods =
  | "GetArrivalBoardRequest"
  | "GetDepartureBoardRequest"
  | "GetArrBoardWithDetailsRequest";

export class SoapXmlFactory {
  private readonly soapEnvolopeStart =
    '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:typ="http://thalesgroup.com/RTTI/2013-11-28/Token/types" xmlns:ldb="http://thalesgroup.com/RTTI/2017-10-01/ldb/">';

  private soapHeader =
    `<soap:Header>` +
    `<typ:AccessToken>` +
    `<typ:TokenValue>%%darwinToken%%</typ:TokenValue>` +
    `</typ:AccessToken>` +
    `</soap:Header>`;

  private readonly soapBodyStart = `<soap:Body>`;
  private readonly soapBodyEnd = `</soap:Body>`;

  private readonly soapEnvelopeEnd = `</soap:Envelope>`;

  private readonly serviceBoardOptions =
    "\n" +
    `<ldb:numRows>%%numRows%%</ldb:numRows>` +
    "\n" +
    `<ldb:crs>%%crs%%</ldb:crs>` +
    "\n" +
    `<ldb:filterCrs>%%filterCrs%%</ldb:filterCrs>` +
    "\n" +
    `<ldb:filterType>%%filterType%%</ldb:filterType>` +
    "\n" +
    `<ldb:timeOffset>%%timeOffset%%</ldb:timeOffset>` +
    "\n" +
    `<ldb:timeWindow>%%timeWindow%%</ldb:timeWindow>`;

  constructor(darwinToken: string) {
    this.soapHeader = this.soapHeader.replace("%%darwinToken%%", darwinToken);
  }

  interpolate(body: string, key: string, value?: string): string {
    if (!value) {
      const lineToRemove = new RegExp(
        `^[ \\t]*<ldb:${key}>%%${key}%%</ldb:${key}>[ \\t]*(?:\\r?\\n)?`,
        "m",
      );
      return body.replace(lineToRemove, "");
    }

    return body.replace(`%%${key}%%`, value);
  }

  interpolateOptions(body: string, options: ServiceBoardOptions) {
    body = this.interpolate(body, "crs", options.crs);
    body = this.interpolate(body, "numRows", options.numRows);
    body = this.interpolate(body, "filterCrs", options.filterCrs);
    body = this.interpolate(body, "filterType", options.filterType);
    body = this.interpolate(body, "timeOffset", options.timeOffset);
    body = this.interpolate(body, "timeWindow", options.timeWindow);

    return body;
  }

  private buildSoapRequest(
    method: DarwinMethods,
    options: ServiceBoardOptions,
  ): string {
    let body =
      this.soapEnvolopeStart +
      this.soapHeader +
      this.soapBodyStart +
      `<ldb:${method}>` +
      this.serviceBoardOptions +
      `</ldb:${method}>` +
      this.soapBodyEnd +
      this.soapEnvelopeEnd;

    body = this.interpolateOptions(body, options);

    return body;
  }

  getArrivals(options: ServiceBoardOptions): string {
    return this.buildSoapRequest("GetArrivalBoardRequest", options);
  }

  getDepartures(options: ServiceBoardOptions): string {
    return this.buildSoapRequest("GetDepartureBoardRequest", options);
  }

  getDetailedArrivals(options: ServiceBoardOptions): string {
    return this.buildSoapRequest("GetArrBoardWithDetailsRequest", options);
  }
}
