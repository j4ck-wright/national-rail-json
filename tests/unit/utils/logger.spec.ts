import { vi } from "vitest";
import winston from "winston";

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

vi.mock("winston", () => ({
  default: {
    createLogger: vi.fn(() => mockLogger),
    format: {
      combine: vi.fn(() => vi.fn()),
      timestamp: vi.fn(() => vi.fn()),
      json: vi.fn(() => vi.fn()),
      errors: vi.fn(() => vi.fn()),
    },
    transports: {
      Console: vi.fn(),
    },
  },
}));

vi.mock("dotenv", () => ({
  default: {
    config: vi.fn(),
  },
}));

describe("logger", () => {
  const BASE_ENV = process.env;
  const mockCreateLogger = vi.mocked(winston.createLogger);

  beforeEach(() => {
    process.env = { ...BASE_ENV };
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...BASE_ENV };
  });

  it("should log messages correctly", async () => {
    const { logger } = await import("@/utils/logger");

    logger.info("test message");
    logger.error("error message");
    logger.warn("warning message");
    logger.debug("debug message");

    expect(mockLogger.info).toHaveBeenCalledWith("test message");
    expect(mockLogger.error).toHaveBeenCalledWith("error message");
    expect(mockLogger.warn).toHaveBeenCalledWith("warning message");
    expect(mockLogger.debug).toHaveBeenCalledWith("debug message");
  });

  it("should include service name in metadata", async () => {
    await import("@/utils/logger");

    expect(mockCreateLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultMeta: {
          service: "nationl-rail-json",
        },
      }),
    );
  });

  it("should use default log level when no env is set", async () => {
    delete process.env["LOG_LEVEL"];

    await import("@/utils/logger");

    expect(mockCreateLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
      }),
    );
  });

  it("should use custom log level from env var", async () => {
    process.env["LOG_LEVEL"] = "error";

    await import("@/utils/logger");

    expect(mockCreateLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
      }),
    );
  });
});
