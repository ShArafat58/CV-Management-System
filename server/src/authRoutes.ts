import { Router } from "express";
import passport from "./auth.js";


const router = Router();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: `${CLIENT_URL}/login?error=google`,
    }),
    (_req, res) => {
        res.redirect(CLIENT_URL);
    }
);

router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
    "/github/callback",
    passport.authenticate("github", {
        failureRedirect: `${CLIENT_URL}/login?error=github`,
    }),
    (_req, res) => {
        res.redirect(CLIENT_URL);
    }
);

router.get("/me", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.json({ user: req.user });
    } else {
        res.json({ user: null });
    }
});

router.post("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.json({ ok: true });
    });
});

export default router;