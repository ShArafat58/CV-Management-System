import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        const user = req.user as { blocked?: boolean };
        if (user.blocked) {
            return res.status(403).json({ error: "Account is blocked" });
        }
        return next();
    }
    return res.status(401).json({ error: "Not authenticated" });
}

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const user = req.user as { role: string; blocked?: boolean };
        if (user.blocked) {
            return res.status(403).json({ error: "Account is blocked" });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        return next();
    };
}