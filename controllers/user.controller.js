import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { prisma } from "../prismaClient.js";
import { TryCatch } from "../middlewares/error.middleware.js";
import { ErrorHandler } from "../utils/utility.js";

const JWT_SECRET = process.env.JWT_SECRET;

// 4 **GET USER DETAILS**
export const getUserDetails = TryCatch(async (req, res, next) => {
  const userId = req.user;

  // Fetch user from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!user) {
    return next(new ErrorHandler(400, "User not found"));
  }

  // Fetch referral counts
  const totalReferrals = await prisma.referral.count({
    where: { userId },
  });

  const completedReferrals = await prisma.referral.count({
    where: {
      userId,
      status: "completed",
    },
  });

  // Send Response
  res.status(200).json({
    message: "User details fetched successfully",
    user: { ...user, totalReferrals, completedReferrals },
  });
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // Your Gmail password or App Password
  },
});

// Function to send an email
const sendMail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: text,
    };

    const result = await transporter.sendMail(mailOptions);

    return result;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};

export const referCourse = TryCatch(async (req, res, next) => {
  const { referrerName, receiverName, email, course } = req.body;
  const referrerId = req.user;

  // Check if the email already exists in the User table
  const existingUser = await prisma.user.findUnique({
    where: { email: email },
    select: { id: true },
  });

  if (existingUser) {
    return next(new ErrorHandler(400, "Cannot refer to an existing user"));
  }
  const existingReferral = await prisma.referral.findUnique({
    where: { referredEmail: email },
  });

  if (!existingReferral) {
    // Create a new referral entry
    await prisma.referral.create({
      data: {
        userId: referrerId,
        referredEmail: email,
        coursePlan: course,
        status: "pending",
      },
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: referrerId },
    select: {
      referralCode: true,
    },
  });
  console.log("user refreal", user.referralCode);
  // Generate HTML email content
  const htmlContent = `
 <!DOCTYPE html>
 <html>
 <head>
   <style>
     body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
     .container { max-width: 600px; background: #ffffff; margin: 20px auto; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
     .header { text-align: center; padding: 10px; background: #007BFF; color: #ffffff; font-size: 24px; font-weight: bold; }
     .content { text-align: center; padding: 20px; font-size: 16px; color: #333; }
     .button { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #007BFF; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; }
     .footer { text-align: center; padding: 10px; font-size: 14px; color: #777; border-top: 1px solid #ddd; margin-top: 20px; }
   </style>
 </head>
 <body>

   <div class="container">
     <div class="header">
       📢 Course Referral Invitation!
     </div>

     <div class="content">
       <p>Hi <strong>${receiverName}</strong>,</p>
       <p><strong>${referrerName}</strong> has referred you to enroll in our <strong>${course}</strong> course!</p>
       <p>This is a great opportunity to expand your knowledge and skills. Don't miss out!</p>
       <p>Click on the button bellow to enroll and win refferal cashback</p>
       <a href="${process.env.SERVER_URL}/api/v1/auth/signuplogin?referralCode=${user.referralCode}" class="button">Enroll Now</a>
     </div>

     <div class="footer">
       <p>Powered by <strong>Accredian</strong></p>
       <p>&copy; 2025 Accredian. All rights reserved.</p>
     </div>
   </div>

 </body>
 </html>
`;

  // Send HTML email
  await sendMail(email, "You're Invited!", htmlContent);
  console.log("Mail sent");

  res.status(200).json({ message: "Referral has been sent successfully" });
});
