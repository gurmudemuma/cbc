/**
 * PostgreSQL User Service
 * Handles all user-related database operations
 */
export interface UserData {
    username: string;
    email: string;
    password: string;
    organizationId?: string;
    role?: string;
}
export interface User {
    id: string;
    username: string;
    email: string;
    organization_id?: string;
    role: string;
    created_at: Date;
}
export declare class PostgresUserService {
    /**
     * Register a new user
     */
    registerUser(data: UserData): Promise<User>;
    /**
     * Authenticate user
     */
    authenticateUser(username: string, password: string): Promise<User>;
    /**
     * Get user by ID
     */
    getUserById(userId: string): Promise<User | null>;
    /**
     * Get user by username
     */
    getUserByUsername(username: string): Promise<User | null>;
    /**
     * Get user by email
     */
    getUserByEmail(email: string): Promise<User | null>;
    /**
     * Get all users
     */
    getAllUsers(): Promise<User[]>;
    /**
     * Get users by organization
     */
    getUsersByOrganization(organizationId: string): Promise<User[]>;
    /**
     * Update user role
     */
    updateUserRole(userId: string, role: string): Promise<User>;
    /**
     * Delete user
     */
    deleteUser(userId: string): Promise<void>;
}
/**
 * Factory function to create PostgresUserService instance
 */
export declare function createUserService(): PostgresUserService;
//# sourceMappingURL=postgres-user.service.d.ts.map