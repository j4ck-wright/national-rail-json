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

describe("Linear Departure Endpoint Integration Test", () => {
  let app: Koa;

  beforeEach(() => {
    app = new Koa();
    app.use(globalErrorCatcher);
    app.use(logRoute);
    app.use(cors());
    app.use(darwinRoutes.routes());
  });

  describe("Next Departures Endpoint", () => {
    it("should return next departures for single destinationCrs", async () => {
      const mockCrs = "LDS";
      const mockDestinationCrs = "YRK";

      const mockXmlResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetNextDeparturesResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <DeparturesBoard>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <departures>
                  <destination crs="YRK">
                    <service>
                      <sta>19:38</sta>
                      <eta>On time</eta>
                      <platform>16</platform>
                      <operator>TransPennine Express</operator>
                      <operatorCode>TP</operatorCode>
                      <serviceID>1268173LEEDS___</serviceID>
                    </service>
                  </destination>
                </departures>
              </DeparturesBoard>
            </GetNextDeparturesResponse>
          </soap:Body>
        </soap:Envelope>`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse),
      });

      global.fetch = mockFetch;

      const response = await request(app.callback())
        .get(`/departures/${mockCrs}/next`)
        .query({ destinationCrs: mockDestinationCrs })
        .expect(200);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://mock-darwin-endpoint.com",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
          },
          body: expect.stringContaining(mockDestinationCrs),
        }),
      );

      expect(response.body).toEqual({
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        departures: [
          {
            crs: "YRK",
            service: {
              sta: "19:38",
              eta: "On time",
              platform: "16",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1268173LEEDS___",
            },
          },
        ],
      });
    });

    it("should return next departures for multiple destinationCrs", async () => {
      const mockCrs = "LDS";
      const mockDestinationCrsList = ["YRK", "DON"];

      const mockXmlResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetNextDeparturesResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <DeparturesBoard>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <departures>
                  <destination crs="YRK">
                    <service>
                      <sta>19:38</sta>
                      <eta>On time</eta>
                      <platform>16</platform>
                      <operator>TransPennine Express</operator>
                      <operatorCode>TP</operatorCode>
                      <serviceID>1268173LEEDS___</serviceID>
                    </service>
                  </destination>
                  <destination crs="DON">
                    <service>
                      <sta>19:45</sta>
                      <eta>19:47</eta>
                      <platform>3</platform>
                      <operator>Northern</operator>
                      <operatorCode>NT</operatorCode>
                      <serviceID>2P67000LEEDS___</serviceID>
                    </service>
                  </destination>
                </departures>
              </DeparturesBoard>
            </GetNextDeparturesResponse>
          </soap:Body>
        </soap:Envelope>`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse),
      });

      global.fetch = mockFetch;

      const response = await request(app.callback())
        .get(`/departures/${mockCrs}/next`)
        .query({
          destinationCrs: mockDestinationCrsList,
          timeOffset: "30",
          timeWindow: "120",
        })
        .expect(200);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://mock-darwin-endpoint.com",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
          },
          body: expect.stringContaining("YRK"),
        }),
      );

      expect(response.body).toEqual({
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        departures: [
          {
            crs: "YRK",
            service: {
              sta: "19:38",
              eta: "On time",
              platform: "16",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1268173LEEDS___",
            },
          },
          {
            crs: "DON",
            service: {
              sta: "19:45",
              eta: "19:47",
              platform: "3",
              operator: "Northern",
              operatorCode: "NT",
              serviceID: "2P67000LEEDS___",
            },
          },
        ],
      });
    });

    it("should return 400 when no destinationCrs is provided", async () => {
      const mockCrs = "LDS";

      const response = await request(app.callback())
        .get(`/departures/${mockCrs}/next`)
        .expect(400);

      expect(response.text).toBe("No 'destinationCrs' provided");
    });
  });

  describe("Next Departures Detailed Endpoint", () => {
    it("should return detailed next departures for single destinationCrs", async () => {
      const mockCrs = "LDS";
      const mockDestinationCrs = "YRK";

      const mockXmlResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetNextDeparturesWithDetailsResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <DeparturesBoard>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <departures>
                  <destination crs="YRK">
                    <service>
                      <sta>19:38</sta>
                      <eta>On time</eta>
                      <platform>16</platform>
                      <operator>TransPennine Express</operator>
                      <operatorCode>TP</operatorCode>
                      <serviceID>1268173LEEDS___</serviceID>
                      <subsequentCallingPoints>
                        <callingPointList>
                          <callingPoint>
                            <locationName>Micklefield</locationName>
                            <crs>MIK</crs>
                            <st>19:44</st>
                            <et>On time</et>
                          </callingPoint>
                          <callingPoint>
                            <locationName>York</locationName>
                            <crs>YRK</crs>
                            <st>19:55</st>
                            <et>On time</et>
                          </callingPoint>
                        </callingPointList>
                      </subsequentCallingPoints>
                    </service>
                  </destination>
                </departures>
              </DeparturesBoard>
            </GetNextDeparturesWithDetailsResponse>
          </soap:Body>
        </soap:Envelope>`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse),
      });

      global.fetch = mockFetch;

      const response = await request(app.callback())
        .get(`/departures/${mockCrs}/next/detailed`)
        .query({ destinationCrs: mockDestinationCrs })
        .expect(200);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://mock-darwin-endpoint.com",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
          },
          body: expect.stringContaining(mockDestinationCrs),
        }),
      );

      expect(response.body).toEqual({
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        departures: [
          {
            crs: "YRK",
            service: {
              sta: "19:38",
              eta: "On time",
              platform: "16",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1268173LEEDS___",
              subsequentCallingPoints: {
                callingPointList: {
                  callingPoint: [
                    {
                      locationName: "Micklefield",
                      crs: "MIK",
                      st: "19:44",
                      et: "On time",
                    },
                    {
                      locationName: "York",
                      crs: "YRK",
                      st: "19:55",
                      et: "On time",
                    },
                  ],
                },
              },
            },
          },
        ],
      });
    });

    it("should return detailed next departures for multiple destinationCrs", async () => {
      const mockCrs = "LDS";
      const mockDestinationCrsList = ["YRK", "MAN"];

      const mockXmlResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetNextDeparturesWithDetailsResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <DeparturesBoard>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <departures>
                  <destination crs="YRK">
                    <service>
                      <sta>19:38</sta>
                      <eta>On time</eta>
                      <platform>16</platform>
                      <operator>TransPennine Express</operator>
                      <operatorCode>TP</operatorCode>
                      <serviceID>1268173LEEDS___</serviceID>
                      <subsequentCallingPoints>
                        <callingPointList>
                          <callingPoint>
                            <locationName>York</locationName>
                            <crs>YRK</crs>
                            <st>19:55</st>
                            <et>On time</et>
                          </callingPoint>
                        </callingPointList>
                      </subsequentCallingPoints>
                    </service>
                  </destination>
                  <destination crs="MAN">
                    <service>
                      <sta>20:15</sta>
                      <eta>20:16</eta>
                      <platform>12</platform>
                      <operator>TransPennine Express</operator>
                      <operatorCode>TP</operatorCode>
                      <serviceID>1E87000LEEDS___</serviceID>
                      <subsequentCallingPoints>
                        <callingPointList>
                          <callingPoint>
                            <locationName>Huddersfield</locationName>
                            <crs>HUD</crs>
                            <st>20:44</st>
                            <et>On time</et>
                          </callingPoint>
                          <callingPoint>
                            <locationName>Manchester Piccadilly</locationName>
                            <crs>MAN</crs>
                            <st>21:15</st>
                            <et>On time</et>
                          </callingPoint>
                        </callingPointList>
                      </subsequentCallingPoints>
                    </service>
                  </destination>
                </departures>
              </DeparturesBoard>
            </GetNextDeparturesWithDetailsResponse>
          </soap:Body>
        </soap:Envelope>`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse),
      });

      global.fetch = mockFetch;

      const response = await request(app.callback())
        .get(`/departures/${mockCrs}/next/detailed`)
        .query({
          destinationCrs: mockDestinationCrsList,
          timeOffset: "0",
          timeWindow: "180",
        })
        .expect(200);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://mock-darwin-endpoint.com",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
          },
          body: expect.stringContaining("YRK"),
        }),
      );

      expect(response.body).toEqual({
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        departures: [
          {
            crs: "YRK",
            service: {
              sta: "19:38",
              eta: "On time",
              platform: "16",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1268173LEEDS___",
              subsequentCallingPoints: {
                callingPointList: {
                  callingPoint: {
                    locationName: "York",
                    crs: "YRK",
                    st: "19:55",
                    et: "On time",
                  },
                },
              },
            },
          },
          {
            crs: "MAN",
            service: {
              sta: "20:15",
              eta: "20:16",
              platform: "12",
              operator: "TransPennine Express",
              operatorCode: "TP",
              serviceID: "1E87000LEEDS___",
              subsequentCallingPoints: {
                callingPointList: {
                  callingPoint: [
                    {
                      locationName: "Huddersfield",
                      crs: "HUD",
                      st: "20:44",
                      et: "On time",
                    },
                    {
                      locationName: "Manchester Piccadilly",
                      crs: "MAN",
                      st: "21:15",
                      et: "On time",
                    },
                  ],
                },
              },
            },
          },
        ],
      });
    });

    it("should return 400 when no destinationCrs is provided", async () => {
      const mockCrs = "LDS";

      const response = await request(app.callback())
        .get(`/departures/${mockCrs}/next/detailed`)
        .expect(400);

      expect(response.text).toBe("No 'destinationCrs' provided");
    });
  });

  describe("Error Handling", () => {
    it("should handle Darwin API errors gracefully", async () => {
      const mockCrs = "LDS";
      const mockDestinationCrs = "YRK";

      const soapFaultResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <soap:Fault>
              <soap:Reason>
                <soap:Text>Invalid CRS Code</soap:Text>
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
        .get(`/departures/${mockCrs}/next`)
        .query({ destinationCrs: mockDestinationCrs })
        .expect(500);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://mock-darwin-endpoint.com",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
          },
          body: expect.stringContaining(mockDestinationCrs),
        }),
      );

      expect(response.body).toEqual({
        error: "Invalid CRS Code",
        code: undefined,
      });
    });
  });
});
