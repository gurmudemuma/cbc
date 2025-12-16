/**
 * Test Setup and Utilities
 * Common test configuration and helper functions
 */

import type { NextFunction } from 'express';

// Mock Request builder
export class MockRequest {
  public body: any = {};
  public params: any = {};
  public query: any = {};
  public headers: any = {};
  public user?: any;
  public file?: any;
  public files?: any;

  constructor(data: any = {}) {
    Object.assign(this, data);
  }

  static create(data: any = {}) {
    return new MockRequest(data) as unknown as any;
  }
}

// Mock Response builder
export class MockResponse {
  public statusCode: number = 200;
  public body: any = null;
  public headers: { [key: string]: string } = {};

  public status(code: number): this {
    this.statusCode = code;
    return this;
  }

  public json(data: any): this {
    this.body = data;
    return this;
  }

  public send(data: any): this {
    this.body = data;
    return this;
  }

  public setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  static create() {
    return new MockResponse() as unknown as any;
  }
}

// Mock Next function
export const mockNext: NextFunction = jest.fn();

// Mock Fabric Gateway
export class MockFabricGateway {
  private mockContract: any;

  constructor() {
    this.mockContract = {
      submitTransaction: jest.fn().mockResolvedValue(Buffer.from('{}')),
      evaluateTransaction: jest.fn().mockResolvedValue(Buffer.from('[]')),
    };
  }

  getExportContract() {
    return this.mockContract;
  }

  getUserContract() {
    return this.mockContract;
  }

  async connect() {
    return Promise.resolve();
  }

  async disconnect() {
    return Promise.resolve();
  }

  static getInstance() {
    return new MockFabricGateway();
  }
}

// Mock IPFS Service
export class MockIPFSService {
  uploadBuffer = jest.fn().mockResolvedValue({
    hash: 'QmTestHash123',
    size: 1024,
  });

  downloadFile = jest.fn().mockResolvedValue(Buffer.from('test data'));

  pinFile = jest.fn().mockResolvedValue(true);

  unpinFile = jest.fn().mockResolvedValue(true);
}

// Mock WebSocket Service
export class MockWebSocketService {
  emitExportCreated = jest.fn();
  emitExportUpdated = jest.fn();
  emitDocumentUploaded = jest.fn();
  emitDocumentDeleted = jest.fn();
  broadcast = jest.fn();
  close = jest.fn();
}

// Test data generators
export class TestDataGenerator {
  static generateExportRequest(overrides?: any) {
    return {
      exporterName: 'Test Exporter Company',
      coffeeType: 'Arabica Premium',
      quantity: 5000,
      destinationCountry: 'United States',
      estimatedValue: 75000,
      ...overrides,
    };
  }

  static generateUser(overrides?: any) {
    return {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      organizationId: 'commercialbank',
      role: 'exporter',
      ...overrides,
    };
  }

  static generateJWT(user?: any) {
    return {
      id: user?.id || 'user-123',
      username: user?.username || 'testuser',
      organizationId: user?.organizationId || 'commercialbank',
      role: user?.role || 'exporter',
    };
  }

  static generateExportId() {
    return `EXP-${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Async error helper
export const expectAsyncError = async (fn: () => Promise<any>, errorMessage?: string) => {
  await expect(fn()).rejects.toThrow(errorMessage);
};

// Environment variable helper for tests
export const withEnvVars = (vars: { [key: string]: string }, fn: () => void) => {
  const originalEnv = { ...process.env };
  Object.assign(process.env, vars);

  try {
    fn();
  } finally {
    process.env = originalEnv;
  }
};

// Wait helper for async operations
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock timer helper
export class MockTimer {
  static useFakeTimers() {
    jest.useFakeTimers();
  }

  static useRealTimers() {
    jest.useRealTimers();
  }

  static advanceTimersByTime(ms: number) {
    jest.advanceTimersByTime(ms);
  }

  static runAllTimers() {
    jest.runAllTimers();
  }
}

// Database cleanup helper (for integration tests)
export class TestDatabase {
  static async cleanup() {
    // Implement database cleanup logic for integration tests
    // This would clear test data between tests
  }

  static async seed() {
    // Implement database seeding for tests
    // This would insert test data
  }
}

// API Test helper
export class APITestHelper {
  static createAuthHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  static createMultipartFormData(data: any, file?: any) {
    // Helper to create multipart form data for file upload tests
    return {
      ...data,
      file,
    };
  }

  static expectSuccessResponse(response: any) {
    expect(response.body).toHaveProperty('success', true);
  }

  static expectErrorResponse(response: any, statusCode: number) {
    expect(response.statusCode).toBe(statusCode);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  }
}

// Fabric contract mock helpers
export const createMockContract = (methods: { [key: string]: any } = {}) => {
  return {
    submitTransaction: jest.fn(),
    evaluateTransaction: jest.fn(),
    ...methods,
  };
};

// Export all as test utilities
export const TestUtils = {
  MockRequest,
  MockResponse,
  mockNext,
  MockFabricGateway,
  MockIPFSService,
  MockWebSocketService,
  TestDataGenerator,
  expectAsyncError,
  withEnvVars,
  wait,
  MockTimer,
  TestDatabase,
  APITestHelper,
  createMockContract,
};

export default TestUtils;
