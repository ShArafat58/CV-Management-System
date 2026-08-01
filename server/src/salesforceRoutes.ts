import { Router } from "express";
import prisma from "./db.js";
import { requireAuth } from "./middleware.js";

const router = Router();

async function getSalesforceToken() {
    const loginUrl = process.env.SF_LOGIN_URL as string;
    const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SF_CLIENT_ID as string,
        client_secret: process.env.SF_CLIENT_SECRET as string,
    });

    const response = await fetch(`${loginUrl}/services/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error_description || "Salesforce auth failed");
    }
    return { accessToken: data.access_token as string, instanceUrl: data.instance_url as string };
}

router.post("/sync", requireAuth, async (req, res) => {
    try {
        const { companyName, phone, industry, website, description, targetUserId } = req.body;

        if (typeof companyName !== "string" || companyName.trim() === "") {
            return res.status(400).json({ error: "Company name is required" });
        }

        const isAdmin = req.user!.role === "ADMIN";
        const userId = isAdmin && typeof targetUserId === "string" ? targetUserId : req.user!.id;

        if (!isAdmin && userId !== req.user!.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, displayName: true, role: true },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId },
            include: {
                values: {
                    include: { attribute: { select: { name: true, isBuiltIn: true } } },
                },
            },
        });

        const builtIn: Record<string, string> = {};
        if (profile) {
            for (const v of profile.values) {
                if (v.attribute.isBuiltIn) {
                    builtIn[v.attribute.name] = v.value;
                }
            }
        }

        const firstName = builtIn["First Name"] || user.displayName.split(" ")[0] || "Unknown";
        const lastName = builtIn["Last Name"] || user.displayName.split(" ").slice(1).join(" ") || "Unknown";
        const location = builtIn["Location"] || "";

        const { accessToken, instanceUrl } = await getSalesforceToken();

        const accountResponse = await fetch(`${instanceUrl}/services/data/v61.0/sobjects/Account`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "Sforce-Duplicate-Rule-Header": "allowSave=true",
            },
            body: JSON.stringify({
                Name: companyName.trim(),
                Phone: typeof phone === "string" ? phone : null,
                Industry: typeof industry === "string" && industry ? industry : null,
                Website: typeof website === "string" && website ? website : null,
                Description: typeof description === "string" ? description : null,
                BillingCity: location || null,
            }),
        });

        const accountData = await accountResponse.json();
        if (!accountResponse.ok) {
            return res.status(502).json({ error: "Salesforce account creation failed", details: accountData });
        }

        const accountId = accountData.id as string;

        const contactResponse = await fetch(`${instanceUrl}/services/data/v61.0/sobjects/Contact`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "Sforce-Duplicate-Rule-Header": "allowSave=true",
            },
            body: JSON.stringify({
                FirstName: firstName,
                LastName: lastName,
                Email: user.email,
                Phone: typeof phone === "string" ? phone : null,
                AccountId: accountId,
                Title: user.role,
                MailingCity: location || null,
                Description: typeof description === "string" ? description : null,
            }),
        });

        const contactData = await contactResponse.json();
        if (!contactResponse.ok) {
            return res.status(502).json({ error: "Salesforce contact creation failed", details: contactData });
        }

        res.json({
            ok: true,
            accountId,
            contactId: contactData.id,
            instanceUrl,
            sent: { firstName, lastName, email: user.email, role: user.role, location, companyName },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Salesforce sync failed" });
    }
});

export default router;