import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma";

export class PortalUsersController {
  public getUsers = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId } = req.query as { organizationId?: string };
      const orgId = organizationId || "EXPORTER-BANK-001";

      const users = await prisma.user.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          organizationId: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
      });

      res.status(200).json({ success: true, data: users, count: users.length });
    } catch (error: any) {
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
      const { username, password, email, organizationId, role } = req.body as {
        username: string;
        password: string;
        email: string;
        organizationId?: string;
        role?: string;
      };

      const orgId = organizationId || "EXPORTER-BANK-001";
      const userRole = role || "exporter-portal";

      const existing = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
      });
      if (existing) {
        res.status(400).json({
          success: false,
          message: "Username or email already exists",
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const created = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          organizationId: orgId,
          role: userRole,
        },
        select: {
          id: true,
          username: true,
          email: true,
          organizationId: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      res
        .status(201)
        .json({ success: true, message: "User created", data: created });
    } catch (error: any) {
      res.status(500).json({
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
      await prisma.user.update({ where: { id }, data: { isActive: false } });
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
      await prisma.user.update({ where: { id }, data: { isActive: true } });
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
