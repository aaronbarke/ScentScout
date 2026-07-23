import { describe, it, expect } from "vitest";
import { isUsablePostgresUrl, resolveMigrationUrl } from "@/lib/env";

const POOLER = "postgresql://postgres.abc:pw@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

describe("isUsablePostgresUrl", () => {
  it("accepts a real connection string", () => {
    expect(isUsablePostgresUrl(POOLER)).toBe(true);
  });

  it("rejects undefined / empty", () => {
    expect(isUsablePostgresUrl(undefined)).toBe(false);
    expect(isUsablePostgresUrl("")).toBe(false);
  });

  it("rejects the .env.example template default (user:password@host)", () => {
    // Regression: this placeholder silently won over a valid DATABASE_URL and
    // made migrations hang trying to dial a host literally named "host".
    expect(isUsablePostgresUrl("postgresql://user:password@host:5432/postgres")).toBe(false);
  });

  it("rejects an unreplaced [YOUR-PASSWORD] placeholder", () => {
    expect(
      isUsablePostgresUrl("postgresql://postgres.abc:[YOUR-PASSWORD]@db.abc.supabase.co:5432/postgres"),
    ).toBe(false);
  });

  it("rejects non-postgres schemes and unparseable values", () => {
    expect(isUsablePostgresUrl("mysql://user2:pw@example.com:3306/db")).toBe(false);
    expect(isUsablePostgresUrl("not a url")).toBe(false);
  });
});

describe("resolveMigrationUrl", () => {
  it("derives Supabase session mode (5432) from the transaction pooler (6543)", () => {
    const out = resolveMigrationUrl(POOLER, undefined);
    expect(new URL(out).port).toBe("5432");
    expect(new URL(out).hostname).toBe("aws-1-us-east-2.pooler.supabase.com");
  });

  it("ignores a placeholder DIRECT_URL and still resolves a working URL", () => {
    const out = resolveMigrationUrl(POOLER, "postgresql://user:password@host:5432/postgres");
    expect(new URL(out).hostname).toBe("aws-1-us-east-2.pooler.supabase.com");
    expect(new URL(out).port).toBe("5432");
  });

  it("prefers an explicit, usable DIRECT_URL", () => {
    const direct = "postgresql://postgres:pw@db.abc.supabase.co:5432/postgres";
    expect(resolveMigrationUrl(POOLER, direct)).toBe(direct);
  });

  it("leaves a non-Supabase DATABASE_URL untouched", () => {
    const plain = "postgresql://postgres:pw@localhost:5432/scentscout";
    expect(resolveMigrationUrl(plain, undefined)).toBe(plain);
  });
});
