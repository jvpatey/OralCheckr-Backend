import { Request, Response, NextFunction } from "express";

/* -- Common Middleware -- */

// Add Cross-Origin headers to the response
export const addCrossOriginHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
};
