# APIv3

Production-ready native ES modules TypeScript REST API starter for Azure App Service.

## Local development

### Prerequisites

- Node.js 20 or newer
- pnpm 12.8.1 (Corepack can install it automatically)

Install dependencies and start the development server:

```bash
corepack enable
pnpm install
copy .env.example .env
pnpm run dev
```

The server loads `.env` automatically for local development. The file is
ignored by Git, so do not commit secrets. Set `PORT` there or override it in
the shell:

```bash
PORT=8080 pnpm run dev
```

## API

API information:

```bash
curl http://localhost:3000/
```

Health check:

```bash
curl http://localhost:3000/api/v1/health
```

The root response points to the versioned health endpoint:

```json
{
  "name": "APIv3",
  "status": "ok",
  "health": "/api/v1/health"
}
```

Example response:

```json
{
  "status": "ok"
}
```

## File-based routes

Routes are defined by `route.ts` files under `src/routes`. Directory names
become URL segments, and folders in square brackets become route parameters:

```text
src/routes/api/v1/health/route.ts       -> GET /api/v1/health
src/routes/api/v1/users/[id]/route.ts  -> GET /api/v1/users/:id
```

Export one or more HTTP method handlers from each route file:

```ts
import type { RequestHandler } from "express";

export const GET: RequestHandler = (request, response) => {
  response.json({ userId: request.params.id });
};
```

Supported methods are `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`. Routes are
loaded from `src/routes` during development and compiled `dist/routes` in
production, so the same structure works locally and on Azure App Service.

## Scripts

- `pnpm run dev` - run the TypeScript app with automatic reloads
- `pnpm run build` - type-check and compile to `dist/`
- `pnpm start` - run the compiled production app
- `pnpm test` - build and run the smoke test

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port. Azure App Service provides this value at runtime. |
| `NODE_ENV` | `development` | Runtime environment name. |

`process.env` receives values from the local `.env` file because the server
loads `dotenv` at startup. In Azure, configure the same values under
**Configuration > Application settings** instead of deploying a `.env` file;
Azure injects those settings into `process.env`.

## Azure App Service

The included GitHub Actions workflow builds the app, runs the smoke test,
removes development dependencies, and deploys the compiled app with its
production dependencies. It preserves the existing app name
(`jaxonapiv3`) and publish-profile secret.

Configure these settings in the Azure portal:

1. Set the App Service stack to Node.js 20 LTS or newer.
2. Set the startup command to `npm start` (or leave it blank if the Node
   runtime detects the `start` script).
3. Add `NODE_ENV=production` under **Configuration > Application settings**.
4. Keep the platform-provided `PORT` value; the server binds to it
   automatically.

The workflow deploys on pushes to `main` and can also be started manually.
