import { GET, POST } from '@/app/api/twilio-video-token/route' // Adjust the import according to your project structure
import * as Twilio from 'twilio'

jest.mock('twilio', () => {
    return {
      jwt: {
        // Mock AccessToken constructor
        AccessToken: jest.fn().mockImplementation(() => {
          return {
            addGrant: jest.fn(), // Mock addGrant method
            toJwt: jest.fn().mockReturnValue('dummy_jwt'), // Mock toJwt method
            VideoGrant: jest.fn().mockImplementation(() => {
              return { room: 'dummy_room' }; // Mock VideoGrant as a nested class inside AccessToken
            }), 
          };
        }),
      },
    };
  });


// For constructing Request objects in tests:

describe("Twilio API Endpoint", () => {
  describe("GET", () => {
    it("should return a 405 error and error message", async () => {
      const req = new Request("http://localhost/api/twilio", { method: "GET" })
      const res = await GET(req)

      expect(res.status).toBe(405)
      const body = await res.json()
      expect(body.error).toBe("GET method not allowed")
    })
  })

  describe("POST", () => {

    beforeEach(() => {
        // Set environment variables before each test
        process.env.TWILIO_ACCOUNT_SID = 'dummy_sid'
        process.env.TWILIO_API_KEY = 'dummy_api_key'
        process.env.TWILIO_API_SECRET = 'dummy_api_secret'
    })


    afterEach(() => {
      // Clean up any modifications to process.env between tests.
      delete process.env.TWILIO_ACCOUNT_SID
      delete process.env.TWILIO_API_KEY
      delete process.env.TWILIO_API_SECRET
    })

    it("should return an error if username or roomName is missing", async () => {
      // Test missing username and roomName:
      const req1 = new Request("http://localhost/api/twilio", {
        method: "POST",
        body: JSON.stringify({ username: "alice" }), // missing roomName
      })
      const res1 = await POST(req1)
      const body1 = await res1.json()
      expect(body1.error).toBe("Missing username or roomName")

      // Test missing username:
      const req2 = new Request("http://localhost/api/twilio", {
        method: "POST",
        body: JSON.stringify({ roomName: "room1" }), // missing username
      })
      const res2 = await POST(req2)
      const body2 = await res2.json()
      expect(body2.error).toBe("Missing username or roomName")
    })

    // it('should generate and return a token when parameters are provided', async () => {
    //     const req = new Request('http://localhost/api/twilio', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({
    //         username: 'alice',
    //         roomName: 'dummy_room',
    //       }),
    //     }) as unknown as Request;
  
    //     // Ensure the mock works: Check the constructor and methods
    //     const mockAccessToken = Twilio.jwt.AccessToken as unknown as jest.Mock; // Mock the AccessToken constructor
    //     const accessTokenInstance = new mockAccessToken(); // This will invoke the mock constructor
  
    //     // Ensure toJwt is a mock function
    //     expect(accessTokenInstance.toJwt).toBeDefined(); // Check if toJwt method is mocked
    //     expect(accessTokenInstance.toJwt()).toBe('dummy_jwt'); // Check if toJwt method returns 'dummy_jwt'
  
    //     // Check if VideoGrant is being called correctly
    //     // const mockVideoGrant = mockAccessToken.mock.instances[0].VideoGrant as jest.Mock;
    //     // expect(mockVideoGrant).toHaveBeenCalledTimes(1); // Ensure the VideoGrant is called
    //     // expect(mockVideoGrant).toHaveBeenCalledWith({
    //     //   room: 'dummy_room',
    //     // }); // Check if the parameters are passed correctly to VideoGrant
  
    //     // Make the request to the POST function
    //     const res = await POST(req);
    //     expect(res.status).toBe(200); // Status should be 200
  
    //     const body = await res.json();
    //     expect(body.token).toBe('dummy_jwt'); // The returned token should be 'dummy_jwt'
    //   })

    it("should return a 500 error if token generation fails", async () => {
        // Simulating an error when creating an AccessToken
        (Twilio.jwt.AccessToken as unknown as jest.Mock).mockImplementationOnce(() => {
          throw new Error("Token generation error")
        })
  
        const req = new Request("http://localhost/api/twilio", {
          method: "POST",
          body: JSON.stringify({
            username: "alice",
            roomName: "room1",
          }),
        }) as unknown as Request
  
        const res = await POST(req)
        expect(res.status).toBe(500) // Expect status code 500
  
        const body = await res.json()
        expect(body.error).toBe("Failed to generate Twilio token")
      })
    })
})

  