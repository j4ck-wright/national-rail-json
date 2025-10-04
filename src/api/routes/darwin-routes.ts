import Router from "@koa/router";
import {
  getArrivalDepartures,
  getArrivals,
  getDepartures,
  getDetailedArrivalDeparture,
  getDetailedArrivals,
  getDetailedDepartures,
} from "@/api/controllers/darwin-base-class-controller";
import { getServiceDetails } from "@/api/controllers/darwin-base-service-controller";

const router = new Router();

/**
 * @swagger
 * /arrivals:
 *   get:
 *     summary: Get arrival board for a station
 *     description: Retrieve the arrival board for a specific station from National Rail
 *     tags:
 *       - Arrivals
 *     parameters:
 *       - $ref: '#/components/parameters/CrsParameter'
 *       - $ref: '#/components/parameters/NumRowsParameter'
 *       - $ref: '#/components/parameters/FilterCrsParameter'
 *       - $ref: '#/components/parameters/FilterTypeParameter'
 *       - $ref: '#/components/parameters/TimeOffsetParameter'
 *       - $ref: '#/components/parameters/TimeWindowParameter'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ArrivalBoardResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/arrivals", getArrivals);

/**
 * @swagger
 * /arrivals/detailed:
 *   get:
 *     summary: Get detailed arrival board for a station
 *     description: Retrieve the detailed arrival board with service information for a specific station from National Rail
 *     tags:
 *       - Arrivals
 *     parameters:
 *       - $ref: '#/components/parameters/CrsParameter'
 *       - $ref: '#/components/parameters/NumRowsParameter'
 *       - $ref: '#/components/parameters/FilterCrsParameter'
 *       - $ref: '#/components/parameters/FilterTypeParameter'
 *       - $ref: '#/components/parameters/TimeOffsetParameter'
 *       - $ref: '#/components/parameters/TimeWindowParameter'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/DetailedBoardResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/arrivals/detailed", getDetailedArrivals);

/**
 * @swagger
 * /departures:
 *   get:
 *     summary: Get departure board for a station
 *     description: Retrieve the departure board for a specific station from National Rail
 *     tags:
 *       - Departures
 *     parameters:
 *       - $ref: '#/components/parameters/CrsParameter'
 *       - $ref: '#/components/parameters/NumRowsParameter'
 *       - $ref: '#/components/parameters/FilterCrsParameter'
 *       - $ref: '#/components/parameters/FilterTypeParameter'
 *       - $ref: '#/components/parameters/TimeOffsetParameter'
 *       - $ref: '#/components/parameters/TimeWindowParameter'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/DepartureBoardResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/departures", getDepartures);

/**
 * @swagger
 * /departures/detailed:
 *   get:
 *     summary: Get detailed departure board for a station
 *     description: Retrieve the detailed departure board with service information for a specific station from National Rail
 *     tags:
 *       - Departures
 *     parameters:
 *       - $ref: '#/components/parameters/CrsParameter'
 *       - $ref: '#/components/parameters/NumRowsParameter'
 *       - $ref: '#/components/parameters/FilterCrsParameter'
 *       - $ref: '#/components/parameters/FilterTypeParameter'
 *       - $ref: '#/components/parameters/TimeOffsetParameter'
 *       - $ref: '#/components/parameters/TimeWindowParameter'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/DetailedBoardResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/departures/detailed", getDetailedDepartures);

/**
 * @swagger
 * /arrivals-and-departures:
 *   get:
 *     summary: Get combined arrival and departure board for a station
 *     description: Retrieve both arrivals and departures board for a specific station from National Rail
 *     tags:
 *       - Combined Boards
 *     parameters:
 *       - $ref: '#/components/parameters/CrsParameter'
 *       - $ref: '#/components/parameters/NumRowsParameter'
 *       - $ref: '#/components/parameters/FilterCrsParameter'
 *       - $ref: '#/components/parameters/FilterTypeParameter'
 *       - $ref: '#/components/parameters/TimeOffsetParameter'
 *       - $ref: '#/components/parameters/TimeWindowParameter'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CombinedBoardResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/arrivals-and-departures", getArrivalDepartures);

/**
 * @swagger
 * /arrivals-and-departures/detailed:
 *   get:
 *     summary: Get detailed combined arrival and departure board for a station
 *     description: Retrieve detailed combined arrivals and departures board with service information for a specific station from National Rail
 *     tags:
 *       - Combined Boards
 *     parameters:
 *       - $ref: '#/components/parameters/CrsParameter'
 *       - $ref: '#/components/parameters/NumRowsParameter'
 *       - $ref: '#/components/parameters/FilterCrsParameter'
 *       - $ref: '#/components/parameters/FilterTypeParameter'
 *       - $ref: '#/components/parameters/TimeOffsetParameter'
 *       - $ref: '#/components/parameters/TimeWindowParameter'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/DetailedCombinedBoardResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/arrivals-and-departures/detailed", getDetailedArrivalDeparture);

/**
 * @swagger
 * /service/{serviceId}:
 *   get:
 *     summary: Get service details by service ID
 *     description: Retrieve detailed information about a specific train service using its service ID
 *     tags:
 *       - Services
 *     parameters:
 *       - $ref: '#/components/parameters/ServiceIdParameter'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ServiceDetailsResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/service/:serviceId", getServiceDetails);

export default router;
