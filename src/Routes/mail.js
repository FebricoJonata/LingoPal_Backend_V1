import express from "express";
import nodemailer from "nodemailer";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const emailRouter = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_GMAIL_USERNAME,
    pass: process.env.SMTP_GMAIL_PASSKEY,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Error configuring email transporter:", error.message);
  } else {
    console.log("Email transporter configured successfully.");
  }
});

// Email sending endpoint
emailRouter.post("/send-verification", async (req, res) => {
  const { to, verificationUrl } = req.body;

  if (!to || !verificationUrl) {
    return res.status(400).json({
      status: 400,
      error: "Missing required fields: 'to' and 'verificationUrl'.",
    });
  }

  try {
    // Email options
    const mailOptions = {
      from: `"No Reply - [LingoPal]" <${process.env.SMTP_GMAIL_USERNAME}>`,
      to,
      subject: "Verify Your Email Address",
      html: `<p>Click the link below to verify your email:</p>
             <a href="${verificationUrl}">Click here to verify account!</a>`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Respond with success
    return res.status(200).json({
      status: 200,
      message: `Verification email sent to ${to}`,
    });
  } catch (error) {
    console.error("Error sending email:", error.message);

    // Respond with failure
    return res.status(500).json({
      status: 500,
      error: "Failed to send verification email.",
    });
  }
});

export default emailRouter;
