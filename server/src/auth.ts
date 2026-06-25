import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import prisma from "./db.js";

async function findOrCreateUser(
    provider: string,
    providerId: string,
    email: string,
    displayName: string
) {
    const existing = await prisma.user.findUnique({
        where: { provider_providerId: { provider, providerId } },
    });

    if (existing) return existing;

    return prisma.user.create({
        data: {
            provider,
            providerId,
            email,
            displayName,
            profile: { create: {} },
        },
    });
}

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            callbackURL: "/api/auth/google/callback",
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value ?? "";
                const user = await findOrCreateUser(
                    "google",
                    profile.id,
                    email,
                    profile.displayName ?? email
                );
                done(null, user);
            } catch (err) {
                done(err as Error);
            }
        }
    )
);

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
            callbackURL: "/api/auth/github/callback",
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
            try {
                const email = profile.emails?.[0]?.value ?? `${profile.username}@github.local`;
                const user = await findOrCreateUser(
                    "github",
                    profile.id,
                    email,
                    profile.displayName ?? profile.username
                );
                done(null, user);
            } catch (err) {
                done(err as Error);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err as Error);
    }
});

export default passport;