import type { Context } from "koa";
import { vi } from "vitest";
import { healthController } from "@/api/controllers/health-controller";

describe("healthController", () => {
  let ctx: Partial<Context>;
  let mockUptime: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    ctx = {};

    mockUptime = vi.spyOn(process, "uptime").mockReturnValue(123.4);
  });

  afterEach(() => {
    mockUptime.mockRestore();
  });

  it("should set status to 200", () => {
    healthController(ctx as Context);

    expect(ctx.status).toBe(200);
  });

  it("should set body with status ok and uptime", () => {
    healthController(ctx as Context);

    expect(ctx.body).toEqual({
      status: "ok",
      uptime: 123.4,
    });
  });

  it("should use actual process uptime", () => {
    healthController(ctx as Context);

    expect(process.uptime).toHaveBeenCalledTimes(1);
    expect(ctx.body).toHaveProperty("uptime", 123.4);
  });
});
