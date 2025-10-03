import type { Context, Next } from "koa";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { logRoute } from "@/api/middleware/log-route";
import { logger } from "@/utils/logger";

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
  },
}));

const mockLogger = vi.mocked(logger);

describe("logRoute middleware", () => {
  let mockContext: Partial<Context>;
  let mockNext: Next;
  let originalDateNow: typeof Date.now;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      method: "GET",
      url: "/test-endpoint",
      status: 200,
      headers: {
        "user-agent": "test-agent",
        accept: "application/json",
      },
    };

    mockNext = vi.fn().mockResolvedValue(undefined);

    originalDateNow = Date.now;
    let callCount = 0;
    Date.now = vi.fn(() => {
      callCount++;
      return callCount === 1 ? 1000 : 1150;
    });
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  test("should log request details after middleware execution", async () => {
    await logRoute(mockContext as Context, mockNext);

    expect(mockNext).toHaveBeenCalledOnce();
    expect(mockLogger.info).toHaveBeenCalledWith({
      method: "GET",
      url: "/test-endpoint",
      status: 200,
      headers: {
        "user-agent": "test-agent",
        accept: "application/json",
      },
      duration: "150ms",
    });
  });

  test("should calculate correct duration", async () => {
    const startTime = 2000;
    const endTime = 2250;
    let callCount = 0;

    Date.now = vi.fn(() => {
      callCount++;
      return callCount === 1 ? startTime : endTime;
    });

    await logRoute(mockContext as Context, mockNext);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: "250ms",
      }),
    );
  });

  test("should log even when next() throws an error", async () => {
    const error = new Error("Middleware error");
    mockNext = vi.fn().mockRejectedValue(error);

    await expect(logRoute(mockContext as Context, mockNext)).rejects.toThrow(
      "Middleware error",
    );

    expect(mockLogger.info).toHaveBeenCalledWith({
      method: "GET",
      url: "/test-endpoint",
      status: 200,
      headers: {
        "user-agent": "test-agent",
        accept: "application/json",
      },
      duration: "150ms",
    });
  });

  test("should handle requests with no headers", async () => {
    mockContext.headers = {};

    await logRoute(mockContext as Context, mockNext);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {},
      }),
    );
  });

  test("should preserve the order of execution (next called before logging)", async () => {
    const executionOrder: string[] = [];

    mockNext = vi.fn().mockImplementation(async () => {
      executionOrder.push("next");
    });

    const originalLoggerInfo = mockLogger.info;
    mockLogger.info = vi.fn().mockImplementation((logData) => {
      executionOrder.push("log");
      return originalLoggerInfo(logData);
    });

    await logRoute(mockContext as Context, mockNext);

    expect(executionOrder).toEqual(["next", "log"]);
  });
});
