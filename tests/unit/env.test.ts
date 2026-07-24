import { describe, it, expect } from "vitest";
import { isUsablePostgresUrl, resolveMigrationUrl } from "@/lib/env";
import { isAdminEmail } from "@/lib/admin";

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

describe("admin authorization fails closed", () => {
  it("grants access to an email on the allow-list", () => {
    expect(isAdminEmail("me@example.com", "me@example.com")).toBe(true);
    expect(isAdminEmail("me@example.com", "other@x.com, me@example.com")).toBe(true);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(isAdminEmail("  Me@Example.COM ", "me@example.com")).toBe(true);
  });

  it("denies everyone when the allow-list is unset or empty", () => {
    // A misconfigured deployment must not silently open the admin tools.
    expect(isAdminEmail("me@example.com", undefined)).toBe(false);
    expect(isAdminEmail("me@example.com", null)).toBe(false);
    expect(isAdminEmail("me@example.com", "")).toBe(false);
    expect(isAdminEmail("me@example.com", "   ")).toBe(false);
    expect(isAdminEmail("me@example.com", ",, ,")).toBe(false);
  });

  it("denies a signed-out visitor", () => {
    expect(isAdminEmail(null, "me@example.com")).toBe(false);
    expect(isAdminEmail(undefined, "me@example.com")).toBe(false);
  });

  it("denies an email that is not on the list", () => {
    expect(isAdminEmail("attacker@example.com", "me@example.com")).toBe(false);
    // Substring matches must not pass.
    expect(isAdminEmail("me@example.com.evil.com", "me@example.com")).toBe(false);
  });
});
