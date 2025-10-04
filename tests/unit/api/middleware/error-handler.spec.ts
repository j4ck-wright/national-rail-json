import type { Context, Next } from "koa";
import { beforeEach, expect, vi } from "vitest";
import { parseStringPromise } from "xml2js";
import { globalErrorCatcher } from "@/api/middleware/error-handler";
import { DarwinError } from "@/errors/DarwinError";
import { logger } from "@/utils/logger";

vi.mock("@/utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("xml2js", () => ({
  parseStringPromise: vi.fn(),
}));

const mockLogger = vi.mocked(logger);

describe("globalErrorCatcher middleware", () => {
  let mockContext: Partial<Context>;
  let mockNext: Next;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      status: 200,
      body: null,
    };

    mockNext = vi.fn().mockResolvedValue(undefined);
  });

  it("should pass through when no error is thrown", async () => {
    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockNext).toHaveBeenCalledOnce();
    expect(mockContext.status).toBe(200);
    expect(mockContext.body).toBeNull();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it("should handle generic Error instances", async () => {
    const error = new Error("Something went wrong");
    mockNext = vi.fn().mockRejectedValue(error);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(500);
    expect(mockContext.body).toEqual({ error: "Something went wrong" });
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Unhandled error: Error: Something went wrong",
    );
  });

  it("should handle DarwinError with status code and body", async () => {
    const darwinError = new DarwinError(
      "Darwin service failed",
      400,
      "Bad Request",
      "Error details",
    );
    mockNext = vi.fn().mockRejectedValue(darwinError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(400);
    expect(mockContext.body).toEqual({ error: "Error details" });
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Unhandled error: ${darwinError}`,
    );
  });

  it("should handle DarwinError without status code (defaults to 500)", async () => {
    const darwinError = new DarwinError(
      "Darwin service failed",
      undefined,
      "Service Error",
      "Error body",
    );
    mockNext = vi.fn().mockRejectedValue(darwinError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(500);
    expect(mockContext.body).toEqual({ error: "Error body" });
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Unhandled error: ${darwinError}`,
    );
  });

  it("should handle DarwinError with null status code (defaults to 500)", async () => {
    const darwinError = new DarwinError(
      "Darwin service failed",
      null as unknown as number,
      "Service Error",
      "Error body",
    );
    mockNext = vi.fn().mockRejectedValue(darwinError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(500);
    expect(mockContext.body).toEqual({ error: "Error body" });
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Unhandled error: ${darwinError}`,
    );
  });

  it("should handle non-Error objects", async () => {
    const nonError = "String error";
    mockNext = vi.fn().mockRejectedValue(nonError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(500);
    expect(mockContext.body).toEqual({ error: "Internal Server Error" });
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Unhandled error: String error",
    );
  });

  it("should handle null/undefined errors", async () => {
    mockNext = vi.fn().mockRejectedValue(null);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(500);
    expect(mockContext.body).toEqual({ error: "Internal Server Error" });
    expect(mockLogger.error).toHaveBeenCalledWith("Unhandled error: null");
  });

  it("should preserve original context properties when no error occurs", async () => {
    mockContext.status = 201;
    mockContext.body = { success: true };

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(201);
    expect(mockContext.body).toEqual({ success: true });
  });

  it("should handle DarwinError with body as null", async () => {
    const darwinError = new DarwinError("Service error", 503, null, null);
    mockNext = vi.fn().mockRejectedValue(darwinError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(503);
    expect(mockContext.body).toEqual({ error: "Service error" });
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Unhandled error: ${darwinError}`,
    );
  });

  it("should verify Error instanceof check works for regular Error", async () => {
    const regularError = new Error("Regular error message");
    mockNext = vi.fn().mockRejectedValue(regularError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(500);
    expect(mockContext.body).toEqual({ error: "Regular error message" });
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Unhandled error: Error: Regular error message",
    );
  });

  it("should verify DarwinError instanceof checks work correctly", async () => {
    const darwinError = new DarwinError(
      "Darwin message",
      400,
      "Bad Request",
      "Error body",
    );

    expect(darwinError instanceof Error).toBe(true);
    expect(darwinError instanceof DarwinError).toBe(true);

    mockNext = vi.fn().mockRejectedValue(darwinError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(400);
    expect(mockContext.body).toEqual({ error: "Error body" });
  });

  describe("SOAP fault handling", () => {
    const mockParseStringPromise = vi.mocked(parseStringPromise);

    beforeEach(() => {
      mockParseStringPromise.mockReset();
    });

    it("should return 404 for Invalid Service ID SOAP fault", async () => {
      const soapFaultXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <soap:Fault>
      <soap:Code>
        <soap:Value>soap:Sender</soap:Value>
      </soap:Code>
      <soap:Reason>
        <soap:Text xml:lang="en">Invalid Service ID</soap:Text>
      </soap:Reason>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;

      mockParseStringPromise.mockResolvedValue({
        "soap:Envelope": {
          "soap:Body": {
            "soap:Fault": {
              "soap:Code": {
                "soap:Value": "soap:Sender",
              },
              "soap:Reason": {
                "soap:Text": "Invalid Service ID",
              },
            },
          },
        },
      });

      const darwinError = new DarwinError(
        "SOAP Fault",
        500,
        "Internal Server Error",
        soapFaultXml,
      );
      mockNext = vi.fn().mockRejectedValue(darwinError);

      await globalErrorCatcher(mockContext as Context, mockNext);

      expect(mockContext.status).toBe(404);
      expect(mockContext.body).toEqual({
        error: "Service not found",
        message: "Invalid Service ID",
      });
    });

    it("should handle other SOAP faults with appropriate status", async () => {
      const soapFaultXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <soap:Fault>
      <soap:Code>
        <soap:Value>soap:Server</soap:Value>
      </soap:Code>
      <soap:Reason>
        <soap:Text xml:lang="en">Internal server error</soap:Text>
      </soap:Reason>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;

      mockParseStringPromise.mockResolvedValue({
        "soap:Envelope": {
          "soap:Body": {
            "soap:Fault": {
              "soap:Code": {
                "soap:Value": "soap:Server",
              },
              "soap:Reason": {
                "soap:Text": "Internal server error",
              },
            },
          },
        },
      });

      const darwinError = new DarwinError(
        "SOAP Fault",
        400,
        "Bad Request",
        soapFaultXml,
      );
      mockNext = vi.fn().mockRejectedValue(darwinError);

      await globalErrorCatcher(mockContext as Context, mockNext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.body).toEqual({
        error: "Internal server error",
      });
    });

    it("should fallback to original error when SOAP parsing fails", async () => {
      const invalidXml = "not valid xml";
      mockParseStringPromise.mockRejectedValue(new Error("XML parsing failed"));

      const darwinError = new DarwinError(
        "SOAP Fault",
        400,
        "Bad Request",
        invalidXml,
      );
      mockNext = vi.fn().mockRejectedValue(darwinError);

      await globalErrorCatcher(mockContext as Context, mockNext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.body).toEqual({ error: invalidXml });
    });

    it("should fallback when XML doesn't contain SOAP fault", async () => {
      const nonSoapXml = "<root>Not a SOAP fault</root>";
      mockParseStringPromise.mockResolvedValue({
        root: "Not a SOAP fault",
      });

      const darwinError = new DarwinError(
        "SOAP Fault",
        400,
        "Bad Request",
        nonSoapXml,
      );
      mockNext = vi.fn().mockRejectedValue(darwinError);

      await globalErrorCatcher(mockContext as Context, mockNext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.body).toEqual({ error: nonSoapXml });
    });
  });
});
