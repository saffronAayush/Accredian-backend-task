// import jwt from "jsonwebtoken";
// import { prisma } from "../prismaClient.js"; // Adjust path as needed
// import { TryCatch } from "../middlewares/error.middleware.js";
// import { ErrorHandler } from "../utils/utility.js";

// const frontendURL = process.env.FRONTEND_URL;

// export const SignupLogin = async (req, _, __, profile, cb) => {
//   try {
//     const email = profile.emails[0]?.value;

//     if (!email) {
//       return cb(null, false, {
//         message: "Google account does not have an email.",
//       });
//     }
//     // Fetch user from DB
//     let user = await prisma.user.findUnique({
//       where: { email: email },
//       select: {
//         id: true,
//         name: true,
//       },
//     });
//     if (!user) {
//       let referralCode = null;
//       if (req?.query?.state && typeof req.query?.state === "string") {
//         try {
//           const state = JSON.parse(req.query.state);
//           referralCode = state.referralCode || null;
//         } catch (error) {
//           console.error("Error parsing state:", error);
//         }
//       }

//       if (referralCode) {
//         const referredByUser = await prisma.user.findUnique({
//           where: { referralCode: referralCode },
//           select: { id: true },
//         });

//         if (referredByUser) {
//           // Update Referral status to 'completed' if a valid referral code exists
//           const d = await prisma.referral.update({
//             where: {
//               id:
//                 (
//                   await prisma.referral.findFirst({
//                     where: {
//                       userId: referredByUser.id,
//                       referredEmail: email,
//                       status: "pending",
//                     },
//                     select: { id: true }, // Select only the ID
//                   })
//                 )?.id || 0, // Ensure an ID exists; otherwise, the update fails safely
//             },
//             data: { status: "completed" },
//           });
//         }
//       }

//       user = await prisma.user.create({
//         data: {
//           name: profile.displayName,
//           email,
//         },
//       });
//     }
//     // Generate JWT and log in the new user
//     const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
//       expiresIn: "7d",
//     });
//     return cb(null, { name: user.name, token });
//   } catch (err) {
//     cb(err);
//   }
// };

// // callback funciton for google login sign up
// export const oauth2_redirect = (req, res) => {
//   if (!req.user.name) {
//     return res.redirect(frontendURL); // client url
//   }

//   const token = req.user.token;
//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: true,
//     sameSite: "None",
//   });
//   res.redirect(`${frontendURL}`);
// };

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js";
const JWT_SECRET = process.env.JWT_SECRET;

export const signuplogin = async (req, res) => {
  try {
    console.log("in singup");
    const { email, password, token } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    console.log("first ");

    let user = await prisma.user.findUnique({
      where: { email },
    });

    console.log("sefcon ", user);
    if (user) {
      // User exists, check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
    } else {
      // New user, check for referral code
      let referralCode = token;
      let referredByUser = null;

      if (referralCode) {
        referredByUser = await prisma.user.findUnique({
          where: { referralCode },
        });

        // if (referredByUser) {
        //   const remp = await prisma.referral.create({
        //     data: {
        //       userId: referredByUser.id,
        //       referredEmail: email,
        //       status: "pending",
        //     },
        //   });
        //   console.log("refreal ", remp);
        // }

        if (referredByUser) {
          // Update Referral status to 'completed' if a valid referral code exists
          const d = await prisma.referral.update({
            where: {
              id:
                (
                  await prisma.referral.findFirst({
                    where: {
                      userId: referredByUser.id,
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

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });
    }

    // Generate JWT
    const tokentosend = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.status(200).json({
      message: "User logged in successfully",
      name: user.name,
      token: tokentosend,
    });
  } catch (error) {
    console.error("Error in signuplogin:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};
