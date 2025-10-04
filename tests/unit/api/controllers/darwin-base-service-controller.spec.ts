import { beforeEach, expect, test, vi } from "vitest";
import type { DarwinOperation } from "@/api/controllers/darwin-base-class-controller";
import {
  BaseServiceIdController,
  type DarwinServiceMethodNames,
  getServiceDetails,
} from "@/api/controllers/darwin-base-service-controller";
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
  validServiceId: "ABC123456789",
  mockToken: "mock-token",
  mockXmlResponse: "mock-xml-response",
  mockJsonResponse: { data: "mock-json" },
  serviceOptions: {
    serviceID: "ABC123456789",
  },
};

const CONTROLLER_TEST_CASES = [
  {
    methodName: "fetchServiceDetails",
    responseType: "GetServiceDetailsResponse",
    serviceMethod: "fetchServiceDetails",
  },
] as const;

const EXPORTED_FUNCTION_TEST_CASES = [
  {
    functionName: "getServiceDetails",
    function: getServiceDetails,
    serviceMethod: "fetchServiceDetails",
    expectedResponseType: "GetServiceDetailsResponse",
  },
];

class TestServiceController extends BaseServiceIdController {
  protected readonly methodName = "fetchServiceDetails";
  protected readonly responseType = "GetServiceDetailsResponse";
}

function createMockContext(params: Record<string, string> = {}) {
  return {
    params,
    status: 0,
    body: null,
  };
}

function setupMockServices() {
  const mockDarwinService = {
    fetchServiceDetails: vi.fn(),
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
  mockDarwinService.fetchServiceDetails.mockResolvedValue(
    TEST_DATA.mockXmlResponse,
  );
  mockXMLtoJSONConverter.convert.mockResolvedValue(TEST_DATA.mockJsonResponse);
}

describe("DarwinBaseServiceController", () => {
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

  describe("BaseServiceIdController", () => {
    describe("fetchServiceData", () => {
      test.each(CONTROLLER_TEST_CASES)(
        'should call darwinService.$serviceMethod when methodName is "$methodName"',
        async ({ methodName, responseType, serviceMethod }) => {
          class TestController extends BaseServiceIdController {
            protected readonly methodName = methodName;
            protected readonly responseType = responseType;
          }

          const controller = new TestController();
          const options = {
            serviceID: TEST_DATA.validServiceId,
          };
          mockDarwinService[serviceMethod].mockResolvedValue(
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

          expect(mockDarwinService[serviceMethod]).toHaveBeenCalledWith(
            options,
          );
          expect(result).toBe(TEST_DATA.mockXmlResponse);
        },
      );

      it("should throw an error for invalid methodName", async () => {
        class InvalidTestController extends BaseServiceIdController {
          protected readonly methodName =
            "invalidMethod" as DarwinServiceMethodNames;
          protected readonly responseType =
            "GetServiceDetailsResponse" as DarwinOperation;
        }

        const controller = new InvalidTestController();
        const options = { serviceID: "ABC123" };

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
        const controller = new TestServiceController();
        const options = {
          serviceID: TEST_DATA.validServiceId,
        };
        mockDarwinService.fetchServiceDetails.mockResolvedValue(
          "mock-xml-response",
        );

        await (
          controller as unknown as {
            fetchServiceData: (
              service: unknown,
              options: unknown,
            ) => Promise<string>;
          }
        ).fetchServiceData(mockDarwinService, options);

        expect(mockDarwinService.fetchServiceDetails).toHaveBeenCalledWith(
          options,
        );
      });
    });

    describe("handle", () => {
      let mockContext: ReturnType<typeof createMockContext>;

      beforeEach(() => {
        mockContext = createMockContext();
      });

      it("should use serviceId and return JSON data", async () => {
        const controller = new TestServiceController();
        mockContext = createMockContext({
          serviceId: TEST_DATA.validServiceId,
        });
        setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

        await controller.handle(
          mockContext as unknown as import("koa").Context,
        );

        expect(MockedDarwinService).toHaveBeenCalledWith(TEST_DATA.mockToken);
        expect(mockDarwinService.fetchServiceDetails).toHaveBeenCalledWith({
          serviceID: TEST_DATA.validServiceId,
        });
        expect(MockedXMLtoJSONConverter).toHaveBeenCalledWith(
          TEST_DATA.mockXmlResponse,
          "GetServiceDetailsResponse",
        );
        expect(mockXMLtoJSONConverter.convert).toHaveBeenCalled();
        expect(mockContext.body).toBe(TEST_DATA.mockJsonResponse);
        expect(mockContext.status).toBe(200);
      });

      it("should create XMLtoJSONConverter with correct response type", async () => {
        const controller = new TestServiceController();
        mockContext = createMockContext({
          serviceId: TEST_DATA.validServiceId,
        });
        setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

        await controller.handle(
          mockContext as unknown as import("koa").Context,
        );

        expect(MockedXMLtoJSONConverter).toHaveBeenCalledWith(
          TEST_DATA.mockXmlResponse,
          "GetServiceDetailsResponse",
        );
      });

      it("should use the serviceId from context params", async () => {
        const controller = new TestServiceController();
        const customServiceId = "CUSTOM123456";
        mockContext = createMockContext({ serviceId: customServiceId });
        setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);

        await controller.handle(
          mockContext as unknown as import("koa").Context,
        );

        expect(mockDarwinService.fetchServiceDetails).toHaveBeenCalledWith({
          serviceID: customServiceId,
        });
      });
    });
  });

  describe("Exported Functions", () => {
    let mockContext: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      mockContext = createMockContext();
      setupSuccessfulResponse(mockDarwinService, mockXMLtoJSONConverter);
    });

    test.each(EXPORTED_FUNCTION_TEST_CASES)(
      "$functionName should handle request correctly",
      async ({ function: exportedFunction, expectedResponseType }) => {
        mockContext = createMockContext({
          serviceId: TEST_DATA.validServiceId,
        });

        await exportedFunction(mockContext as unknown as import("koa").Context);

        expect(MockedDarwinService).toHaveBeenCalledWith(TEST_DATA.mockToken);
        expect(mockDarwinService.fetchServiceDetails).toHaveBeenCalledWith({
          serviceID: TEST_DATA.validServiceId,
        });
        expect(MockedXMLtoJSONConverter).toHaveBeenCalledWith(
          TEST_DATA.mockXmlResponse,
          expectedResponseType,
        );
        expect(mockXMLtoJSONConverter.convert).toHaveBeenCalled();
        expect(mockContext.body).toBe(TEST_DATA.mockJsonResponse);
        expect(mockContext.status).toBe(200);
      },
    );
  });

  describe("Error Handling", () => {
    let mockContext: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      mockContext = createMockContext({
        serviceId: TEST_DATA.validServiceId,
      });
    });

    it("should propagate DarwinService errors", async () => {
      const controller = new TestServiceController();
      const serviceError = new Error("Darwin service error");
      mockDarwinService.fetchServiceDetails.mockRejectedValue(serviceError);

      await expect(
        controller.handle(mockContext as unknown as import("koa").Context),
      ).rejects.toThrow("Darwin service error");
    });

    it("should propagate XMLtoJSONConverter errors", async () => {
      const controller = new TestServiceController();
      const converterError = new Error("XML conversion error");
      mockDarwinService.fetchServiceDetails.mockResolvedValue(
        TEST_DATA.mockXmlResponse,
      );
      mockXMLtoJSONConverter.convert.mockRejectedValue(converterError);

      await expect(
        controller.handle(mockContext as unknown as import("koa").Context),
      ).rejects.toThrow("XML conversion error");
    });
  });
});
