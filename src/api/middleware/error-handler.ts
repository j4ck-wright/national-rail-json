import type { Context, Next } from "koa";
import { parseStringPromise } from "xml2js";
import { DarwinError } from "@/errors/DarwinError";
import { logger } from "@/utils/logger";

const parseSoapFault = async (
  xmlString: string,
): Promise<{ message: string; code?: string } | null> => {
  try {
    const result = await parseStringPromise(xmlString, {
      explicitArray: false,
      ignoreAttrs: true,
    });

    const fault = result?.["soap:Envelope"]?.["soap:Body"]?.["soap:Fault"];
    if (!fault) return null;

    const message = fault["soap:Reason"]?.["soap:Text"] || "Unknown SOAP fault";

    return { message };
  } catch (_error) {
    return null;
  }
};

export const globalErrorCatcher = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof DarwinError) {
      if (
        err.body &&
        typeof err.body === "string" &&
        err.body.includes("soap:Fault")
      ) {
        const soapFault = await parseSoapFault(err.body);

        if (soapFault) {
          if (soapFault.message === "Invalid Service ID") {
            ctx.status = 404;
            ctx.body = {
              error: "Service not found",
              message: soapFault.message,
              code: soapFault.code,
            };
          } else {
            ctx.status = err.statusCode ?? 400;
            ctx.body = {
              error: soapFault.message,
              code: soapFault.code,
            };
          }
        } else {
          ctx.status = err.statusCode ?? 500;
          ctx.body = { error: err.body };
        }
      } else {
        ctx.status = err.statusCode ?? 500;
        ctx.body = { error: err.body || err.message };
      }
    } else if (err instanceof Error) {
      ctx.status = 500;
      ctx.body = { error: err.message ?? "Internal Server Error" };
    } else {
      ctx.status = 500;
      ctx.body = { error: "Internal Server Error" };
    }

    logger.error(`Unhandled error: ${err}`);
  }
};
