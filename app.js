import "dotenv/config";
import express from "express";
import passport from "passport";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { errorMiddleware, TryCatch } from "./middlewares/error.middleware.js";
import { SignupLogin } from "./controllers/auth.controller.js";

// Constants ***********************************************************
const app = express();
const port = process.env.PORT || 3000;
const serverURL = process.env.SERVER_URL;
const frontendURL = process.env.FRONTEND_URL;
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = `${serverURL}/api/v1/auth/google/callback`;

// Middlewares ***********************************************************
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: frontendURL, // Allow frontend domain
    credentials: true, // Allow cookies
  })
);
app.use(passport.initialize());
passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
      passReqToCallback: true,
    },
    SignupLogin
  )
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
