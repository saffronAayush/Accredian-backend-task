import express from "express";
import { signuplogin } from "../controllers/auth.controller.js";
const app = express.Router();

app.post("/signuplogin", signuplogin);

export default app;
