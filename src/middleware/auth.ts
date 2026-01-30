import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  user_id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        user_id: string;
        email?: string;
      };
    }
  }
}

export const ensureAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized: Missing or invalid authorization header",
    });
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET || "supersecret";

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    req.user = {
      id: decoded.user_id,
      user_id: decoded.user_id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized: Invalid token",
    });
  }
};
