import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Extend Express Request to include the user property
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number | "guest";
    role?: string;
  };
}

// Middleware to authenticate and verify JWT token from cookies or headers
export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token =
    req.cookies?.accessToken || req.headers.authorization?.split(" ")[1]; // Extract from cookie or Authorization header

  console.log("Token received:", token);

  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number | "guest";
      role?: string;
    };

    req.user = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(403).json({ error: "Unauthorized: Token expired" });
      return;
    }

    res.status(403).json({ error: "Unauthorized: Invalid token" });
    return;
  }
};
