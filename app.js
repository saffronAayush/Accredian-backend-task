import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import { errorMiddleware, TryCatch } from "./middlewares/error.middleware.js";

// Constants ***********************************************************
const app = express();
const port = process.env.PORT || 3000;
const frontendURL = process.env.FRONTEND_URL;

// Middlewares ***********************************************************
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: frontendURL,
    credentials: true,
  })
);

// Routes ************************************************************
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);

app.get("/", (_, res) => {
  res.send("home route working");
});

app.use(errorMiddleware); // error middleware *****************************

app.listen(port, () => {
  console.log("App is listening on port ", port);
});
