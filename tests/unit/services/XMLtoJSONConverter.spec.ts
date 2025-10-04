import { XMLtoJSONConverter } from "@/services/national-rail/XMLtoJSONConverter";

describe("XMLtoJSONConverter", () => {
  describe("GetNextDeparturesResponse", () => {
    it("should flatten single destination departures", async () => {
      const mockXmlResponse = `
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetNextDeparturesResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <DeparturesBoard>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <departures>
                  <destination crs="YRK">
                    <service>
                      <sta>19:38</sta>
                      <eta>On time</eta>
                      <platform>16</platform>
                      <operator>TransPennine Express</operator>
                      <serviceID>1268173LEEDS___</serviceID>
                      <origin>
                        <location>
                          <locationName>Liverpool Lime Street</locationName>
                          <crs>LIV</crs>
                        </location>
                      </origin>
                      <destination>
                        <location>
                          <locationName>Redcar Central</locationName>
                          <crs>RCC</crs>
                        </location>
                      </destination>
                    </service>
                  </destination>
                </departures>
              </DeparturesBoard>
            </GetNextDeparturesResponse>
          </soap:Body>
        </soap:Envelope>
      `;

      const converter = new XMLtoJSONConverter(
        mockXmlResponse,
        "GetNextDeparturesResponse",
      );
      const result = await converter.convert();

      expect(result).toMatchObject({
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
        departures: [
          {
            crs: "YRK",
            service: {
              sta: "19:38",
              eta: "On time",
              platform: "16",
              operator: "TransPennine Express",
              serviceID: "1268173LEEDS___",
              origin: {
                locationName: "Liverpool Lime Street",
                crs: "LIV",
              },
              destination: {
                locationName: "Redcar Central",
                crs: "RCC",
              },
            },
          },
        ],
      });
    });

    it("should flatten multiple destination departures", async () => {
      const mockXmlResponse = `
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetNextDeparturesResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <DeparturesBoard>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <departures>
                  <destination crs="YRK">
                    <service>
                      <sta>19:38</sta>
                      <eta>On time</eta>
                      <platform>16</platform>
                      <operator>TransPennine Express</operator>
                      <serviceID>1268173LEEDS___</serviceID>
                    </service>
                  </destination>
                  <destination crs="DON">
                    <service>
                      <sta>19:37</sta>
                      <eta>19:43</eta>
                      <platform>8</platform>
                      <operator>London North Eastern Railway</operator>
                      <serviceID>1259251LEEDS___</serviceID>
                    </service>
                  </destination>
                </departures>
              </DeparturesBoard>
            </GetNextDeparturesResponse>
          </soap:Body>
        </soap:Envelope>
      `;

      const converter = new XMLtoJSONConverter(
        mockXmlResponse,
        "GetNextDeparturesResponse",
      );
      const result = await converter.convert();

      expect(result).toHaveProperty("departures");
      if (result && "departures" in result && result.departures) {
        expect(result.departures).toHaveLength(2);
        expect(result.departures[0]).toMatchObject({
          crs: "YRK",
          service: {
            sta: "19:38",
            eta: "On time",
            platform: "16",
            operator: "TransPennine Express",
            serviceID: "1268173LEEDS___",
          },
        });
        expect(result.departures[1]).toMatchObject({
          crs: "DON",
          service: {
            sta: "19:37",
            eta: "19:43",
            platform: "8",
            operator: "London North Eastern Railway",
            serviceID: "1259251LEEDS___",
          },
        });
      }
    });

    it("should handle service as array and flatten to single service", async () => {
      const mockXmlResponse = `
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetNextDeparturesResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <DeparturesBoard>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
                <departures>
                  <destination crs="YRK">
                    <service>
                      <sta>19:38</sta>
                      <eta>On time</eta>
                      <platform>16</platform>
                      <operator>TransPennine Express</operator>
                      <serviceID>1268173LEEDS___</serviceID>
                    </service>
                    <service>
                      <sta>20:38</sta>
                      <eta>On time</eta>
                      <platform>17</platform>
                      <operator>Northern</operator>
                      <serviceID>1268174LEEDS___</serviceID>
                    </service>
                  </destination>
                </departures>
              </DeparturesBoard>
            </GetNextDeparturesResponse>
          </soap:Body>
        </soap:Envelope>
      `;

      const converter = new XMLtoJSONConverter(
        mockXmlResponse,
        "GetNextDeparturesResponse",
      );
      const result = await converter.convert();

      expect(result).toHaveProperty("departures");
      if (result && "departures" in result && result.departures) {
        expect(result.departures).toHaveLength(1);
        expect(result.departures[0]).toMatchObject({
          crs: "YRK",
          service: {
            sta: "19:38",
            eta: "On time",
            platform: "16",
            operator: "TransPennine Express",
            serviceID: "1268173LEEDS___",
          },
        });
      }
    });

    it("should return empty departures array when no destinations", async () => {
      const mockXmlResponse = `
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetNextDeparturesResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <DeparturesBoard>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <crs>LDS</crs>
              </DeparturesBoard>
            </GetNextDeparturesResponse>
          </soap:Body>
        </soap:Envelope>
      `;

      const converter = new XMLtoJSONConverter(
        mockXmlResponse,
        "GetNextDeparturesResponse",
      );
      const result = await converter.convert();

      expect(result).toMatchObject({
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        crs: "LDS",
      });
      expect(result).not.toHaveProperty("departures");
    });
  });

  describe("Standard StationBoard operations", () => {
    it("should handle GetDepartureBoardResponse normally", async () => {
      const mockXmlResponse = `
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetDepartureBoardResponse xmlns="http://thalesgroup.com/RTTI/2013-11-28/Token/types">
              <GetStationBoardResult>
                <generatedAt>2025-10-04T19:52:23.6370346+01:00</generatedAt>
                <locationName>Leeds</locationName>
                <trainServices>
                  <service>
                    <sta>19:38</sta>
                    <eta>On time</eta>
                    <platform>16</platform>
                  </service>
                </trainServices>
              </GetStationBoardResult>
            </GetDepartureBoardResponse>
          </soap:Body>
        </soap:Envelope>
      `;

      const converter = new XMLtoJSONConverter(
        mockXmlResponse,
        "GetDepartureBoardResponse",
      );
      const result = await converter.convert();

      expect(result).toMatchObject({
        generatedAt: "2025-10-04T19:52:23.6370346+01:00",
        locationName: "Leeds",
        trainServices: {
          service: [
            {
              sta: "19:38",
              eta: "On time",
              platform: "16",
            },
          ],
        },
      });
      expect(result).not.toHaveProperty("departures");
    });
  });
});
