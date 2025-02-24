// utils/otpService.js
import nodemailer from "nodemailer";
import prisma from "../lib/prisma.js";

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class OtpService {
  // Generate OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email
  static async sendOtpEmail(email, otp, purpose = "verification") {
    const subjects = {
      verification: "Email Verification OTP",
      update: "Email Update Verification",
      reset: "Password Reset OTP"
    };

    const messages = {
      verification: `Your verification OTP code is: ${otp}`,
      update: `Your OTP code for email update is: ${otp}`,
      reset: `Your password reset OTP code is: ${otp}`
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subjects[purpose] || subjects.verification,
      text: `${messages[purpose] || messages.verification}. This OTP will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">OTP Verification</h2>
          <p style="font-size: 16px; color: #666;">
            ${messages[purpose] || messages.verification}
          </p>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; margin: 20px 0;">
            <strong>${otp}</strong>
          </div>
          <p style="color: #666; font-size: 14px;">
            This OTP will expire in 10 minutes.<br>
            If you didn't request this OTP, please ignore this email.
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (err) {
      console.error("Error sending OTP email:", err);
      return false;
    }
  }

  // Store OTP in database
  static async storeOTP(email, otp) {
    try {
      await prisma.otp.upsert({
        where: { email },
        update: {
          otp,
          otpExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        },
        create: {
          email,
          otp,
          otpExpires: new Date(Date.now() + 10 * 60 * 1000)
        }
      });
      return true;
    } catch (err) {
      console.error("Error storing OTP:", err);
      return false;
    }
  }

  // Verify OTP
  static async verifyOTP(email, otp) {
    try {
      const storedOtp = await prisma.otp.findUnique({
        where: { email }
      });

      if (!storedOtp) {
        return { valid: false, message: "No OTP found for this email" };
      }

      if (storedOtp.otp !== otp) {
        return { valid: false, message: "Invalid OTP" };
      }

      if (new Date(storedOtp.otpExpires) < new Date()) {
        await prisma.otp.delete({ where: { email } });
        return { valid: false, message: "OTP has expired" };
      }

      return { valid: true, message: "OTP verified successfully" };
    } catch (err) {
      console.error("Error verifying OTP:", err);
      return { valid: false, message: "Error verifying OTP" };
    }
  }

  // Generate and send OTP
  static async initiateOTP(email, purpose = "verification") {
    try {
      const otp = this.generateOTP();
      const stored = await this.storeOTP(email, otp);
      
      if (!stored) {
        throw new Error("Failed to store OTP");
      }

      const sent = await this.sendOtpEmail(email, otp, purpose);
      if (!sent) {
        await prisma.otp.delete({ where: { email } });
        throw new Error("Failed to send OTP email");
      }

      return { success: true, message: "OTP sent successfully" };
    } catch (err) {
      console.error("Error initiating OTP:", err);
      return { success: false, message: err.message };
    }
  }

  // Clean up OTP after successful verification
  static async clearOTP(email) {
    try {
      await prisma.otp.delete({ where: { email } });
      return true;
    } catch (err) {
      console.error("Error clearing OTP:", err);
      return false;
    }
  }
}

export default OtpService;