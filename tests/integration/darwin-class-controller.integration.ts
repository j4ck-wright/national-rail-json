import cors from "@koa/cors";
import Koa from "koa";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { globalErrorCatcher } from "@/api/middleware/error-handler";
import { logRoute } from "@/api/middleware/log-route";
import darwinRoutes from "@/api/routes/darwin-routes";

vi.mock("@/utils/config", () => ({
  config: {
    DARWIN: {
      TOKEN: "mock-token",
      ENDPOINT: "https://mock-darwin-endpoint.com",
    },
  },
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Darwin Class Controller Integration Tests", () => {
  let app: Koa;

  beforeEach(() => {
    app = new Koa();
    app.use(globalErrorCatcher);
    app.use(logRoute);
    app.use(cors());
    app.use(darwinRoutes.routes());

    vi.clearAllMocks();
  });

  const testCases = [
    {
      name: "arrivals endpoint",
      endpoint: "/arrivals/LDS",
      queryParams: { numRows: "10", filterCrs: "YRK", filterType: "from" },
      xmlResponseType: "GetArrivalBoardResponse",
      xmlResultWrapper: "GetStationBoardResult",
      mockXmlResponse: `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetArrivalBoardResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <GetStationBoardResult>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <trainServices>
                  <service>
                    <std>19:35</std>
                    <etd>On time</etd>
                    <platform>16</platform>
                    <operator>TransPennine Express</operator>
                    <operatorCode>TP</operatorCode>
                    <serviceID>1268173LEEDS___</serviceID>
                  </service>
                </trainServices>
              </GetStationBoardResult>
            </GetArrivalBoardResponse>
          </soap:Body>
        </soap:Envelope>`,
      expectedResponse: {
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        trainServices: {
          service: [
            {
              std: "19:35",
              etd: "On time",
              platform: "16",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1268173LEEDS___",
            },
          ],
        },
      },
    },
    {
      name: "arrivals detailed endpoint",
      endpoint: "/arrivals/LDS/detailed",
      queryParams: { numRows: "5", timeOffset: "30" },
      xmlResponseType: "GetArrBoardWithDetailsResponse",
      xmlResultWrapper: "GetStationBoardResult",
      mockXmlResponse: `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetArrBoardWithDetailsResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <GetStationBoardResult>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <trainServices>
                  <service>
                    <std>19:35</std>
                    <etd>On time</etd>
                    <platform>16</platform>
                    <operator>TransPennine Express</operator>
                    <operatorCode>TP</operatorCode>
                    <serviceID>1268173LEEDS___</serviceID>
                    <previousCallingPoints>
                      <callingPointList>
                        <callingPoint>
                          <locationName>Manchester Piccadilly</locationName>
                          <crs>MAN</crs>
                          <st>18:45</st>
                          <at>18:46</at>
                        </callingPoint>
                      </callingPointList>
                    </previousCallingPoints>
                  </service>
                </trainServices>
              </GetStationBoardResult>
            </GetArrBoardWithDetailsResponse>
          </soap:Body>
        </soap:Envelope>`,
      expectedResponse: {
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        trainServices: {
          service: [
            {
              std: "19:35",
              etd: "On time",
              platform: "16",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1268173LEEDS___",
              previousCallingPoints: {
                callingPointList: {
                  callingPoint: {
                    locationName: "Manchester Piccadilly",
                    crs: "MAN",
                    st: "18:45",
                    at: "18:46",
                  },
                },
              },
            },
          ],
        },
      },
    },
    {
      name: "departures endpoint",
      endpoint: "/departures/LDS",
      queryParams: { numRows: "15", filterCrs: "MAN", filterType: "to" },
      xmlResponseType: "GetDepartureBoardResponse",
      xmlResultWrapper: "GetStationBoardResult",
      mockXmlResponse: `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetDepartureBoardResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <GetStationBoardResult>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <trainServices>
                  <service>
                    <std>19:35</std>
                    <etd>On time</etd>
                    <platform>16</platform>
                    <operator>TransPennine Express</operator>
                    <operatorCode>TP</operatorCode>
                    <serviceID>1268173LEEDS___</serviceID>
                    <destination>
                      <location>
                        <locationName>Manchester Piccadilly</locationName>
                        <crs>MAN</crs>
                      </location>
                    </destination>
                  </service>
                </trainServices>
              </GetStationBoardResult>
            </GetDepartureBoardResponse>
          </soap:Body>
        </soap:Envelope>`,
      expectedResponse: {
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        trainServices: {
          service: [
            {
              std: "19:35",
              etd: "On time",
              platform: "16",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1268173LEEDS___",
              destination: {
                locationName: "Manchester Piccadilly",
                crs: "MAN",
              },
            },
          ],
        },
      },
    },
    {
      name: "departures detailed endpoint",
      endpoint: "/departures/LDS/detailed",
      queryParams: { numRows: "8", timeWindow: "180" },
      xmlResponseType: "GetDepBoardWithDetailsResponse",
      xmlResultWrapper: "GetStationBoardResult",
      mockXmlResponse: `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetDepBoardWithDetailsResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <GetStationBoardResult>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <trainServices>
                  <service>
                    <std>19:35</std>
                    <etd>On time</etd>
                    <platform>16</platform>
                    <operator>TransPennine Express</operator>
                    <operatorCode>TP</operatorCode>
                    <serviceID>1268173LEEDS___</serviceID>
                    <subsequentCallingPoints>
                      <callingPointList>
                        <callingPoint>
                          <locationName>Huddersfield</locationName>
                          <crs>HUD</crs>
                          <st>20:05</st>
                          <et>On time</et>
                        </callingPoint>
                        <callingPoint>
                          <locationName>Manchester Piccadilly</locationName>
                          <crs>MAN</crs>
                          <st>20:35</st>
                          <et>On time</et>
                        </callingPoint>
                      </callingPointList>
                    </subsequentCallingPoints>
                  </service>
                </trainServices>
              </GetStationBoardResult>
            </GetDepBoardWithDetailsResponse>
          </soap:Body>
        </soap:Envelope>`,
      expectedResponse: {
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        trainServices: {
          service: [
            {
              std: "19:35",
              etd: "On time",
              platform: "16",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1268173LEEDS___",
              subsequentCallingPoints: {
                callingPointList: {
                  callingPoint: [
                    {
                      locationName: "Huddersfield",
                      crs: "HUD",
                      st: "20:05",
                      et: "On time",
                    },
                    {
                      locationName: "Manchester Piccadilly",
                      crs: "MAN",
                      st: "20:35",
                      et: "On time",
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
    {
      name: "all (arrivals and departures) endpoint",
      endpoint: "/all/LDS",
      queryParams: { numRows: "12" },
      xmlResponseType: "GetArrivalDepartureBoardResponse",
      xmlResultWrapper: "GetStationBoardResult",
      mockXmlResponse: `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetArrivalDepartureBoardResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <GetStationBoardResult>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <trainServices>
                  <service>
                    <std>19:35</std>
                    <etd>On time</etd>
                    <platform>16</platform>
                    <operator>TransPennine Express</operator>
                    <operatorCode>TP</operatorCode>
                    <serviceID>1268173LEEDS___</serviceID>
                  </service>
                </trainServices>
                <busServices>
                  <service>
                    <std>19:40</std>
                    <etd>On time</etd>
                    <operator>First West Yorkshire</operator>
                    <serviceID>BUS123456___</serviceID>
                  </service>
                </busServices>
              </GetStationBoardResult>
            </GetArrivalDepartureBoardResponse>
          </soap:Body>
        </soap:Envelope>`,
      expectedResponse: {
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        trainServices: {
          service: [
            {
              std: "19:35",
              etd: "On time",
              platform: "16",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1268173LEEDS___",
            },
          ],
        },
        busServices: {
          service: [
            {
              std: "19:40",
              etd: "On time",
              operator: "First West Yorkshire",
              serviceID: "BUS123456___",
            },
          ],
        },
      },
    },
    {
      name: "all detailed (arrivals and departures detailed) endpoint",
      endpoint: "/all/LDS/detailed",
      queryParams: { numRows: "6", filterCrs: "YRK" },
      xmlResponseType: "GetArrDepBoardWithDetailsResponse",
      xmlResultWrapper: "GetStationBoardResult",
      mockXmlResponse: `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetArrDepBoardWithDetailsResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <GetStationBoardResult>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <trainServices>
                  <service>
                    <std>19:35</std>
                    <etd>On time</etd>
                    <platform>16</platform>
                    <operator>TransPennine Express</operator>
                    <operatorCode>TP</operatorCode>
                    <serviceID>1268173LEEDS___</serviceID>
                    <previousCallingPoints>
                      <callingPointList>
                        <callingPoint>
                          <locationName>York</locationName>
                          <crs>YRK</crs>
                          <st>18:55</st>
                          <at>18:56</at>
                        </callingPoint>
                      </callingPointList>
                    </previousCallingPoints>
                    <subsequentCallingPoints>
                      <callingPointList>
                        <callingPoint>
                          <locationName>Manchester Piccadilly</locationName>
                          <crs>MAN</crs>
                          <st>20:35</st>
                          <et>On time</et>
                        </callingPoint>
                      </callingPointList>
                    </subsequentCallingPoints>
                  </service>
                </trainServices>
              </GetStationBoardResult>
            </GetArrDepBoardWithDetailsResponse>
          </soap:Body>
        </soap:Envelope>`,
      expectedResponse: {
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        trainServices: {
          service: [
            {
              std: "19:35",
              etd: "On time",
              platform: "16",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1268173LEEDS___",
              previousCallingPoints: {
                callingPointList: {
                  callingPoint: {
                    locationName: "York",
                    crs: "YRK",
                    st: "18:55",
                    at: "18:56",
                  },
                },
              },
              subsequentCallingPoints: {
                callingPointList: {
                  callingPoint: {
                    locationName: "Manchester Piccadilly",
                    crs: "MAN",
                    st: "20:35",
                    et: "On time",
                  },
                },
              },
            },
          ],
        },
      },
    },
  ];

  it.each(testCases)(
    "should handle $name correctly",
    async ({ endpoint, queryParams, mockXmlResponse, expectedResponse }) => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse),
      });

      global.fetch = mockFetch;

      const response = await request(app.callback())
        .get(endpoint)
        .query(queryParams)
        .expect(200);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://mock-darwin-endpoint.com",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
          },
          body: expect.stringMatching(/soap:Envelope/),
        }),
      );

      expect(response.body).toEqual(expectedResponse);
    },
  );

  describe("Error Handling", () => {
    it("should handle Darwin API errors gracefully", async () => {
      const soapFaultResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <soap:Fault>
              <soap:Reason>
                <soap:Text>Invalid Station Code</soap:Text>
              </soap:Reason>
            </soap:Fault>
          </soap:Body>
        </soap:Envelope>`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve(soapFaultResponse),
      });

      global.fetch = mockFetch;

      const response = await request(app.callback())
        .get("/departures/XXX")
        .query({ numRows: "10" })
        .expect(500);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://mock-darwin-endpoint.com",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
          },
          body: expect.stringMatching(/soap:Envelope/),
        }),
      );

      expect(response.body).toEqual({
        error: "Invalid Station Code",
        code: undefined,
      });
    });

    it("should handle missing CRS parameter", async () => {
      await request(app.callback()).get("/arrivals/").expect(404);

      if (
        global.fetch &&
        typeof global.fetch === "function" &&
        "mock" in global.fetch
      ) {
        expect(global.fetch).not.toHaveBeenCalled();
      }
    });
  });
});
