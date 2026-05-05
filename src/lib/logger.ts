import pino from "pino";
import { getConfig } from "./config";

const config = (() => {
  try {
    return getConfig();
  } catch {
    return { LOG_LEVEL: "info", NODE_ENV: "development" } as const;
  }
})();

const isDev = config.NODE_ENV === "development";

export const logger = pino({
  level: config.LOG_LEVEL,
  base: { service: "turkiye-tourism" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.secret",
      "*.token",
      "*.apiKey",
      "*.email",
    ],
    censor: "[REDACTED]",
  },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
        },
      }
    : {}),
});

export type Logger = typeof logger;
