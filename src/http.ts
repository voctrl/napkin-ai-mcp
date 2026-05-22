#!/usr/bin/env node
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig } from "./config.js";
import { createNapkinMcpServer } from "./server.js";
import { StorageConfig } from "./storage/index.js";

const port = parseInt(process.env.PORT ?? "3000", 10);

const rawConfig = loadConfig();

const serverConfig = {
  napkinApiKey: rawConfig.napkinApiKey,
  napkinApiBaseUrl: rawConfig.napkinApiBaseUrl,
  pollingInterval: rawConfig.pollingInterval,
  maxWaitTime: rawConfig.maxWaitTime,
  defaults: rawConfig.defaults,
  ...(rawConfig.storage ? { storage: rawConfig.storage as StorageConfig } : {}),
};

const httpServer = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.url !== "/mcp" && req.url !== "/") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const mcpServer = createNapkinMcpServer(serverConfig);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  res.on("close", () => transport.close());

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res);
});

httpServer.listen(port, () => {
  console.log(`Napkin AI MCP server running on port ${port}`);
  console.log(`MCP endpoint: http://localhost:${port}/mcp`);
});
