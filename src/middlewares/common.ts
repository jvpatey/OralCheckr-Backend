import { Request, Response, NextFunction } from "express";

export const addCrossOriginHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
};
