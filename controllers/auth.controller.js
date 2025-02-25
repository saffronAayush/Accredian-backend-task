import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js"; // Adjust path as needed
import { TryCatch } from "../middlewares/error.middleware.js";
import { ErrorHandler } from "../utils/utility.js";

const JWT_SECRET = process.env.JWT_SECRET;
const frontendURL = process.env.FRONTEND_URL;

export const SignupLogin = async (req, _, __, profile, cb) => {
  try {
    const email = profile.emails[0]?.value;

    if (!email) {
      return cb(null, false, {
        message: "Google account does not have an email.",
      });
    }
    // Fetch user from DB
    let user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        name: true,
      },
    });
    if (!user) {
      let referralCode = null;
      if (req?.query?.state && typeof req.query?.state === "string") {
        try {
          const state = JSON.parse(req.query.state);
          referralCode = state.referralCode || null;
        } catch (error) {
          console.error("Error parsing state:", error);
        }
      }

      if (referralCode) {
        const referredByUser = await prisma.user.findUnique({
          where: { referralCode: referralCode },
          select: { id: true },
        });

        if (referredByUser) {
          // Update Referral status to 'completed' if a valid referral code exists
          const d = await prisma.referral.update({
            where: {
              id:
                (
                  await prisma.referral.findFirst({
                    where: {
                      userId: referredByUser.id,
                      referredEmail: email,
                      status: "pending",
                    },
                    select: { id: true }, // Select only the ID
                  })
                )?.id || 0, // Ensure an ID exists; otherwise, the update fails safely
            },
            data: { status: "completed" },
          });
        }
      }

      user = await prisma.user.create({
        data: {
          name: profile.displayName,
          email,
        },
      });
    }
    // Generate JWT and log in the new user
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return cb(null, { name: user.name, token });
  } catch (err) {
    cb(err);
  }
};

// callback funciton for google login sign up
export const oauth2_redirect = (req, res) => {
  if (!req.user.name) {
    return res.redirect(frontendURL); // client url
  }

  const token = req.user.token;
  res.cookie("token", token, {
    httpOnly: true, // Prevents client-side access to the token
    secure: true, // Ensures cookies are sent only over HTTPS (MUST be true in production)
    sameSite: "none", // Allows cross-origin requests (if frontend and backend are on different domains)
    // domain: "yourdomain.com", // Replace with your actual domain
    // path: "/",       // Makes the cookie accessible across the entire site
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  res.redirect(`${frontendURL}`);
};
