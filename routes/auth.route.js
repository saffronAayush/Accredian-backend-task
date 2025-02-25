import express from "express";
import passport from "passport";
import { oauth2_redirect } from "../controllers/auth.controller.js";
const app = express.Router();

app.get("/", (req, res) => {
  res.send("auth router working");
});

// for google signup or login ***********************************************
app.get("/signuplogin", (req, res, next) => {
  const { referralCode } = req.query;
  // Extract referral code from query params
  const state = JSON.stringify({ referralCode });
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state,
  })(req, res, next);
});
// callback url for google login ******
app.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}`,
    session: false,
  }),
  oauth2_redirect
);

export default app;
