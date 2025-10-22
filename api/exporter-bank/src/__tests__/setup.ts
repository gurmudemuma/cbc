import jwt from "jsonwebtoken";

// Mock JWT secret for tests
process.env.JWT_SECRET = "test-secret-key-for-testing-purposes-only";
process.env["NODE_ENV"] = "test";

// Helper function to generate test tokens
export const generateTestToken = (
  payload: Record<string, string | number | boolean | undefined> = {},
): string => {
  const defaultPayload = {
    id: "test-user-id",
    username: "testuser",
    organizationId: "EXPORTER-BANK-001",
    role: "exporter",
    ...payload,
  };

  return jwt.sign(defaultPayload, process.env.JWT_SECRET!, { expiresIn: "1h" });
};

// Mock the FabricGateway
jest.mock("../fabric/gateway", () => {
  const mockExports = new Map();

  return {
    FabricGateway: {
      getInstance: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(true),
        getExportContract: jest.fn().mockReturnValue({
          submitTransaction: jest
            .fn()
            .mockImplementation(async (funcName: string, ...args: string[]) => {
              if (funcName === "CreateExportRequest") {
                const [exportId] = args;
                const exportData = {
                  exportID: exportId,
                  status: "PENDING",
                };
                mockExports.set(exportId, exportData);
                return Buffer.from(JSON.stringify(exportData));
              }
              return Buffer.from("{}");
            }),
          evaluateTransaction: jest
            .fn()
            .mockImplementation(async (funcName: string, ...args: string[]) => {
              if (funcName === "GetExportRequest") {
                const [exportId] = args;
                const exportData = mockExports.get(exportId);
                if (!exportData) {
                  throw new Error("Export not found");
                }
                return Buffer.from(JSON.stringify(exportData));
              }
              if (
                funcName === "GetAllExports" ||
                funcName === "GetExportsByStatus" ||
                funcName === "GetExportHistory"
              ) {
                return Buffer.from(
                  JSON.stringify(Array.from(mockExports.values())),
                );
              }
              return Buffer.from("[]");
            }),
        }),
        getUserContract: jest.fn().mockReturnValue({
          submitTransaction: jest.fn().mockResolvedValue(Buffer.from("{}")),
          evaluateTransaction: jest.fn().mockResolvedValue(Buffer.from("{}")),
        }),
      }),
    },
  };
});

// Ensure user mocks are initialized cleanly before suite
beforeAll(() => {
  (global as any).__mockUsers?.clear?.();
});

// Mock the userService
jest.mock("../../../shared/userService", () => {
  const mockUsers = new Map();

  // expose for cleanup between tests
  (global as any).__mockUsers = mockUsers;

  return {
    createUserService: jest.fn().mockReturnValue({
      registerUser: jest
        .fn()
        .mockImplementation(
          async (userData: {
            username: string;
            email: string;
            password: string;
            organizationId?: string;
            role?: string;
          }) => {
            if (mockUsers.has(userData.username)) {
              throw new Error("User already exists");
            }

            // Validate email
            if (!userData.email.includes("@")) {
              throw new Error("Invalid email format");
            }

            // Validate password strength
            if (userData.password.length < 8) {
              throw new Error("Password must be at least 8 characters");
            }

            const user = {
              id: `user-${Date.now()}`,
              username: userData.username,
              email: userData.email,
              organizationId: userData.organizationId,
              role: userData.role,
            };

            mockUsers.set(userData.username, {
              ...user,
              password: userData.password,
            });
            return user;
          },
        ),

      authenticateUser: jest
        .fn()
        .mockImplementation(
          async ({
            username,
            password,
          }: {
            username: string;
            password: string;
          }) => {
            const user = mockUsers.get(username);

            if (!user) {
              throw new Error("User not found");
            }

            if (user.password !== password) {
              throw new Error("Invalid password");
            }

            return {
              id: user.id,
              username: user.username,
              email: user.email,
              organizationId: user.organizationId,
              role: user.role,
            };
          },
        ),
    }),
    BlockchainUserService: jest.fn(),
  };
});
