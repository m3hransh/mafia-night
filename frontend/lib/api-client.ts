import createClient from "openapi-fetch";
import type { paths } from "@/types/api";
import { getAdminToken, removeAdminToken } from "./adminAuth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/** Type-safe client for public (unauthenticated) API endpoints. */
export const apiClient = createClient<paths>({
  baseUrl: `${BASE_URL}/api`,
});

/** Type-safe client for admin (authenticated) API endpoints.
 *  Automatically attaches the Bearer token and handles 401 redirects. */
export const adminApiClient = createClient<paths>({
  baseUrl: `${BASE_URL}/api`,
});

adminApiClient.use({
  onRequest({ request }) {
    const token = getAdminToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      removeAdminToken();
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
      throw new Error("Unauthorized");
    }
    return response;
  },
});
