import express from "express";
import passport from "passport";
import { signuplogin } from "../controllers/auth.controller.js";
const app = express.Router();

app.get("/", (req, res) => {
  res.send("auth router working");
});

// for google signup or login ***********************************************
app.post("/signuplogin", signuplogin);
// callback url for google login ******
// app.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     failureRedirect: `${process.env.CLIENT_URL}`,
//     session: false,
//   }),
//   oauth2_redirect
// );

export default app;
