import { getEnvWithDefault } from "@/utils/getEnv";

export const config = {
  SERVER: {
    PORT: getEnvWithDefault("PORT", "3000"),
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
