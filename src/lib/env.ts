import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  COMPOSIO_API_KEY: z.string().min(1, "COMPOSIO_API_KEY is required"),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export function validateEnv() {
  const result = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  });

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.flatten().fieldErrors);
    // Don't crash during build step if dummy build env is present, but inform clearly
    if (process.env.NODE_ENV === "production" && !process.env.SKIP_ENV_VALIDATION) {
      throw new Error("Invalid environment variables");
    }
  }
  return result.data;
}

export const env = {
  get DATABASE_URL() { return process.env.DATABASE_URL || ""; },
  get CLERK_SECRET_KEY() { return process.env.CLERK_SECRET_KEY || ""; },
  get GROQ_API_KEY() { return process.env.GROQ_API_KEY || ""; },
  get COMPOSIO_API_KEY() { return process.env.COMPOSIO_API_KEY || ""; },
  get INNGEST_EVENT_KEY() { return process.env.INNGEST_EVENT_KEY || ""; },
  get INNGEST_SIGNING_KEY() { return process.env.INNGEST_SIGNING_KEY || ""; },
  get NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY() { return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ""; },
  get NEXT_PUBLIC_APP_URL() { return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; },
};
