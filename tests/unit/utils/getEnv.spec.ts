import { getEnvWithDefault } from "@/utils/getEnv";

const BASE_ENV = process.env;

describe("getEnv", () => {
  afterEach(() => {
    process.env = { ...BASE_ENV };
  });

  it("should return env if it exists in process", () => {
    process.env["TEST_ENV"] = "test_value";
    expect(getEnvWithDefault("TEST_ENV", "default_value")).toBe("test_value");
  });

  it("should return default if env does not exist in process", () => {
    expect(getEnvWithDefault("NON_EXISTENT_ENV", "default_value")).toBe(
      "default_value",
    );
  });
});
