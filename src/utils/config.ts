import { getEnvWithDefault } from "./getEnv";

export const config = {
  SERVER: {
    PORT: getEnvWithDefault("PORT", "3000"),
    AUTH_HEADER_NAME: getEnvWithDefault("DARWIN_TOKEN_HEADER", "x-darwin-api"),
  },
  DARWIN: {
    ENDPOINT: getEnvWithDefault(
      "DARWIN_ENDPOINT",
      "https://lite.realtime.nationalrail.co.uk/OpenLDBWS/ldb11.asmx",
    ),
    TOKEN: getEnvWithDefault("DARWIN_TOKEN", ""),
  },
  LOGGING: {
    LOG_LEVEL: getEnvWithDefault("LOG_LEVEL", "info"),
  },
};
