import { afterEach, expect, test, vi } from "vitest";

import { apiFetch } from "@/services/api/client";
import { ApiClientError } from "@/types/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("apiFetch parses success envelopes", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { status: "ok" }, meta: {}, errors: [] }),
    }),
  );

  const response = await apiFetch<{ status: string }>("/ping");

  expect(response.data.status).toBe("ok");
});

test("apiFetch normalizes error envelopes", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        data: null,
        meta: {},
        errors: [{ code: "AUTH_REQUIRED", message: "Authentication is required.", field: null, details: {} }],
      }),
    }),
  );

  await expect(apiFetch("/me")).rejects.toBeInstanceOf(ApiClientError);
});
