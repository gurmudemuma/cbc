import { Request, Response, NextFunction } from "express";
import { FabricGateway } from "../fabric/gateway";
import { createUserService } from "../../../shared/userService";

export class UsersController {
  private fabricGateway: FabricGateway;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
  }

  private async getUserService() {
    const userContract = await this.fabricGateway.getUserContract();
    return createUserService(userContract);
  }

  public getUsers = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId } = req.query as { organizationId?: string };
      const orgId = organizationId || "EXPORTER-BANK-001";

      const userService = await this.getUserService();
      const users = await userService.getUsersByOrganization(orgId);

      res.status(200).json({ success: true, data: users, count: users.length });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: error?.message || String(error),
      });
    }
  };

  public createUser = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, password, email, organizationId, role } = req.body;

      const userService = await this.getUserService();
      const newUser = await userService.registerUser({
        username,
        password,
        email,
        organizationId: organizationId || "EXPORTER-BANK-001",
        role: role || "exporter-portal",
      });

      res
        .status(201)
        .json({ success: true, message: "User created", data: newUser });
    } catch (error: any) {
      const status = error?.message?.includes("already") ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error?.message || "Failed to create user",
      });
    }
  };

  public deactivateUser = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "User ID is required" });
        return;
      }
      const userService = await this.getUserService();
      await userService.deactivateUser(id);
      res
        .status(200)
        .json({ success: true, message: "User deactivated", data: { id } });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || "Failed to deactivate user",
      });
    }
  };

  public activateUser = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "User ID is required" });
        return;
      }
      const userService = await this.getUserService();
      await userService.activateUser(id);
      res
        .status(200)
        .json({ success: true, message: "User activated", data: { id } });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || "Failed to activate user",
      });
    }
  };
}
