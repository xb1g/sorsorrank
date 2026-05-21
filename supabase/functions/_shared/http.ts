const allowedOrigins = (Deno.env.get("PUBLIC_APP_ORIGIN") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins.length === 1 ? allowedOrigins[0] : "*",
  ...(allowedOrigins.length === 1 ? { "Access-Control-Allow-Credentials": "true" } : {}),
  "Access-Control-Allow-Headers": "apikey, authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin"
};

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {};
  }

  const parsed = await request.json();
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

export function assertMethod(request: Request, method: "GET" | "POST") {
  if (request.method !== method) {
    throw new HttpError(405, "MethodNotAllowed", `${method} is required.`);
  }
}

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = code;
    this.status = status;
    this.code = code;
  }
}
