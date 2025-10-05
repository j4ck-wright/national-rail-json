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
      ENDPOINT: "https://mock-darwin-endpoint.com/api",
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

describe("Service Endpoint Integration Test", () => {
  let app: Koa;

  beforeEach(() => {
    app = new Koa();
    app.use(globalErrorCatcher);
    app.use(logRoute);
    app.use(cors());
    app.use(darwinRoutes.routes());
  });

  it("should return service details for valid serviceId", async () => {
    const mockServiceId = "1268173LEEDS___";

    const mockXmlResponse = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:ldb="http://thalesgroup.com/RTTI/2017-10-01/ldb/"
        xmlns:types="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
        <soap:Body>
          <GetServiceDetailsResponse>
            <GetServiceDetailsResult>
              <ldb:generatedAt>2025-10-04T19:52:23.6370346+01:00</ldb:generatedAt>
              <ldb:serviceType>train</ldb:serviceType>
              <ldb:locationName>Leeds</ldb:locationName>
              <ldb:crs>LDS</ldb:crs>
              <ldb:operator>TransPennine Express</ldb:operator>
              <ldb:operatorCode>TP</ldb:operatorCode>
              <ldb:platform>16</ldb:platform>
              <ldb:serviceID>${mockServiceId}</ldb:serviceID>
              <ldb:previousCallingPoints>
                <ldb:callingPointList>
                  <ldb:callingPoint>
                    <ldb:locationName>Manchester Piccadilly</ldb:locationName>
                    <ldb:crs>MAN</ldb:crs>
                    <ldb:st>18:45</ldb:st>
                    <ldb:at>18:46</ldb:at>
                  </ldb:callingPoint>
                  <ldb:callingPoint>
                    <ldb:locationName>Huddersfield</ldb:locationName>
                    <ldb:crs>HUD</ldb:crs>
                    <ldb:st>19:15</ldb:st>
                    <ldb:at>19:16</ldb:at>
                  </ldb:callingPoint>
                </ldb:callingPointList>
              </ldb:previousCallingPoints>
              <ldb:subsequentCallingPoints>
                <ldb:callingPointList>
                  <ldb:callingPoint>
                    <ldb:locationName>York</ldb:locationName>
                    <ldb:crs>YRK</ldb:crs>
                    <ldb:st>19:55</ldb:st>
                    <ldb:et>On time</ldb:et>
                  </ldb:callingPoint>
                  <ldb:callingPoint>
                    <ldb:locationName>Newcastle</ldb:locationName>
                    <ldb:crs>NCL</ldb:crs>
                    <ldb:st>21:25</ldb:st>
                    <ldb:et>On time</ldb:et>
                  </ldb:callingPoint>
                </ldb:callingPointList>
              </ldb:subsequentCallingPoints>
            </GetServiceDetailsResult>
          </GetServiceDetailsResponse>
        </soap:Body>
      </soap:Envelope>`;

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockXmlResponse),
    });

    global.fetch = mockFetch;

    const response = await request(app.callback())
      .get(`/service/${mockServiceId}`)
      .expect(200);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://mock-darwin-endpoint.com/api",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
        body: expect.stringContaining(mockServiceId),
      }),
    );

    expect(response.body).toEqual({
      generatedAt: "2025-10-04T19:52:23.6370346+01:00",
      serviceType: "train",
      locationName: "Leeds",
      crs: "LDS",
      operator: "TransPennine Express",
      operatorCode: "TP",
      platform: "16",
      serviceID: mockServiceId,
      previousCallingPoints: {
        callingPointList: {
          callingPoint: [
            {
              locationName: "Manchester Piccadilly",
              crs: "MAN",
              st: "18:45",
              at: "18:46",
            },
            {
              locationName: "Huddersfield",
              crs: "HUD",
              st: "19:15",
              at: "19:16",
            },
          ],
        },
      },
      subsequentCallingPoints: {
        callingPointList: {
          callingPoint: [
            {
              locationName: "York",
              crs: "YRK",
              st: "19:55",
              et: "On time",
            },
            {
              locationName: "Newcastle",
              crs: "NCL",
              st: "21:25",
              et: "On time",
            },
          ],
        },
      },
    });
  });

  it("should return 404 when Darwin returns 500 for non-existent serviceId", async () => {
    const nonExistentServiceId = "fakeservice1234___";

    const soapFaultResponse = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <soap:Fault>
            <soap:Reason>
              <soap:Text>Invalid Service ID</soap:Text>
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
      .get(`/service/${nonExistentServiceId}`)
      .expect(404);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://mock-darwin-endpoint.com/api",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
        body: expect.stringContaining(nonExistentServiceId),
      }),
    );

    expect(response.body).toEqual({
      error: "Service not found",
      message: "Invalid Service ID",
      code: undefined,
    });
  });
});
