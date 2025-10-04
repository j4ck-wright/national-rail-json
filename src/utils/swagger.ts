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
    parameters: {
      CrsParameter: {
        in: "query",
        name: "crs",
        required: true,
        schema: {
          type: "string",
          pattern: "^[A-Za-z]{3}$",
        },
        description: "Station CRS code",
        example: "LDS",
      },
      NumRowsParameter: {
        in: "query",
        name: "numRows",
        schema: {
          type: "string",
          default: "10",
        },
        description:
          "Number of services to return in the resulting station board. Between 0 and 10 exclusive",
        example: "10",
      },
      FilterCrsParameter: {
        in: "query",
        name: "filterCrs",
        schema: {
          type: "string",
          pattern: "^[A-Za-z]{3}$",
        },
        description: "Filter by station CRS code",
      },
      FilterTypeParameter: {
        in: "query",
        name: "filterType",
        schema: {
          type: "string",
          enum: ["to", "from"],
          default: "to",
        },
        description:
          "The type of filter to apply. Filters services to include only those originating or terminating at the filterCrs location",
      },
      TimeOffsetParameter: {
        in: "query",
        name: "timeOffset",
        schema: {
          type: "string",
        },
        description:
          "An offset in minutes against the current time to provide the station board for. Between -120 and +120 exclusive",
        default: "0",
      },
      TimeWindowParameter: {
        in: "query",
        name: "timeWindow",
        schema: {
          type: "string",
        },
        description:
          "How far into the future in minutes against the current time to provide the station board for. Between -120 and +120 exclusive",
        default: "0",
      },
      ServiceIdParameter: {
        in: "path",
        name: "serviceId",
        required: true,
        schema: {
          type: "string",
        },
        description:
          "The LDBWS service ID of the service to request the details of. The service ID is obtained from a service listed in a StationBoard object returned from any other request.",
        example: "1240973LEEDS___",
      },
    },
    responses: {
      BadRequest: {
        description: "Bad request - missing or invalid parameters",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              error: "Missing 'crs' query parameter",
            },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              error: "Service not found",
            },
          },
        },
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              error: "Internal server error",
            },
          },
        },
      },
      ArrivalBoardResponse: {
        description: "Successful response with arrival board data",
        content: {
          "application/json": {
            schema: {
              type: "object",
              description:
                "Arrival board data converted from Darwin SOAP response",
            },
            example: {
              generatedAt: "2025-10-03T10:01:09.4478883+01:00",
              locationName: "Leeds",
              crs: "LDS",
              platformAvailable: "true",
              trainServices: {
                service: [
                  {
                    sta: "09:52",
                    eta: "09:56",
                    platform: "12A",
                    operator: "Northern",
                    operatorCode: "NT",
                    serviceType: "train",
                    length: "3",
                    serviceID: "1240973LEEDS___",
                    origin: {
                      locationName: "York",
                      crs: "YRK",
                    },
                    destination: {
                      locationName: "Blackpool North",
                      crs: "BPN",
                    },
                  },
                ],
              },
            },
          },
        },
      },
      DepartureBoardResponse: {
        description: "Successful response with departure board data",
        content: {
          "application/json": {
            schema: {
              type: "object",
              description:
                "Departure board data converted from Darwin SOAP response",
            },
            example: {
              generatedAt: "2025-10-03T10:01:09.4478883+01:00",
              locationName: "Leeds",
              crs: "LDS",
              platformAvailable: "true",
              trainServices: {
                service: [
                  {
                    std: "10:05",
                    etd: "On time",
                    platform: "12B",
                    operator: "Northern",
                    operatorCode: "NT",
                    serviceType: "train",
                    length: "4",
                    serviceID: "1240973LEEDS___",
                    origin: {
                      locationName: "Leeds",
                      crs: "LDS",
                    },
                    destination: {
                      locationName: "Bradford Interchange",
                      crs: "BDI",
                    },
                  },
                ],
              },
            },
          },
        },
      },
      DetailedBoardResponse: {
        description:
          "Successful response with detailed board data including service details",
        content: {
          "application/json": {
            schema: {
              type: "object",
              description:
                "Detailed board data converted from Darwin SOAP response",
            },
            example: {
              generatedAt: "2025-10-03T10:32:46.6698714+01:00",
              locationName: "Leeds",
              crs: "LDS",
              platformAvailable: "true",
              trainServices: {
                service: [
                  {
                    std: "10:31",
                    etd: "On time",
                    platform: "4",
                    operator: "Northern",
                    operatorCode: "NT",
                    serviceType: "train",
                    length: "3",
                    serviceID: "1246163LEEDS___",
                    subsequentCallingPoints: {
                      callingPointList: {
                        callingPoint: [
                          {
                            locationName: "New Pudsey",
                            crs: "NPD",
                            st: "10:39",
                            et: "On time",
                            length: "3",
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      CombinedBoardResponse: {
        description:
          "Successful response with combined arrival and departure board data",
        content: {
          "application/json": {
            schema: {
              type: "object",
              description:
                "Combined arrival and departure board data converted from Darwin SOAP response",
            },
            example: {
              generatedAt: "2025-10-04T10:01:09.4478883+01:00",
              locationName: "Leeds",
              crs: "LDS",
              platformAvailable: "true",
              trainServices: {
                service: [
                  {
                    std: "10:05",
                    etd: "On time",
                    platform: "12B",
                    operator: "Northern",
                    serviceType: "train",
                    length: "4",
                    serviceID: "1240973LEEDS___",
                  },
                  {
                    sta: "10:08",
                    eta: "10:12",
                    platform: "9A",
                    operator: "Northern",
                    serviceType: "train",
                    length: "3",
                    serviceID: "1231972LEEDS___",
                  },
                ],
              },
            },
          },
        },
      },
      DetailedCombinedBoardResponse: {
        description:
          "Successful response with detailed combined arrival and departure board data including service details",
        content: {
          "application/json": {
            schema: {
              type: "object",
              description:
                "Detailed combined arrival and departure board data converted from Darwin SOAP response",
            },
            example: {
              generatedAt: "2025-10-04T10:32:46.6698714+01:00",
              locationName: "Leeds",
              crs: "LDS",
              platformAvailable: "true",
              trainServices: {
                service: [
                  {
                    std: "10:31",
                    etd: "On time",
                    platform: "4",
                    operator: "Northern",
                    serviceType: "train",
                    length: "3",
                    serviceID: "1246163LEEDS___",
                    subsequentCallingPoints: {
                      callingPointList: {
                        callingPoint: [
                          {
                            locationName: "Cross Gates",
                            crs: "CRG",
                            st: "10:39",
                            et: "On time",
                            length: "3",
                          },
                        ],
                      },
                    },
                  },
                  {
                    sta: "10:35",
                    eta: "On time",
                    platform: "12A",
                    operator: "Northern",
                    serviceType: "train",
                    length: "4",
                    serviceID: "1240974LEEDS___",
                    previousCallingPoints: {
                      callingPointList: {
                        callingPoint: [
                          {
                            locationName: "York",
                            crs: "YRK",
                            st: "10:05",
                            et: "On time",
                            length: "4",
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      ServiceDetailsResponse: {
        description: "Successful response with service details data",
        content: {
          "application/json": {
            schema: {
              type: "object",
              description:
                "Service details data converted from Darwin SOAP response",
            },
            example: {
              generatedAt: "2025-10-04T10:01:09.4478883+01:00",
              serviceType: "train",
              locationName: "Leeds",
              crs: "LDS",
              operator: "Northern",
              operatorCode: "NT",
              platform: "12A",
              sta: "10:05",
              std: "10:05",
              eta: "On time",
              etd: "On time",
              length: "4",
              previousCallingPoints: {
                callingPointList: {
                  callingPoint: [
                    {
                      locationName: "York",
                      crs: "YRK",
                      st: "09:30",
                      et: "On time",
                    },
                  ],
                },
              },
              subsequentCallingPoints: {
                callingPointList: {
                  callingPoint: [
                    {
                      locationName: "Bradford Interchange",
                      crs: "BDI",
                      st: "10:25",
                      et: "On time",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
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
            description:
              "The CRS code of either an origin or destination location to filter in",
            example: "BDI",
            pattern: "^[A-Z]{3}$",
          },
          filterType: {
            type: "string",
            enum: ["to", "from"],
            description:
              "The type of filter to apply. Filters services to include only those originating or terminating at the filterCrs location",
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
      ServiceIdOptions: {
        type: "object",
        properties: {
          serviceId: {
            type: "string",
            description: "Service ID for the train service",
            example: "1240973LEEDS___",
          },
        },
        required: ["serviceId"],
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./src/api/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
