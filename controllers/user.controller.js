import { prisma } from "../prismaClient.js";
import { TryCatch } from "../middlewares/error.middleware.js";
import { ErrorHandler } from "../utils/utility.js";
import { sendMail } from "../utils/features.js";

// **GET USER DETAILS**    **********************************************************************************************
export const getUserDetails = TryCatch(async (req, res, next) => {
  const userId = req.user;

  // Fetch user from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
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
    user: { totalReferrals, completedReferrals },
  });
});

// Refers a Course ******************************************************************************************************
export const referCourse = TryCatch(async (req, res, next) => {
  const { receiverName, email, course } = req.body;
  const referrerId = req.user;

  const existingReferral = await prisma.referral.findFirst({
    where: {
      referredEmail: email,
      userId: referrerId,
      coursePlan: course,
    },
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
  } else {
    return next(new ErrorHandler(400, "Cannot refer to an existing user"));
  }

  const user = await prisma.user.findUnique({
    where: { id: referrerId },
    select: {
      referralCode: true,
      email: true,
    },
  });

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
       <p><strong>${user.email}</strong> has referred you to enroll in our <strong>${course}</strong> course!</p>
       <p>This is a great opportunity to expand your knowledge and skills. Don't miss out!</p>
       <p>Click on the button bellow to enroll and win refferal cashback</p>
       <a href="${process.env.FRONTEND_URL}?signuplogin=true&referralCode=${user.referralCode}" class="button">Enroll Now</a>
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
