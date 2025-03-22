import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

/* -- Extend Request to include the user property -- */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role?: string;
    email?: string;
  };
}

/* -- Middleware to authenticate and verify JWT token from cookies or headers -- */
export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token =
    req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        userId: number;
        role?: string;
      };
      console.log(`Auth: User ${decoded.userId} accessing ${req.originalUrl}`);
    } catch (err) {
      console.log(`Auth: Invalid token for ${req.originalUrl}`);
    }
  } else {
    console.log(`Auth: No token provided for ${req.originalUrl}`);
  }

  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
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
