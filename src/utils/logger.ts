import winston from "winston";
import { config } from "@/utils/config";

const { combine, timestamp, json, errors } = winston.format;

export const logger = winston.createLogger({
  level: config.LOGGING.LOG_LEVEL ?? "info",
  defaultMeta: {
    service: "nationl-rail-json",
  },
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [new winston.transports.Console()],
});
