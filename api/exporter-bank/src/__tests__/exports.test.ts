import request from "supertest";
import express from "express";
import exportRoutes from "../routes/export.routes";
import { describe, it, expect, beforeAll } from "@jest/globals";
import { generateTestToken } from "./setup";

const app = express();
app.use(express.json());
app.use("/api/exports", exportRoutes);

describe("Exports API Tests", () => {
  let authToken: string;
  let exportId: string;

  beforeAll(async () => {
    // Generate a valid test token
    authToken = generateTestToken();
  });

  describe("POST /api/exports", () => {
    it("should create a new export request", async () => {
      const exportData = {
        exporterName: "Test Coffee Exporters",
        coffeeType: "Arabica",
        quantity: 5000,
        destinationCountry: "United States",
        estimatedValue: 75000,
      };

      const response = await request(app)
        .post("/api/exports")
        .set("Authorization", `Bearer ${authToken}`)
        .send(exportData)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("exportId");
      expect(response.body.data).toHaveProperty("status", "PENDING");

      exportId = response.body.data.exportId;
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post("/api/exports")
        .send({
          exporterName: "Test",
          coffeeType: "Arabica",
          quantity: 1000,
          destinationCountry: "USA",
          estimatedValue: 10000,
        })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with invalid data", async () => {
      const response = await request(app)
        .post("/api/exports")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          exporterName: "Test",
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/exports", () => {
    it("should get all exports", async () => {
      const response = await request(app)
        .get("/api/exports")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should fail without authentication", async () => {
      const response = await request(app).get("/api/exports").expect(401);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/exports/:id", () => {
    it("should get export by ID", async () => {
      const response = await request(app)
        .get(`/api/exports/${exportId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("exportID", exportId);
    });

    it("should return 404 for non-existent export", async () => {
      const response = await request(app)
        .get("/api/exports/NON_EXISTENT_ID")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/exports/status/:status", () => {
    it("should get exports by status", async () => {
      const response = await request(app)
        .get("/api/exports/status/PENDING")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/exports/:id/history", () => {
    it("should get export history", async () => {
      const response = await request(app)
        .get(`/api/exports/${exportId}/history`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("PUT /api/exports/:id/complete", () => {
    it("should complete an export", async () => {
      const response = await request(app)
        .put(`/api/exports/${exportId}/complete`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
    });
  });

  describe("PUT /api/exports/:id/cancel", () => {
    it("should cancel an export", async () => {
      const response = await request(app)
        .put(`/api/exports/${exportId}/cancel`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
    });
  });
});
