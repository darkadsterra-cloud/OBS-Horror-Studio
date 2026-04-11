import app from "./app";
import { logger } from "./lib/logger";
import { WebSocketServer } from "ws";
import { registerWsClient } from "./routes/stream";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

const wss = new WebSocketServer({ server, path: "/api/stream/ws" });

wss.on("connection", (ws, req) => {
  logger.info({ url: req.url }, "WebSocket client connected");
  registerWsClient(ws);
  ws.on("error", (err) => logger.error({ err }, "WebSocket error"));
});
