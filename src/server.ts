import "dotenv/config";
import { createApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const app = await createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on port ${port}`);
});
