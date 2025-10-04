import type {
  ServiceBoardOptions,
  ServiceIdOptions,
} from "@/services/national-rail/DarwinService";
import { SoapXmlFactory } from "@/utils/SoapXmlFactory";

describe("SoapXmlFactory", () => {
  const baseServiceBoardOptions: ServiceBoardOptions = {
    crs: "XYZ",
    numRows: undefined,
    filterCrs: undefined,
    filterType: undefined,
    timeOffset: undefined,
    timeWindow: undefined,
  };

  it("should pass token header to XML", () => {
    const factory = new SoapXmlFactory("test-token");
    const xml = factory.getArrivals(baseServiceBoardOptions);

    expect(xml).toContain("<typ:TokenValue>test-token</typ:TokenValue>");
  });

  it.each([
    ["getArrivals", "GetArrivalBoardRequest"],
    ["getDepartures", "GetDepartureBoardRequest"],
    ["getDetailedArrivals", "GetArrBoardWithDetailsRequest"],
    ["getDetailedDepartures", "GetDepBoardWithDetailsRequest"],
    ["getArrivalDepartures", "GetArrivalDepartureBoardRequest"],
    ["getDetailedArrivalDepartures", "GetArrDepBoardWithDetailsRequest"],
  ])("should pass all options to XML for %s", (methodName, expectedRequest) => {
    const factory = new SoapXmlFactory("test-token");
    const xml = (
      factory[methodName as keyof SoapXmlFactory] as (
        options: ServiceBoardOptions,
      ) => string
    )({
      crs: "XYZ",
      numRows: "5",
      filterCrs: "ABC",
      filterType: "to",
      timeOffset: "0",
      timeWindow: "120",
    });

    expect(xml).toContain("<ldb:crs>XYZ</ldb:crs>");
    expect(xml).toContain("<ldb:numRows>5</ldb:numRows>");
    expect(xml).toContain("<ldb:filterCrs>ABC</ldb:filterCrs>");
    expect(xml).toContain("<ldb:filterType>to</ldb:filterType>");
    expect(xml).toContain("<ldb:timeOffset>0</ldb:timeOffset>");
    expect(xml).toContain("<ldb:timeWindow>120</ldb:timeWindow>");
    expect(xml).toContain(`<ldb:${expectedRequest}>`);
    expect(xml).toContain(`</ldb:${expectedRequest}>`);
  });

  it("should omit optional options from XML when not provided", () => {
    const factory = new SoapXmlFactory("test-token");
    const xml = factory.getArrivals(baseServiceBoardOptions);

    expect(xml).toContain("<ldb:crs>XYZ</ldb:crs>");
    expect(xml).not.toContain("<ldb:numRows>");
    expect(xml).not.toContain("<ldb:filterCrs>");
    expect(xml).not.toContain("<ldb:filterType>");
    expect(xml).not.toContain("<ldb:timeOffset>");
    expect(xml).not.toContain("<ldb:timeWindow>");
  });

  it("should include all parts of the SOAP envelope", () => {
    const factory = new SoapXmlFactory("test-token");
    const xml = factory.getArrivals(baseServiceBoardOptions);

    expect(xml.startsWith("<soap:Envelope")).toBe(true);
    expect(xml).toContain("<soap:Header>");
    expect(xml).toContain("typ:AccessToken");
    expect(xml).toContain("<soap:Body>");
    expect(xml.endsWith("</soap:Envelope>")).toBe(true);
  });

  describe("Service Details", () => {
    const serviceIdOptions: ServiceIdOptions = {
      serviceID: "ABC123456789",
    };

    it("should generate correct XML for getServiceDetails", () => {
      const factory = new SoapXmlFactory("test-token");
      const xml = factory.getServiceDetails(serviceIdOptions);

      expect(xml).toContain("<typ:TokenValue>test-token</typ:TokenValue>");
      expect(xml).toContain("<ldb:GetServiceDetailsRequest>");
      expect(xml).toContain("</ldb:GetServiceDetailsRequest>");
      expect(xml).toContain("<ldb:serviceID>ABC123456789</ldb:serviceID>");
      expect(xml.startsWith("<soap:Envelope")).toBe(true);
      expect(xml.endsWith("</soap:Envelope>")).toBe(true);
    });
  });
});
