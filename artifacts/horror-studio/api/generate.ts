export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = (process as any).env.HF_API_KEY || "";
  const { prompt } = await req.json();

  const res = await fetch(
    "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
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
    return new Response(JSON.stringify({ error: err }), { status: res.status, headers: { "Content-Type": "application/json" } });
  }

  const imageBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString("base64");
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  return new Response(JSON.stringify({ output: [dataUrl] }), {
    headers: { "Content-Type": "application/json" },
  });
}

export const config = { runtime: "edge" };
