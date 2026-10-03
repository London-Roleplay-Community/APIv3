import assert from "node:assert/strict";
import { test } from "node:test";
import http from "node:http";
import { createApp } from "../dist/app.js";

async function withServer(callback) {
  const server = http.createServer(await createApp());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("GET / returns API information", () =>
  withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      name: "APIv3",
      status: "ok",
      health: "/api/v1/health",
    });
  }));

test("GET /api/v1/health returns a healthy response", () =>
  withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
}));