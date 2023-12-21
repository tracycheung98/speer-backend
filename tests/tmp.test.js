const request = require("supertest");
const app = require("../app");

require("dotenv").config();

beforeEach(async () => {
  await mongoose.connect(process.env.MONGODB_URI.concat("/prod"));
});

afterEach(async () => {
  await mongoose.connection.close();
});

describe("GET /", () => {
    it("should return hi", async () => {
      const res = await request(app).get("/");
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe("Hi.");
    });
  });
