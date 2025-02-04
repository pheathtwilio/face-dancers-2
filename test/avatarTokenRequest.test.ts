
describe("HEYGEN API Endpoint", () => {

    describe("GET", () => {
      it("should return a 405 error and a JSON error message", async () => {
        // Import the GET function from your module.
        // (Assume your file is located at "src/api/heygen.ts" or adjust the path accordingly.)
        const { GET } = await import("@/app/api/avatar/route")
        const req = new Request("http://localhost/api/heygen", { method: "GET" })
  
        const res = await GET(req)
        expect(res.status).toBe(405)
  
        const body = await res.json()
        expect(body.error).toBe("GET method not allowed")
      })
    })
  
    describe("POST", () => {
      afterEach(() => {
        // Clean up any fetch mock and reset modules after each test.
        jest.resetModules()
        // @ts-ignore
        global.fetch = undefined
      })
  
      it("should return an error if HEYGEN_API_KEY is not set", async () => {
        process.env.HEYGEN_API_KEY = ""

        const { POST } = await import("@/app/api/avatar/route")
        const req = new Request("http://localhost/api/heygen", { method: "POST" })
  
        const res = await POST(req)
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.error).toBe("No HEYGEN API ACCESS KEY")
      })
  
      it("should return a token if the fetch call is successful", async () => {
        // Set the HEYGEN_API_KEY.
        process.env.HEYGEN_API_KEY = "dummy_key"
  
        // Re-import the module so that it picks up the key.
        const { POST } = await import("@/app/api/avatar/route")
  
        // Mock the global fetch function to simulate a successful call.
        global.fetch = jest.fn().mockResolvedValue({
          json: () =>
            Promise.resolve({
              data: { token: "dummy_token" },
            }),
        })
  
        const req = new Request("http://localhost/api/heygen", { method: "POST" })
        const res = await POST(req)
        expect(res.status).toBe(200)
  
        const body = await res.json()
        expect(body.token).toBe("dummy_token")
      })
  
      it("should return a 500 error if fetch fails", async () => {
        process.env.HEYGEN_API_KEY = "dummy_key"
  
        const { POST } = await import("@/app/api/avatar/route")
        global.fetch = jest.fn().mockRejectedValue(new Error("Fetch error"))
  
        const req = new Request("http://localhost/api/heygen", { method: "POST" })
        const res = await POST(req)
        expect(res.status).toBe(500)
  
        const body = await res.json()
        expect(body.error).toBe("Failed to retrieve HEYGEN token")
      })
    })
  })
  