export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Edge runtime mein env vars directly milte hain
  const apiKey = (process as any).env.REPLICATE_API_KEY || 
                 (globalThis as any).REPLICATE_API_KEY || "";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key missing", env: Object.keys((process as any).env || {}) }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();

  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = { runtime: "edge" };
