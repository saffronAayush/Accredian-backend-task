import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js";
const JWT_SECRET = process.env.JWT_SECRET;

export const signuplogin = async (req, res) => {
  try {
    const { email, password, token } = req.body;
    console.log("in");
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });
    console.log("user exists ", user);
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
      token: tokentosend,
    });
  } catch (error) {
    console.error("Error in signuplogin:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};
