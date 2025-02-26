import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // Your Gmail password or App Password
  },
});

// Function to send an email
export const sendMail = async (to, subject, text) => {
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
