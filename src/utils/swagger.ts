import swaggerJSDoc from "swagger-jsdoc";
import { config } from "./config";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "National Rail JSON API",
    version: "1.0.0",
    description: "A REST API wrapper for the National Rail Darwin SOAP service",
  },
  servers: [
    {
      url: `http://127.0.0.1:${config.SERVER.PORT}`,
      description: "Development server",
    },
  ],
  components: {
    schemas: {
      ServiceBoardOptions: {
        type: "object",
        properties: {
          crs: {
            type: "string",
            description: "Station CRS code (3 characters)",
            example: "LDS",
            pattern: "^[A-Z]{3}$",
          },
          numRows: {
            type: "string",
            description: "Number of results to return (default: 10)",
            example: "10",
          },
          filterCrs: {
            type: "string",
            description: "Filter by destination/origin CRS code",
            example: "BDI",
            pattern: "^[A-Z]{3}$",
          },
          filterType: {
            type: "string",
            enum: ["to", "from"],
            description:
              'Filter type - "to" for destination, "from" for origin',
            example: "to",
          },
          timeOffset: {
            type: "string",
            description: "Time offset in minutes from now",
            example: "60",
          },
          timeWindow: {
            type: "string",
            description: "Time window in minutes",
            example: "120",
          },
        },
        required: ["crs"],
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Error message",
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./src/api/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
