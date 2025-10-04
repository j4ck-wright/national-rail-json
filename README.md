<div align="center">
   <img width="400px" alt="Powered by National Rail Enquiries" src="readme-assets//NRE_Powered_logo.png">
</div>

# 🚂 National Rail JSON API

A RESTful JSON API acting as a proxy to National Rail's LDBWS (Live Departure Board Web Service) written using NodeJS & TypeScript.

The underlying API (Darwin) uses a [SOAP](https://en.wikipedia.org/wiki/SOAP) protocol and can be perticulaly tricky when using on a frontend application. Darwin provides the Industry’s official designated real-time customer timetable. All of the franchised GB Train Operating Companies supply Darwin with information about when they expect their trains to arrive and depart any given station.

This app is built specifically to use [OpenLDBWS/ldb11](https://lite.realtime.nationalrail.co.uk/OpenLDBWS/ldb11.asmx)

<div align="center">
   <img width="800px" alt="A response from the National Rail JSON Api, showing a list of departing trains from Leeds, including a poor weather alert" src="readme-assets/departure-example.png">
   <p> Example of departing trains from Leeds </p>
</div>

<div align="center">
   <img width="800px" alt="A response from the National Rail JSON Api, showing a specific train service, including its previous and next stops" src="readme-assets/service-example.png">
   <p> Example of train service and next/previous stops </p>
</div>

For consumers using this, I would recommend reading [National Rail Enquiries' Developer Guidelines](https://assets.nationalrail.co.uk/e8xgegruud3g/7yPy7gHJ7j3QZalp2zKZKJ/e32e5b871465c3a5f920e86cc07900d6/Developer_Guidelines_v_05-01.pdf) to see if this fits your use case.

## What is LDBWS?

From [their documentation](https://lite.realtime.nationalrail.co.uk/OpenLDBWS/):
> LDBWS provides a request-response web service to access real time train information from Darwin. This is the same information that powers the Live Departure Boards, provided in XML format.

## API Endpoints
Swagger documentation is available at the root of the app. The currently supported routes are:

```bash
GET /arrivals/:crs
GET /arrivals/:crs/detailed
GET /departures/:crs
GET /departures/:crs/detailed
GET /departures/:crs/next
GET /arrivals-and-departures/:crs
GET /arrivals-and-departures/:crs/detailed
GET /service/:serviceId
```

## Example Usage

```bash
# Get departures from Leeds showing the next 10 services
curl "http://localhost:3000/departures/LDS?numRows=10"

# Get arrivals at Bradford Interchange from Leeds
curl "http://localhost:3000/arrivals/BDI?filterCrs=LDS&filterType=from"

# Get service details about an existing train (obtained via a ServiceBoard)
curl "http://localhost:3000/service/1266343LEEDS___"

# Get next departing train from Leeds to Doncaster or London
curl "http://localhost:3000/departures/LDS/next?destinationCrs=DON&destinationCrs=KGX
```

## Getting Started

1. **Prerequisites**
   - Node v22.20.0
   - [pnpm](https://pnpm.io/)
   - A Darwin API token is needed from [National Rail Enquiries](http://www.nationalrail.co.uk/100296.aspx)

2. **Setup**
   ```bash
   pnpm install

   # Add your environemnt variables from .env.example
   cp .env.example .env
   
   # Start development server
   pnpm dev
   ```

## Built With
- [Koa](https://koajs.com/) for API routing
- [Wilson](https://www.npmjs.com/package/winston) for logging
- [Biome](https://biomejs.dev/) for linting
- [Vitest](https://vitest.dev/) as the testing framework of choice
- [Lefthook](https://lefthook.dev/) from pre-commit checks
