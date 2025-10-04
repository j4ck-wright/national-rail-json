import cors from "@koa/cors";
import Koa from "koa";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { globalErrorCatcher } from "@/api/middleware/error-handler";
import { logRoute } from "@/api/middleware/log-route";
import swaggerRoutes from "@/api/routes/swagger-routes";

vi.mock("@/utils/config", () => ({
  config: {
    DARWIN: {
      TOKEN: "mock-token",
      ENDPOINT: "https://mock-darwin-endpoint.com/api",
    },
    SERVER: {
      PORT: 3000,
    },
    LOGGING: {
      LOG_LEVEL: "info",
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

describe("Swagger Endpoint Integration Test", () => {
  let app: Koa;

  beforeEach(() => {
    app = new Koa();
    app.use(globalErrorCatcher);
    app.use(logRoute);
    app.use(cors());
    app.use(swaggerRoutes.routes());
  });

  it("should return swagger.json with 200 OK", async () => {
    const response = await request(app.callback())
      .get("/swagger.json")
      .expect(200);

    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toMatchObject({
      openapi: "3.0.0",
      info: {
        title: "National Rail JSON API",
        version: "1.0.0",
        description:
          "A REST API wrapper for the National Rail Darwin SOAP service",
      },
      servers: expect.arrayContaining([
        expect.objectContaining({
          url: "http://127.0.0.1:3000",
          description: "Development server",
        }),
      ]),
    });

    expect(response.body.paths).toBeDefined();
    expect(response.body.components).toBeDefined();
  });

  it("should return Swagger UI HTML page with 200 OK", async () => {
    const response = await request(app.callback()).get("/").expect(200);

    expect(response.headers["content-type"]).toMatch(/text\/html/);
    expect(response.text).toContain("<!DOCTYPE html>");
    expect(response.text).toContain("National Rail JSON API Documentation");
    expect(response.text).toContain("swagger-ui-dist");
    expect(response.text).toContain("SwaggerUIBundle");
    expect(response.text).toContain("url: '/swagger.json'");
  });
});
