import request from "supertest";
import express from "express";
import authRoutes from "../routes/auth.routes";
import { describe, it, expect } from "@jest/globals";
import { generateTestToken } from "./setup";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Authentication API Tests", () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: "TestPassword123!",
    email: `test_${Date.now()}@example.com`,
  };

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message");
      expect(response.body.data.user).toHaveProperty(
        "username",
        testUser.username,
      );
    });

    it("should fail with duplicate username", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "newuser",
          password: "Password123!",
          email: "invalid-email",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with weak password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "newuser2",
          password: "123",
          email: "test@example.com",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data).toHaveProperty("user");
    });

    it("should fail with incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail with non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "nonexistentuser",
          password: "Password123!",
        })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh token successfully", async () => {
      const validToken = generateTestToken();
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ token: validToken })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("token");
    });

    it("should fail without token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });
  });
});
