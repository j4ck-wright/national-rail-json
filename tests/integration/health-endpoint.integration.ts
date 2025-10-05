import cors from "@koa/cors";
import Koa from "koa";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { globalErrorCatcher } from "@/api/middleware/error-handler";
import { logRoute } from "@/api/middleware/log-route";
import healthRoutes from "@/api/routes/health-route";

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Health Endpoint Integration Test", () => {
  let app: Koa;

  beforeEach(() => {
    app = new Koa();
    app.use(globalErrorCatcher);
    app.use(logRoute);
    app.use(cors());
    app.use(healthRoutes.routes());
  });

  it("should return health status with 200 OK", async () => {
    const response = await request(app.callback()).get("/health").expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      uptime: expect.any(Number),
    });

    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("should return JSON content type", async () => {
    const response = await request(app.callback()).get("/health").expect(200);

    expect(response.headers["content-type"]).toMatch(/application\/json/);
  });
});
