import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import {
  AuthenticatedRequest,
  JWTError,
  DecodedToken,
} from "../interfaces/auth";

/* -- Middleware to authenticate and verify JWT token from cookies or headers -- */

/* -- Verify the JWT token -- */
export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Get the JWT token from the cookies or headers
  const token =
    req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

  // If the token is not provided, send a 401 error
  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  // If the token is provided, verify it
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;

    // Set the user in the request
    req.user = { userId: decoded.userId, role: decoded.role };

    // Call the next middleware
    return next();
  } catch (err) {
    const jwtError = err as JWTError;

    if (jwtError.name === "TokenExpiredError") {
      res.status(403).json({ error: "Unauthorized: Token expired" });
      return;
    }

    res.status(403).json({ error: "Unauthorized: Invalid token" });
    return;
  }
};
