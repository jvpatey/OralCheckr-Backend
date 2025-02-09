import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: {
    userId: number | string;
    role?: string;
  };
}

// Middleware to authenticate and verify the JWT token
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token is missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number | string;
      role?: string;
    };

    req.user = { userId: decoded.userId, role: decoded.role };

    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
