import express, {
  type ErrorRequestHandler,
  type RequestHandler,
  type Router,
} from "express";
import { readdir } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const routeMethods = ["DELETE", "GET", "PATCH", "POST", "PUT"] as const;
type RouteMethod = (typeof routeMethods)[number];
type RouteModule = Partial<Record<RouteMethod, RequestHandler>>;

const routesDirectory = fileURLToPath(new URL("./routes", import.meta.url));

async function findRouteFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return findRouteFiles(entryPath);
      }

      return entry.name === "route.js" || entry.name === "route.ts"
        ? [entryPath]
        : [];
    }),
  );

  return files.flat();
}

function routePath(routeFile: string): string {
  const routeDirectory = dirname(routeFile);
  const relativeDirectory = relative(routesDirectory, routeDirectory);

  if (!relativeDirectory) {
    return "/";
  }

  const segments = relativeDirectory.split(sep).map((segment) =>
    segment.startsWith("[") && segment.endsWith("]")
      ? `:${segment.slice(1, -1)}`
      : segment,
  );

  return `/${segments.join("/")}`;
}

async function registerRoutes(router: Router): Promise<void> {
  let routeFiles: string[] = [];

  try {
    routeFiles = await findRouteFiles(routesDirectory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  for (const routeFile of routeFiles.sort()) {
    const routeModule = (await import(pathToFileURL(routeFile).href)) as RouteModule;
    const path = routePath(routeFile);

    for (const method of routeMethods) {
      const handler = routeModule[method];

      if (handler) {
        router[method.toLowerCase() as Lowercase<RouteMethod>](path, handler);
      }
    }
  }
}

export async function createApp() {
  const app = express();
  const router = express.Router();

  app.disable("x-powered-by");
  app.use(express.json());
  app.get("/", (_request, response) => {
    response.json({
      name: "APIv3",
      status: "ok",
      health: "/api/v1/health",
    });
  });
  await registerRoutes(router);
  app.use(router);

  const notFoundHandler: RequestHandler = (_request, response) => {
    response.status(404).json({ error: "Not Found" });
  };

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  };

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
