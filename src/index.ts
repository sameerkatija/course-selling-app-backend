import express, { Express } from "express";
import { PORT } from "./config/env";
import cors from "cors";
import indexRoute from "./routes/index";
const app: Express = express();
app.use(cors());
app.use(express.json());

app.use("/api", indexRoute);
app.listen(PORT, () => {
  console.log(`App is listening on http://localhost:${PORT}`);
});
