import * as z from "zod";
import { createHmac, timingSafeEqual } from "crypto";

import { createTRPCRouter, publicProcedure } from "../create-context";

type SignedLicensePayload = {
  v: 1;
  plan: "pro";
  exp: number | null;
  iat: number;
  email?: string;
  orderId?: string;
};

function getSecret() {
  const secret = process.env.LICENSE_SIGNING_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error("Server not configured: LICENSE_SIGNING_SECRET is missing or too short");
  }
  return secret;
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(payload: SignedLicensePayload) {
  const secret = getSecret();
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = createHmac("sha256", secret).update(body).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${body}.${sig}`;
}

function verifySignedToken(token: string): SignedLicensePayload {
  const secret = getSecret();
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("Invalid license token format");

  const expected = createHmac("sha256", secret)
    .update(body)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid license token signature");
  }

  const parsed = JSON.parse(base64UrlDecode(body)) as SignedLicensePayload;
  if (!parsed || typeof parsed !== "object" || parsed.v !== 1 || parsed.plan !== "pro") {
    throw new Error("Invalid license token payload");
  }

  if (parsed.exp != null && Date.now() > parsed.exp) {
    throw new Error("License expired");
  }

  return parsed;
}

export const licenseRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        adminKey: z.string().min(1),
        email: z.string().email().optional(),
        orderId: z.string().min(1).optional(),
        expiresAt: z.number().int().positive().optional(),
      }),
    )
    .mutation(({ input }) => {
      const expectedAdminKey = process.env.ADMIN_LICENSE_KEY;
      if (!expectedAdminKey || expectedAdminKey.trim().length < 12) {
        throw new Error("Server not configured: ADMIN_LICENSE_KEY is missing or too short");
      }
      if (input.adminKey !== expectedAdminKey) {
        throw new Error("Unauthorized");
      }

      const now = Date.now();
      const token = sign({
        v: 1,
        plan: "pro",
        exp: input.expiresAt ?? null,
        iat: now,
        email: input.email,
        orderId: input.orderId,
      });

      return {
        token,
        plan: "pro" as const,
        expiresAt: input.expiresAt ?? null,
      };
    }),

  verify: publicProcedure
    .input(z.object({ token: z.string().min(10) }))
    .query(({ input }) => {
      const payload = verifySignedToken(input.token);
      return {
        valid: true,
        plan: payload.plan,
        expiresAt: payload.exp,
        issuedAt: payload.iat,
        email: payload.email ?? null,
        orderId: payload.orderId ?? null,
      };
    }),
});
