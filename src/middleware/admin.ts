import { Request, Response, NextFunction } from "express";

// Admin role checker middleware
// In production, this should integrate with Medusa's user roles/permissions
export const ensureAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if user is authenticated first
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized: Authentication required",
    });
  }

  // In production, check user's role from database
  // For now, we'll check a custom claim in the JWT or user object
  const user = req.user as any;
  
  // Check if user has admin role
  // This could be: user.role === 'admin' or user.is_admin === true
  // For MedusaJS, you might check: user.metadata?.role === 'admin'
  const isAdmin = user.role === "admin" || user.is_admin === true;

  if (!isAdmin) {
    return res.status(403).json({
      message: "Forbidden: Admin access required",
    });
  }

  next();
};
