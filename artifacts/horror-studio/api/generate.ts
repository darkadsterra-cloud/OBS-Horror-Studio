export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = (process as any).env.HF_API_KEY || "";
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "HF_API_KEY missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { prompt } = await req.json();

  const res = await fetch(
    "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  const responseText = await res.text();
  
  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: `HF Error ${res.status}: ${responseText}` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Image as base64
  const bytes = new Uint8Array(responseText.length);
  const imageRes = await fetch(
    "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  const imageBuffer = await imageRes.arrayBuffer();
  const uint8 = new Uint8Array(imageBuffer);
  let binary = "";
  uint8.forEach((b) => { binary += String.fromCharCode(b); });
  const base64 = btoa(binary);

  return new Response(
    JSON.stringify({ output: [`data:image/jpeg;base64,${base64}`] }),
    { headers: { "Content-Type": "application/json" } }
  );
}

export const config = { runtime: "edge" };
