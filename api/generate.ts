export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { prompt } = await req.json();
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true&seed=${seed}`;
  return new Response(
    JSON.stringify({ output: [imageUrl] }),
    { headers: { "Content-Type": "application/json" } }
  );
}
export const config = { runtime: "edge" };
