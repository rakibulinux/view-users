import "dotenv/config";

import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";

import { openApiSpec } from "./openapi";
import { usersRouter } from "./users";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/users", usersRouter);

// app.use(
//   (
//     err: unknown,
//     _req: express.Request,
//     res: express.Response,
//     _next: express.NextFunction,
//   ) => {
//     console.error(err);
//     res.status(500).json({ message: "Internal Server Error" });
//   },
// );

const port = Number(process.env.PORT ?? 3030);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
