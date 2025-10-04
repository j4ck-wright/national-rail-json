import Router from "@koa/router";
import {
  getArrivalDepartures,
  getArrivals,
  getDepartures,
  getDetailedArrivalDeparture,
  getDetailedArrivals,
  getDetailedDepartures,
} from "@/api/controllers/darwin-base-class-controller";

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
 *       - in: query
 *         name: crs
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z]{3}$'
 *         description: Station CRS code (3 characters, e.g., LDS, BDI, YRK)
 *         example: LDS
 *       - in: query
 *         name: numRows
 *         schema:
 *           type: string
 *         description: Number of results to return (default 10)
 *         example: "10"
 *       - in: query
 *         name: filterCrs
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z]{3}$'
 *         description: Filter by origin station CRS code
 *         example: BDI
 *       - in: query
 *         name: filterType
 *         schema:
 *           type: string
 *           enum: [to, from]
 *         description: Filter type - "from" for origin filtering
 *         example: from
 *       - in: query
 *         name: timeOffset
 *         schema:
 *           type: string
 *         description: Time offset in minutes from now
 *         example: "60"
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: string
 *         description: Time window in minutes
 *         example: "120"
 *     responses:
 *       200:
 *         description: Successful response with arrival board data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Arrival board data converted from Darwin SOAP response
 *             example:
 *               generatedAt: "2025-10-03T10:01:09.4478883+01:00"
 *               locationName: "Leeds"
 *               crs: "LDS"
 *               platformAvailable: "true"
 *               trainServices:
 *                 service:
 *                   - sta: "09:52"
 *                     eta: "09:56"
 *                     platform: "12A"
 *                     operator: "Northern"
 *                     operatorCode: "NT"
 *                     serviceType: "train"
 *                     length: "3"
 *                     serviceID: "1240973LEEDS___"
 *                     origin:
 *                       locationName: "York"
 *                       crs: "YRK"
 *                     destination:
 *                       locationName: "Blackpool North"
 *                       crs: "BPN"
 *                   - sta: "09:53"
 *                     eta: "On time"
 *                     platform: "9D"
 *                     operator: "Northern"
 *                     operatorCode: "NT"
 *                     serviceType: "train"
 *                     length: "4"
 *                     delayReason: "This service has been delayed by slippery rails earlier today"
 *                     serviceID: "1231972LEEDS___"
 *                     origin:
 *                       locationName: "Halifax"
 *                       crs: "HFX"
 *                     destination:
 *                       locationName: "Hull"
 *                       crs: "HUL"
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing 'crs' query parameter"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal server error"
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
 *       - in: query
 *         name: crs
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z]{3}$'
 *         description: Station CRS code (3 characters, e.g., LDS, BDI, YRK)
 *         example: BDI
 *       - in: query
 *         name: numRows
 *         schema:
 *           type: string
 *         description: Number of results to return (default 10)
 *         example: "10"
 *       - in: query
 *         name: filterCrs
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z]{3}$'
 *         description: Filter by origin station CRS code
 *         example: LDS
 *       - in: query
 *         name: filterType
 *         schema:
 *           type: string
 *           enum: [to, from]
 *         description: Filter type - "from" for origin filtering
 *         example: from
 *       - in: query
 *         name: timeOffset
 *         schema:
 *           type: string
 *         description: Time offset in minutes from now
 *         example: "60"
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: string
 *         description: Time window in minutes
 *         example: "120"
 *     responses:
 *       200:
 *         description: Successful response with detailed arrival board data including service details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Detailed arrival board data converted from Darwin SOAP response
 *             example:
 *               generatedAt: "2025-10-03T10:32:46.6698714+01:00"
 *               locationName: "Bradford Interchange"
 *               crs: "BDI"
 *               platformAvailable: "true"
 *               trainServices:
 *                 service:
 *                   - std: "10:31"
 *                     etd: "On time"
 *                     platform: "4"
 *                     operator: "Northern"
 *                     operatorCode: "NT"
 *                     serviceType: "train"
 *                     length: "3"
 *                     serviceID: "1246163BRADIN__"
 *                     origin:
 *                       locationName: "Halifax"
 *                       crs: "HFX"
 *                     destination:
 *                       locationName: "Hull"
 *                       crs: "HUL"
 *                     subsequentCallingPoints:
 *                       callingPointList:
 *                         callingPoint:
 *                           - locationName: "New Pudsey"
 *                             crs: "NPD"
 *                             st: "10:39"
 *                             et: "On time"
 *                             length: "3"
 *                           - locationName: "Bramley (West Yorkshire)"
 *                             crs: "BLE"
 *                             st: "10:43"
 *                             et: "On time"
 *                             length: "3"
 *                           - locationName: "Leeds"
 *                             crs: "LDS"
 *                             st: "10:52"
 *                             et: "On time"
 *                             length: "3"
 *                           - locationName: "Cross Gates"
 *                             crs: "CRG"
 *                             st: "11:01"
 *                             et: "On time"
 *                             length: "3"
 *                           - locationName: "Garforth"
 *                             crs: "GRF"
 *                             st: "11:05"
 *                             et: "On time"
 *                             length: "3"
 *                           - locationName: "East Garforth"
 *                             crs: "EGF"
 *                             st: "11:08"
 *                             et: "On time"
 *                             length: "3"
 *                           - locationName: "Micklefield"
 *                             crs: "MIK"
 *                             st: "11:11"
 *                             et: "On time"
 *                             length: "3"
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing 'crs' query parameter"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal server error"
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
 *       - in: query
 *         name: crs
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z]{3}$'
 *         description: Station CRS code (3 characters, e.g., LDS, BDI, YRK)
 *         example: LDS
 *       - in: query
 *         name: numRows
 *         schema:
 *           type: string
 *         description: Number of results to return (default 10)
 *         example: "10"
 *       - in: query
 *         name: filterCrs
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z]{3}$'
 *         description: Filter by destination station CRS code
 *         example: BDI
 *       - in: query
 *         name: filterType
 *         schema:
 *           type: string
 *           enum: [to, from]
 *         description: Filter type - "to" for destination filtering
 *         example: to
 *       - in: query
 *         name: timeOffset
 *         schema:
 *           type: string
 *         description: Time offset in minutes from now
 *         example: "60"
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: string
 *         description: Time window in minutes
 *         example: "120"
 *     responses:
 *       200:
 *         description: Successful response with departure board data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Departure board data converted from Darwin SOAP response
 *             example:
 *               generatedAt: "2025-10-03T10:01:09.4478883+01:00"
 *               locationName: "Leeds"
 *               crs: "LDS"
 *               platformAvailable: "true"
 *               trainServices:
 *                 service:
 *                   - std: "10:05"
 *                     etd: "On time"
 *                     platform: "12B"
 *                     operator: "Northern"
 *                     operatorCode: "NT"
 *                     serviceType: "train"
 *                     length: "4"
 *                     serviceID: "1240973LEEDS___"
 *                     origin:
 *                       locationName: "Leeds"
 *                       crs: "LDS"
 *                     destination:
 *                       locationName: "Bradford Interchange"
 *                       crs: "BDI"
 *                   - std: "10:08"
 *                     etd: "10:12"
 *                     platform: "9A"
 *                     operator: "Northern"
 *                     operatorCode: "NT"
 *                     serviceType: "train"
 *                     length: "3"
 *                     delayReason: "This service has been delayed by a signal failure"
 *                     serviceID: "1231972LEEDS___"
 *                     origin:
 *                       locationName: "Leeds"
 *                       crs: "LDS"
 *                     destination:
 *                       locationName: "York"
 *                       crs: "YRK"
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing 'crs' query parameter"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal server error"
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
 *       - in: query
 *         name: crs
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z]{3}$'
 *         description: Station CRS code (3 characters, e.g., LDS, BDI, YRK)
 *         example: LDS
 *       - in: query
 *         name: numRows
 *         schema:
 *           type: string
 *         description: Number of results to return (default 10)
 *         example: "10"
 *       - in: query
 *         name: filterCrs
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z]{3}$'
 *         description: Filter by destination station CRS code
 *         example: BDI
 *       - in: query
 *         name: filterType
 *         schema:
 *           type: string
 *           enum: [to, from]
 *         description: Filter type - "to" for destination filtering
 *         example: to
 *       - in: query
 *         name: timeOffset
 *         schema:
 *           type: string
 *         description: Time offset in minutes from now
 *         example: "60"
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: string
 *         description: Time window in minutes
 *         example: "120"
 *     responses:
 *       200:
 *         description: Successful response with detailed departure board data including service details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Detailed departure board data converted from Darwin SOAP response
 *             example:
 *               generatedAt: "2025-10-03T10:32:46.6698714+01:00"
 *               locationName: "Leeds"
 *               crs: "LDS"
 *               platformAvailable: "true"
 *               trainServices:
 *                 service:
 *                   - std: "10:31"
 *                     etd: "On time"
 *                     platform: "4"
 *                     operator: "Northern"
 *                     operatorCode: "NT"
 *                     serviceType: "train"
 *                     length: "3"
 *                     serviceID: "1246163LEEDS___"
 *                     origin:
 *                       locationName: "Leeds"
 *                       crs: "LDS"
 *                     destination:
 *                       locationName: "Bradford Interchange"
 *                       crs: "BDI"
 *                     subsequentCallingPoints:
 *                       callingPointList:
 *                         callingPoint:
 *                           - locationName: "New Pudsey"
 *                             crs: "NPD"
 *                             st: "10:39"
 *                             et: "On time"
 *                             length: "3"
 *                           - locationName: "Bramley (West Yorkshire)"
 *                             crs: "BLE"
 *                             st: "10:43"
 *                             et: "On time"
 *                             length: "3"
 *                           - locationName: "Bradford Interchange"
 *                             crs: "BDI"
 *                             st: "10:52"
 *                             et: "On time"
 *                             length: "3"
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing 'crs' query parameter"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal server error"
 */
router.get("/departures/detailed", getDetailedDepartures);

router.get("/arrivals-and-departures", getArrivalDepartures);

router.get("/arrivals-and-departures/detailed", getDetailedArrivalDeparture);

export default router;
