import { beforeEach, describe, expect, vi } from "vitest";
import {
  BaseLinearDepartureController,
  type DarwinServiceMethodNames,
  getNextDepartures,
  getNextDeparturesDetailed,
} from "@/api/controllers/darwin-linear-departure-controller";
import { DarwinService } from "@/services/national-rail/DarwinService";
import { XMLtoJSONConverter } from "@/services/national-rail/XMLtoJSONConverter";

vi.mock("@/services/national-rail/DarwinService");
vi.mock("@/services/national-rail/XMLtoJSONConverter");
vi.mock("@/utils/config", () => ({
  config: {
    DARWIN: {
      TOKEN: "mock-token",
    },
  },
}));

const MockedDarwinService = vi.mocked(DarwinService);
const MockedXMLtoJSONConverter = vi.mocked(XMLtoJSONConverter);

const TEST_DATA = {
  validCrs: "LDS",
  mockToken: "mock-token",
  mockXmlResponse: "mock-xml-response",
  mockJsonResponse: {
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
          serviceID: "1268173LEEDS___",
        },
      },
    ],
  },
  linearDepartureOptions: {
    crs: "LDS",
    crsDestinations: ["YRK", "DON"],
    timeOffset: "30",
    timeWindow: "120",
  },
};

class TestController extends BaseLinearDepartureController {
  protected readonly methodName = "fetchNextDepartures";
  protected readonly responseType = "GetNextDeparturesResponse";
}

class TestDetailedController extends BaseLinearDepartureController {
  protected readonly methodName = "fetchNextDeparturesWithDetails";
  protected readonly responseType = "GetNextDeparturesWithDetailsResponse";
}

type MockContext = {
  request: { query: Record<string, string | string[]> };
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  status: number;
  body: unknown;
};

function createMockContext(
  query: Record<string, string | string[]> = {},
  params: Record<string, string> = {},
): MockContext {
  return {
    request: { query },
    params,
    query,
    status: 0,
    body: null,
  };
}

function setupMockServices() {
  const mockDarwinService = {
    fetchNextDepartures: vi.fn(),
    fetchNextDeparturesWithDetails: vi.fn(),
  };

  const mockXMLtoJSONConverter = {
    convert: vi.fn(),
  };

  MockedDarwinService.mockImplementation(
    () => mockDarwinService as unknown as DarwinService,
  );
  MockedXMLtoJSONConverter.mockImplementation(
    () => mockXMLtoJSONConverter as unknown as XMLtoJSONConverter,
  );

  return { mockDarwinService, mockXMLtoJSONConverter };
}

function setupSuccessfulResponse(
  mockDarwinService: ReturnType<typeof setupMockServices>["mockDarwinService"],
  mockXMLtoJSONConverter: ReturnType<
    typeof setupMockServices
  >["mockXMLtoJSONConverter"],
) {
  mockDarwinService.fetchNextDepartures.mockResolvedValue(
    TEST_DATA.mockXmlResponse,
  );
  mockDarwinService.fetchNextDeparturesWithDetails.mockResolvedValue(
    TEST_DATA.mockXmlResponse,
  );
  mockXMLtoJSONConverter.convert.mockResolvedValue(TEST_DATA.mockJsonResponse);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BaseLinearDepartureController", () => {
  it("should have correct method mapping for fetchNextDepartures", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const controller = new TestController();
    const result = await controller["fetchServiceData"](
      mockDarwinService as unknown as DarwinService,
      TEST_DATA.linearDepartureOptions,
    );

    expect(mockDarwinService.fetchNextDepartures).toHaveBeenCalledWith(
      TEST_DATA.linearDepartureOptions,
    );
    expect(result).toBe(TEST_DATA.mockXmlResponse);
  });

  it("should have correct method mapping for fetchNextDeparturesWithDetails", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const controller = new TestDetailedController();
    const result = await controller["fetchServiceData"](
      mockDarwinService as unknown as DarwinService,
      TEST_DATA.linearDepartureOptions,
    );

    expect(
      mockDarwinService.fetchNextDeparturesWithDetails,
    ).toHaveBeenCalledWith(TEST_DATA.linearDepartureOptions);
    expect(result).toBe(TEST_DATA.mockXmlResponse);
  });

  it("should throw error for invalid method name", async () => {
    const { mockDarwinService } = setupMockServices();

    class InvalidController extends BaseLinearDepartureController {
      protected readonly methodName =
        "invalidMethod" as DarwinServiceMethodNames;
      protected readonly responseType = "GetNextDeparturesResponse";
    }

    const controller = new InvalidController();

    await expect(
      controller["fetchServiceData"](
        mockDarwinService as unknown as DarwinService,
        TEST_DATA.linearDepartureOptions,
      ),
    ).rejects.toThrow("Invalid method name: invalidMethod");
  });

  it("should handle single destinationCrs parameter", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const controller = new TestController();
    const mockContext = createMockContext(
      { destinationCrs: "YRK", timeOffset: "30" },
      { crs: "LDS" },
    );

    await controller.handle(mockContext as unknown as import("koa").Context);

    expect(mockDarwinService.fetchNextDepartures).toHaveBeenCalledWith({
      crs: "LDS",
      crsDestinations: ["YRK"],
      timeOffset: "30",
      timeWindow: undefined,
    });
    expect(mockContext.status).toBe(200);
    expect(mockContext.body).toBe(TEST_DATA.mockJsonResponse);
  });

  it("should handle multiple destinationCrs parameters", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const controller = new TestController();
    const mockContext = createMockContext(
      { destinationCrs: ["YRK", "DON"], timeWindow: "120" },
      { crs: "LDS" },
    );

    await controller.handle(mockContext as unknown as import("koa").Context);

    expect(mockDarwinService.fetchNextDepartures).toHaveBeenCalledWith({
      crs: "LDS",
      crsDestinations: ["YRK", "DON"],
      timeOffset: undefined,
      timeWindow: "120",
    });
    expect(mockContext.status).toBe(200);
    expect(mockContext.body).toBe(TEST_DATA.mockJsonResponse);
  });

  it("should filter out invalid CRS codes", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const controller = new TestController();
    const mockContext = createMockContext(
      { destinationCrs: ["YRK", "INVALID", "DON", "XX"] },
      { crs: "LDS" },
    );

    await controller.handle(mockContext as unknown as import("koa").Context);

    expect(mockDarwinService.fetchNextDepartures).toHaveBeenCalledWith({
      crs: "LDS",
      crsDestinations: ["YRK", "DON"],
      timeOffset: undefined,
      timeWindow: undefined,
    });
  });

  it("should return 400 when no destinationCrs provided", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const controller = new TestController();
    const mockContext = createMockContext({}, { crs: "LDS" });

    await controller.handle(mockContext as unknown as import("koa").Context);

    expect(mockDarwinService.fetchNextDepartures).not.toHaveBeenCalled();
    expect(mockContext.status).toBe(400);
    expect(mockContext.body).toBe("No 'destinationCrs' provided");
  });

  it("should return 400 when all destinationCrs are invalid", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const controller = new TestController();
    const mockContext = createMockContext(
      { destinationCrs: ["INVALID", "XX", "TOOLONG"] },
      { crs: "LDS" },
    );

    await controller.handle(mockContext as unknown as import("koa").Context);

    expect(mockDarwinService.fetchNextDepartures).not.toHaveBeenCalled();
    expect(mockContext.status).toBe(400);
    expect(mockContext.body).toBe("No 'destinationCrs' provided");
  });

  it("should convert crs parameter to uppercase", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const controller = new TestController();
    const mockContext = createMockContext(
      { destinationCrs: "yrk" },
      { crs: "lds" },
    );

    await controller.handle(mockContext as unknown as import("koa").Context);

    expect(mockDarwinService.fetchNextDepartures).toHaveBeenCalledWith({
      crs: "LDS",
      crsDestinations: ["yrk"],
      timeOffset: undefined,
      timeWindow: undefined,
    });
  });

  it("should use XMLtoJSONConverter with correct operation type", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const controller = new TestController();
    const mockContext = createMockContext(
      { destinationCrs: "YRK" },
      { crs: "LDS" },
    );

    await controller.handle(mockContext as unknown as import("koa").Context);

    expect(MockedXMLtoJSONConverter).toHaveBeenCalledWith(
      TEST_DATA.mockXmlResponse,
      "GetNextDeparturesResponse",
    );
    expect(mockXMLtoJSONConverter.convert).toHaveBeenCalled();
  });

  it("should handle errors thrown by DarwinService", async () => {
    const { mockDarwinService } = setupMockServices();
    mockDarwinService.fetchNextDepartures.mockRejectedValue(
      new Error("Darwin service error"),
    );

    const controller = new TestController();
    const mockContext = createMockContext(
      { destinationCrs: "YRK" },
      { crs: "LDS" },
    );

    await expect(
      controller.handle(mockContext as unknown as import("koa").Context),
    ).rejects.toThrow("Darwin service error");
  });

  it("should handle errors thrown by XMLtoJSONConverter", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    mockDarwinService.fetchNextDepartures.mockResolvedValue(
      TEST_DATA.mockXmlResponse,
    );
    mockXMLtoJSONConverter.convert.mockRejectedValue(
      new Error("XMLtoJSON conversion error"),
    );

    const controller = new TestController();
    const mockContext = createMockContext(
      { destinationCrs: "YRK" },
      { crs: "LDS" },
    );

    await expect(
      controller.handle(mockContext as unknown as import("koa").Context),
    ).rejects.toThrow("XMLtoJSON conversion error");
  });
});

describe("getNextDepartures exported function", () => {
  it("should call controller handle method", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const mockContext = createMockContext(
      { destinationCrs: ["YRK", "DON"] },
      { crs: "LDS" },
    );

    await getNextDepartures(mockContext as unknown as import("koa").Context);

    expect(mockDarwinService.fetchNextDepartures).toHaveBeenCalledWith({
      crs: "LDS",
      crsDestinations: ["YRK", "DON"],
      timeOffset: undefined,
      timeWindow: undefined,
    });
    expect(mockContext.status).toBe(200);
    expect(mockContext.body).toBe(TEST_DATA.mockJsonResponse);
  });

  it("should handle array query parameter selection", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const mockContext = createMockContext(
      {
        destinationCrs: ["YRK", "DON"],
        timeOffset: ["30", "60"],
        timeWindow: "120",
      },
      { crs: "LDS" },
    );

    await getNextDepartures(mockContext as unknown as import("koa").Context);

    expect(mockDarwinService.fetchNextDepartures).toHaveBeenCalledWith({
      crs: "LDS",
      crsDestinations: ["YRK", "DON"],
      timeOffset: "30",
      timeWindow: "120",
    });
  });
});

describe("getNextDeparturesDetailed exported function", () => {
  it("should call controller handle method", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const mockContext = createMockContext(
      { destinationCrs: ["YRK", "DON"] },
      { crs: "LDS" },
    );

    await getNextDeparturesDetailed(
      mockContext as unknown as import("koa").Context,
    );

    expect(
      mockDarwinService.fetchNextDeparturesWithDetails,
    ).toHaveBeenCalledWith({
      crs: "LDS",
      crsDestinations: ["YRK", "DON"],
      timeOffset: undefined,
      timeWindow: undefined,
    });
    expect(mockContext.status).toBe(200);
    expect(mockContext.body).toBe(TEST_DATA.mockJsonResponse);
  });

  it("should handle array query parameter selection", async () => {
    const { mockDarwinService, mockXMLtoJSONConverter } = setupMockServices();
    setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

    const mockContext = createMockContext(
      {
        destinationCrs: ["YRK", "DON"],
        timeOffset: ["30", "60"],
        timeWindow: "120",
      },
      { crs: "LDS" },
    );

    await getNextDeparturesDetailed(
      mockContext as unknown as import("koa").Context,
    );

    expect(
      mockDarwinService.fetchNextDeparturesWithDetails,
    ).toHaveBeenCalledWith({
      crs: "LDS",
      crsDestinations: ["YRK", "DON"],
      timeOffset: "30",
      timeWindow: "120",
    });
  });
});
