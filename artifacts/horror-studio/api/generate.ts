export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = (process as any).env.HF_API_KEY || "";
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

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: err }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const imageBuffer = await res.arrayBuffer();
  const uint8 = new Uint8Array(imageBuffer);
  let binary = "";
  uint8.forEach((b) => { binary += String.fromCharCode(b); });
  const base64 = btoa(binary);
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  return new Response(JSON.stringify({ output: [dataUrl] }), {
    headers: { "Content-Type": "application/json" },
  });
}

export const config = { runtime: "edge" };
