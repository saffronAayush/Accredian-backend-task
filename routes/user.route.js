import express from "express";
import { getUserDetails, referCourse } from "../controllers/user.controller.js";
import { isUserLoggedIn } from "../middlewares/auth.middleware.js";
const app = express.Router();

app.get("/info", getUserDetails);
app.post("/refercourse", isUserLoggedIn, referCourse);

export default app;
