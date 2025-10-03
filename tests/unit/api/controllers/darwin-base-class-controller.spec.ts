import { beforeEach, expect, test, vi } from "vitest";
import {
  BaseServiceController,
  type DarwinMethodNames,
  type DarwinOperation,
  getArrivals,
  getDepartures,
  getDetailedArrivals,
  getDetailedDepartures,
} from "@/api/controllers/darwin-base-class-controller";
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
  validCrs: "LON",
  invalidCrs: "LO",
  mockToken: "mock-token",
  mockXmlResponse: "mock-xml-response",
  mockJsonResponse: { data: "mock-json" },
  defaultNumRows: "10",
  serviceOptions: {
    crs: "LON",
    numRows: "15",
    filterCrs: "BHM",
    filterType: "to" as const,
    timeOffset: "30",
    timeWindow: "120",
  },
} as const;

const CONTROLLER_TEST_CASES = [
  {
    methodName: "fetchArrivals" as DarwinMethodNames,
    responseType: "GetArrivalBoardResponse" as DarwinOperation,
    mockMethod: "fetchArrivals" as DarwinMethodNames,
  },
  {
    methodName: "fetchDepartures" as DarwinMethodNames,
    responseType: "GetDepartureBoardResponse" as DarwinOperation,
    mockMethod: "fetchDepartures" as DarwinMethodNames,
  },
  {
    methodName: "fetchDetailedArrivals" as DarwinMethodNames,
    responseType: "GetArrBoardWithDetailsResponse" as DarwinOperation,
    mockMethod: "fetchDetailedArrivals" as DarwinMethodNames,
  },
  {
    methodName: "fetchDetailedDepartures" as DarwinMethodNames,
    responseType: "GetDepBoardWithDetailsResponse" as DarwinOperation,
    mockMethod: "fetchDetailedDepartures" as DarwinMethodNames,
  },
] as const;

const EXPORTED_FUNCTION_TEST_CASES = [
  {
    functionName: "getArrivals",
    function: getArrivals,
    mockMethod: "fetchArrivals" as const,
    expectedResponseType: "GetArrivalBoardResponse",
  },
  {
    functionName: "getDepartures",
    function: getDepartures,
    mockMethod: "fetchDepartures" as const,
    expectedResponseType: "GetDepartureBoardResponse",
  },
  {
    functionName: "getDetailedArrivals",
    function: getDetailedArrivals,
    mockMethod: "fetchDetailedArrivals" as const,
    expectedResponseType: "GetArrBoardWithDetailsResponse",
  },
  {
    functionName: "getDetailedDepartures",
    function: getDetailedDepartures,
    mockMethod: "fetchDetailedDepartures" as const,
    expectedResponseType: "GetDepBoardWithDetailsResponse",
  },
] as const;

class TestController extends BaseServiceController {
  protected readonly methodName = "fetchArrivals" as const;
  protected readonly responseType = "GetArrivalBoardResponse" as const;
}

function createMockContext(query: Record<string, string | string[]> = {}) {
  return {
    request: { query },
    status: 0,
    body: null,
  };
}

function setupMockServices() {
  const mockDarwinService = {
    fetchArrivals: vi.fn(),
    fetchDepartures: vi.fn(),
    fetchDetailedArrivals: vi.fn(),
    fetchDetailedDepartures: vi.fn(),
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
  mockDarwinService.fetchArrivals.mockResolvedValue(TEST_DATA.mockXmlResponse);
  mockDarwinService.fetchDepartures.mockResolvedValue(
    TEST_DATA.mockXmlResponse,
  );
  mockDarwinService.fetchDetailedArrivals.mockResolvedValue(
    TEST_DATA.mockXmlResponse,
  );
  mockDarwinService.fetchDetailedDepartures.mockResolvedValue(
    TEST_DATA.mockXmlResponse,
  );
  mockXMLtoJSONConverter.convert.mockResolvedValue(TEST_DATA.mockJsonResponse);
}

describe("DarwinBaseClassController", () => {
  let mockDarwinService: ReturnType<
    typeof setupMockServices
  >["mockDarwinService"];
  let mockXMLtoJSONConverter: ReturnType<
    typeof setupMockServices
  >["mockXMLtoJSONConverter"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mocks = setupMockServices();
    mockDarwinService = mocks.mockDarwinService;
    mockXMLtoJSONConverter = mocks.mockXMLtoJSONConverter;
  });

  describe("BaseServiceController", () => {
    describe("fetchServiceData", () => {
      test.each(CONTROLLER_TEST_CASES)(
        'should call darwinService.$mockMethod when methodName is "$methodName"',
        async ({ methodName, responseType, mockMethod }) => {
          class TestController extends BaseServiceController {
            protected readonly methodName = methodName;
            protected readonly responseType = responseType;
          }

          const controller = new TestController();
          const options = {
            crs: TEST_DATA.validCrs,
            numRows: TEST_DATA.defaultNumRows,
          };
          mockDarwinService[mockMethod].mockResolvedValue(
            TEST_DATA.mockXmlResponse,
          );

          const result = await (
            controller as unknown as {
              fetchServiceData: (
                service: unknown,
                options: unknown,
              ) => Promise<string>;
            }
          ).fetchServiceData(mockDarwinService, options);

          expect(mockDarwinService[mockMethod]).toHaveBeenCalledWith(options);
          expect(result).toBe(TEST_DATA.mockXmlResponse);
        },
      );

      it("should throw an error for invalid methodName", async () => {
        class InvalidTestController extends BaseServiceController {
          protected readonly methodName = "invalidMethod" as DarwinMethodNames;
          protected readonly responseType =
            "GetArrivalBoardResponse" as DarwinOperation;
        }

        const controller = new InvalidTestController();
        const options = { crs: "LON", numRows: "10" };

        await expect(
          (
            controller as unknown as {
              fetchServiceData: (
                service: unknown,
                options: unknown,
              ) => Promise<string>;
            }
          ).fetchServiceData(mockDarwinService, options),
        ).rejects.toThrow("Invalid method name: invalidMethod");
      });

      it("should pass options correctly to the darwin service method", async () => {
        const controller = new TestController();
        const options = {
          crs: "LON",
          numRows: "15",
          filterCrs: "BHM",
          filterType: "to",
          timeOffset: "30",
          timeWindow: "120",
        };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml-response");

        await (
          controller as unknown as {
            fetchServiceData: (
              service: unknown,
              options: unknown,
            ) => Promise<string>;
          }
        ).fetchServiceData(mockDarwinService, options);

        expect(mockDarwinService.fetchArrivals).toHaveBeenCalledWith(options);
      });

      it("If valid filterType is used, don't switch to default", async () => {
        const controller = new TestController();
        const options = {
          crs: "LON",
          filterCrs: "BHM",
          filterType: "from",
        };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml-response");

        await (
          controller as unknown as {
            fetchServiceData: (
              service: unknown,
              options: unknown,
            ) => Promise<string>;
          }
        ).fetchServiceData(mockDarwinService, options);

        expect(mockDarwinService.fetchArrivals).toHaveBeenCalledWith(options);
      });
    });

    describe("handle", () => {
      let mockContext: ReturnType<typeof createMockContext>;

      beforeEach(() => {
        mockContext = createMockContext();
      });

      it("should return 400 error when crs query parameter is missing", async () => {
        const controller = new TestController();
        mockContext = createMockContext({});

        await controller.handle(mockContext as import("koa").Context);

        expect(mockContext.status).toBe(400);
        expect(mockContext.body).toEqual({
          error: "Missing 'crs' query parameter",
        });
      });

      it("should return 400 error when crs length is not 3 characters", async () => {
        const controller = new TestController();
        mockContext = createMockContext({ crs: TEST_DATA.invalidCrs });

        await controller.handle(mockContext as import("koa").Context);

        expect(mockContext.status).toBe(400);
        expect(mockContext.body).toEqual({ error: "invalid 'crs'" });
      });

      it("should convert crs to uppercase", async () => {
        const controller = new TestController();
        mockContext = createMockContext({ crs: "lon" });
        setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

        await controller.handle(mockContext as import("koa").Context);

        expect(MockedDarwinService).toHaveBeenCalledWith(TEST_DATA.mockToken);
        expect(mockDarwinService.fetchArrivals).toHaveBeenCalledWith(
          expect.objectContaining({ crs: TEST_DATA.validCrs }),
        );
      });

      it('should use default numRows of "10" when not provided', async () => {
        const controller = new TestController();
        mockContext = createMockContext({ crs: TEST_DATA.validCrs });
        setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

        await controller.handle(mockContext as import("koa").Context);

        expect(mockDarwinService.fetchArrivals).toHaveBeenCalledWith(
          expect.objectContaining({ numRows: TEST_DATA.defaultNumRows }),
        );
      });

      it("should pick the first query parameter if user gives an array", async () => {
        const controller = new TestController();
        mockContext.request.query = {
          crs: ["LON", "BHM"],
          numRows: "15",
        };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml");
        mockXMLtoJSONConverter.convert.mockResolvedValue({ data: "mock-json" });

        await controller.handle(mockContext as import("koa").Context);

        expect(mockDarwinService.fetchArrivals).toHaveBeenCalledWith(
          expect.objectContaining({ crs: "LON" }),
        );
      });

      it("should create DarwinService with correct token", async () => {
        const controller = new TestController();
        mockContext.request.query = { crs: "LON" };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml");
        mockXMLtoJSONConverter.convert.mockResolvedValue({ data: "mock-json" });

        await controller.handle(mockContext as import("koa").Context);

        expect(MockedDarwinService).toHaveBeenCalledWith("mock-token");
      });

      it("should fetch service data using the correct options", async () => {
        const controller = new TestController();
        mockContext.request.query = {
          crs: "LON",
          numRows: "15",
          filterCrs: "BHM",
          filterType: "to",
          timeOffset: "30",
          timeWindow: "120",
        };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml");
        mockXMLtoJSONConverter.convert.mockResolvedValue({ data: "mock-json" });

        await controller.handle(mockContext as import("koa").Context);

        expect(mockDarwinService.fetchArrivals).toHaveBeenCalledWith({
          crs: "LON",
          numRows: "15",
          filterCrs: "BHM",
          filterType: "to",
          timeOffset: "30",
          timeWindow: "120",
        });
      });

      it("should convert XML response to JSON using XMLtoJSONConverter", async () => {
        const controller = new TestController();
        mockContext.request.query = { crs: "LON" };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml-response");
        mockXMLtoJSONConverter.convert.mockResolvedValue({ data: "mock-json" });

        await controller.handle(mockContext as import("koa").Context);

        expect(MockedXMLtoJSONConverter).toHaveBeenCalledWith(
          "mock-xml-response",
          "GetArrivalBoardResponse",
        );
        expect(mockXMLtoJSONConverter.convert).toHaveBeenCalled();
      });

      it("should return JSON data with 200 status on success", async () => {
        const controller = new TestController();
        mockContext.request.query = { crs: "LON" };
        const mockJsonData = { data: "mock-json-data" };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml");
        mockXMLtoJSONConverter.convert.mockResolvedValue(mockJsonData);

        await controller.handle(mockContext as import("koa").Context);

        expect(mockContext.status).toBe(200);
        expect(mockContext.body).toEqual(mockJsonData);
      });

      it("should handle filterCrs parameter correctly", async () => {
        const controller = new TestController();
        mockContext.request.query = { crs: "LON", filterCrs: "BHM" };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml");
        mockXMLtoJSONConverter.convert.mockResolvedValue({ data: "mock-json" });

        await controller.handle(mockContext as import("koa").Context);

        expect(mockDarwinService.fetchArrivals).toHaveBeenCalledWith(
          expect.objectContaining({ filterCrs: "BHM" }),
        );
      });

      it("should fallback to default filterType if invalid value is provided", async () => {
        const controller = new TestController();
        mockContext.request.query = { crs: "LON", filterType: "everywhere!" };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml");
        mockXMLtoJSONConverter.convert.mockResolvedValue({ data: "mock-json" });

        await controller.handle(mockContext as import("koa").Context);

        expect(mockDarwinService.fetchArrivals).toHaveBeenCalledWith(
          expect.objectContaining({ filterType: "to" }),
        );
      });

      it("should handle timeOffset parameter correctly", async () => {
        const controller = new TestController();
        mockContext.request.query = { crs: "LON", timeOffset: "30" };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml");
        mockXMLtoJSONConverter.convert.mockResolvedValue({ data: "mock-json" });

        await controller.handle(mockContext as import("koa").Context);

        expect(mockDarwinService.fetchArrivals).toHaveBeenCalledWith(
          expect.objectContaining({ timeOffset: "30" }),
        );
      });

      it("should handle timeWindow parameter correctly", async () => {
        const controller = new TestController();
        mockContext.request.query = { crs: "LON", timeWindow: "120" };
        mockDarwinService.fetchArrivals.mockResolvedValue("mock-xml");
        mockXMLtoJSONConverter.convert.mockResolvedValue({ data: "mock-json" });

        await controller.handle(mockContext as import("koa").Context);

        expect(mockDarwinService.fetchArrivals).toHaveBeenCalledWith(
          expect.objectContaining({ timeWindow: "120" }),
        );
      });

      it("should handle errors thrown by DarwinService", async () => {
        const controller = new TestController();
        mockContext.request.query = { crs: "LON" };
        mockDarwinService.fetchArrivals.mockRejectedValue(
          new Error("Darwin service error"),
        );

        await expect(
          controller.handle(mockContext as import("koa").Context),
        ).rejects.toThrow("Darwin service error");
      });
    });
  });

  describe("Exported functions", () => {
    let mockContext: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      mockContext = createMockContext({ crs: TEST_DATA.validCrs });
      setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);
    });

    test.each(EXPORTED_FUNCTION_TEST_CASES)(
      "$functionName should call controller.handle with context",
      async ({ function: testFunction, mockMethod, expectedResponseType }) => {
        await testFunction(mockContext as import("koa").Context);

        expect(MockedDarwinService).toHaveBeenCalledWith(TEST_DATA.mockToken);
        expect(mockDarwinService[mockMethod]).toHaveBeenCalled();
        expect(MockedXMLtoJSONConverter).toHaveBeenCalledWith(
          TEST_DATA.mockXmlResponse,
          expectedResponseType,
        );
        expect(mockContext.status).toBe(200);
      },
    );
  });
});
