import { DarwinError } from "@/errors/DarwinError";

describe("DarwinError", () => {
  describe("constructor", () => {
    it("should create error with message only", () => {
      const error = new DarwinError("Test error message");

      expect(error.message).toBe("Test error message");
      expect(error.name).toBe("DarwinError");
      expect(error.statusCode).toBeNull();
      expect(error.statusText).toBeNull();
      expect(error.body).toBeNull();
    });

    it("should create error with all parameters", () => {
      const error = new DarwinError(
        "API failure",
        500,
        "Internal Server Error",
        "Something went wrong",
      );

      expect(error.message).toBe("API failure");
      expect(error.name).toBe("DarwinError");
      expect(error.statusCode).toBe(500);
      expect(error.statusText).toBe("Internal Server Error");
      expect(error.body).toBe("Something went wrong");
    });

    it("should handle partial parameters", () => {
      const error = new DarwinError("Test error", 401, "Unauthorized");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(401);
      expect(error.statusText).toBe("Unauthorized");
      expect(error.body).toBeNull();
    });

    it("should handle null values explicitly", () => {
      const error = new DarwinError("Test", null, null, null);

      expect(error.statusCode).toBeNull();
      expect(error.statusText).toBeNull();
      expect(error.body).toBeNull();
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const error = new DarwinError("Test error");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DarwinError);
    });

    it("should have correct prototype chain", () => {
      const error = new DarwinError("Test error");

      expect(Object.getPrototypeOf(error)).toBe(DarwinError.prototype);
      expect(error.constructor).toBe(DarwinError);
    });

    it("should be throwable and catchable", () => {
      expect(() => {
        throw new DarwinError("Test error", 500);
      }).toThrow(DarwinError);

      try {
        throw new DarwinError("Test error", 400, "Bad Request");
      } catch (error) {
        expect(error).toBeInstanceOf(DarwinError);
        expect((error as DarwinError).statusCode).toBe(400);
        expect((error as DarwinError).statusText).toBe("Bad Request");
      }
    });
  });

  describe("error properties", () => {
    it("should maintain stack trace", () => {
      const error = new DarwinError("Test error");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("DarwinError");
      expect(error.stack).toContain("Test error");
    });

    it("should handle XML error bodies", () => {
      const xmlBody = `<?xml version="1.0"?>
        <soap:Fault>
          <faultcode>soap:Server</faultcode>
          <faultstring>Invalid station code</faultstring>
        </soap:Fault>`;

      const error = new DarwinError(
        "SOAP Fault",
        500,
        "Internal Server Error",
        xmlBody,
      );

      expect(error.body).toBe(xmlBody);
      expect(error.body).toContain("Invalid station code");
    });
  });

  describe("toString behavior", () => {
    it("should provide meaningful string representation", () => {
      const error = new DarwinError(
        "API failure",
        500,
        "Internal Server Error",
      );

      const errorString = error.toString();
      expect(errorString).toContain("DarwinError");
      expect(errorString).toContain("API failure");
    });
  });
});
