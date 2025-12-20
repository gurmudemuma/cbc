import { Request, Response, NextFunction } from "express";

/**
 * Validate registration request
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { username, email, password } = req.body;

  // Check required fields
  if (!username || !email || !password) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUIRED_FIELD",
        message: "Username, email, and password are required",
      },
    });
    return;
  }

  // Validate username
  if (typeof username !== "string" || username.length < 3 || username.length > 50) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Username must be between 3 and 50 characters",
      },
    });
    return;
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Invalid email address",
      },
    });
    return;
  }

  // Validate password
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Password must be at least 8 characters",
      },
    });
    return;
  }

  next();
};

/**
 * Validate login request
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { username, password } = req.body;

  // Check required fields
  if (!username || !password) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUIRED_FIELD",
        message: "Username and password are required",
      },
    });
    return;
  }

  // Validate username
  if (typeof username !== "string" || username.length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Username is required",
      },
    });
    return;
  }

  // Validate password
  if (typeof password !== "string" || password.length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Password is required",
      },
    });
    return;
  }

  next();
};

/**
 * Validate refresh token request
 */
export const validateRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUIRED_FIELD",
        message: "Token is required",
      },
    });
    return;
  }

  if (typeof token !== "string") {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Token must be a string",
      },
    });
    return;
  }

  next();
};

/**
 * Validate password change request
 */
export const validatePasswordChange = (req: Request, res: Response, next: NextFunction): void => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUIRED_FIELD",
        message: "Current password and new password are required",
      },
    });
    return;
  }

  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Current password is required",
      },
    });
    return;
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "New password must be at least 8 characters",
      },
    });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "New password must be different from current password",
      },
    });
    return;
  }

  next();
};

/**
 * Validate profile update request
 */
export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { email, role } = req.body;

  // Email is optional but if provided, must be valid
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Invalid email address",
        },
      });
      return;
    }
  }

  // Role is optional but if provided, must be valid
  if (role) {
    const validRoles = ["user", "admin", "manager", "viewer"];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: `Role must be one of: ${validRoles.join(", ")}`,
        },
      });
      return;
    }
  }

  next();
};

/**
 * Validate quality certificate request
 */
export const validateQualityCertificate = (req: Request, res: Response, next: NextFunction): void => {
  const { exportId, grade, notes } = req.body;

  if (!exportId) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUIRED_FIELD",
        message: "Export ID is required",
      },
    });
    return;
  }

  if (!grade) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUIRED_FIELD",
        message: "Grade is required",
      },
    });
    return;
  }

  const validGrades = ["A", "B", "C", "D"];
  if (!validGrades.includes(grade)) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: `Grade must be one of: ${validGrades.join(", ")}`,
      },
    });
    return;
  }

  next();
};

/**
 * Validate quality rejection request
 */
export const validateQualityRejection = (req: Request, res: Response, next: NextFunction): void => {
  const { exportId, reason } = req.body;

  if (!exportId) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUIRED_FIELD",
        message: "Export ID is required",
      },
    });
    return;
  }

  if (!reason) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUIRED_FIELD",
        message: "Rejection reason is required",
      },
    });
    return;
  }

  if (typeof reason !== "string" || reason.length < 10) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Rejection reason must be at least 10 characters",
      },
    });
    return;
  }

  next();
};
