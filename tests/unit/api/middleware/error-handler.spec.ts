import type { Context, Next } from "koa";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { globalErrorCatcher } from "@/api/middleware/error-handler";
import { DarwinError } from "@/errors/DarwinError";
import { logger } from "@/utils/logger";

vi.mock("@/utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
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

  test("should pass through when no error is thrown", async () => {
    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockNext).toHaveBeenCalledOnce();
    expect(mockContext.status).toBe(200);
    expect(mockContext.body).toBeNull();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test("should handle generic Error instances", async () => {
    const error = new Error("Something went wrong");
    mockNext = vi.fn().mockRejectedValue(error);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(500);
    expect(mockContext.body).toEqual({ error: "Something went wrong" });
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Unhandled error: Error: Something went wrong",
    );
  });

  test("should handle DarwinError with status code and status text", async () => {
    const darwinError = new DarwinError(
      "Darwin service failed",
      400,
      "Bad Request",
    );
    mockNext = vi.fn().mockRejectedValue(darwinError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(400);
    expect(mockContext.body).toBe("Bad Request");
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Unhandled error: ${darwinError}`,
    );
  });

  test("should handle DarwinError without status code (defaults to 500)", async () => {
    const darwinError = new DarwinError(
      "Darwin service failed",
      undefined,
      "Service Error",
    );
    mockNext = vi.fn().mockRejectedValue(darwinError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(500);
    expect(mockContext.body).toBe("Service Error");
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Unhandled error: ${darwinError}`,
    );
  });

  test("should handle DarwinError with null status code (defaults to 500)", async () => {
    const darwinError = new DarwinError(
      "Darwin service failed",
      null as unknown as number,
      "Service Error",
    );
    mockNext = vi.fn().mockRejectedValue(darwinError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(500);
    expect(mockContext.body).toBe("Service Error");
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Unhandled error: ${darwinError}`,
    );
  });

  test("should handle non-Error objects", async () => {
    const nonError = "String error";
    mockNext = vi.fn().mockRejectedValue(nonError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(200);
    expect(mockContext.body).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Unhandled error: String error",
    );
  });

  test("should handle null/undefined errors", async () => {
    mockNext = vi.fn().mockRejectedValue(null);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(200);
    expect(mockContext.body).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith("Unhandled error: null");
  });

  test("should preserve original context properties when no error occurs", async () => {
    mockContext.status = 201;
    mockContext.body = { success: true };

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(201);
    expect(mockContext.body).toEqual({ success: true });
  });

  test("should handle DarwinError with statusText as null", async () => {
    const darwinError = new DarwinError("Service error", 503, null);
    mockNext = vi.fn().mockRejectedValue(darwinError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(503);
    expect(mockContext.body).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Unhandled error: ${darwinError}`,
    );
  });

  test("should verify Error instanceof check works for regular Error", async () => {
    const regularError = new Error("Regular error message");
    mockNext = vi.fn().mockRejectedValue(regularError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(500);
    expect(mockContext.body).toEqual({ error: "Regular error message" });
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Unhandled error: Error: Regular error message",
    );
  });

  test("should verify DarwinError instanceof checks work correctly", async () => {
    const darwinError = new DarwinError("Darwin message", 400, "Bad Request");

    expect(darwinError instanceof Error).toBe(true);
    expect(darwinError instanceof DarwinError).toBe(true);

    mockNext = vi.fn().mockRejectedValue(darwinError);

    await globalErrorCatcher(mockContext as Context, mockNext);

    expect(mockContext.status).toBe(400);
    expect(mockContext.body).toBe("Bad Request");
  });
});
