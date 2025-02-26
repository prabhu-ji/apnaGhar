import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import nodemailer from "nodemailer";

// Function to send OTP email
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP sent successfully");
    return true;
  } catch (err) {
    console.error("Error sending OTP email:", err);
    return false;
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp, password, username, userType } = req.body;

  try {
    // First check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      // Be vague about which field exists for security
      return res.status(400).json({ 
        message: "A user with this email or username already exists!" 
      });
    }

    // Then verify OTP
    const storedOtp = await prisma.otp.findUnique({
      where: { email }
    });

    if (!storedOtp) {
      return res.status(400).json({ message: "No OTP found for this email!" });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP!" });
    }

    if (new Date(storedOtp.otpExpires) < new Date()) {
      await prisma.otp.delete({ where: { email } });
      return res.status(400).json({ message: "OTP has expired!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with a try-catch specifically for unique constraint errors
    try {
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          userType: userType.toLowerCase(),
        },
      });

      // Delete OTP after successful registration
      await prisma.otp.delete({ where: { email } });

      return res.status(201).json({ message: "User registered successfully!" });
    } catch (createError) {
      if (createError.code === 'P2002') {
        return res.status(400).json({ 
          message: "A user with this email or username already exists!" 
        });
      }
      throw createError; // Re-throw other errors
    }
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Failed to verify OTP! " + err.message });
  }
};

// Also update your register function to include this check
export const register = async (req, res) => {
  const { username, email, password, userType } = req.body;

  try {
    // Check for existing user before sending OTP
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: "A user with this email or username already exists!" 
      });
    }

    // Rest of your registration code...
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otp.upsert({
      where: { email },
      update: {
        otp,
        otpExpires: new Date(Date.now() + 10 * 60 * 1000)
      },
      create: {
        email,
        otp,
        otpExpires: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    const otpSent = await sendOtpEmail(email, otp);
    if (!otpSent) {
      await prisma.otp.delete({ where: { email } });
      return res.status(500).json({ message: "Failed to send OTP email." });
    }

    return res.status(200).json({ 
      message: "OTP sent successfully. Verify OTP to complete registration." 
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Failed to send OTP! " + err.message });
  }
};









// Login function
export const login = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt for username:", username);

  if (!username || !password) {
    console.log("Missing credentials:", { username: !!username, password: !!password });
    return res.status(400).json({ message: "Username and password are required!" });
  }

  try {
    console.log("Finding user in database...");
    const user = await prisma.user.findUnique({ 
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        avatar: true,
        userType: true,
        createdAt: true,
        chatIDs: true
      }
    });

    if (!user) {
      console.log("User not found in DB:", username);
      return res.status(400).json({ message: "Invalid Credentials!" });
    }

    console.log("User found, verifying password...");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password Match:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password for user:", username);
      return res.status(400).json({ message: "Invalid Credentials!" });
    }

    console.log("Password verified, generating token...");
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );
    console.log("Token generated successfully");

    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = user;

    console.log("Setting cookie and sending response...");
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    return res.status(200).json({ 
      message: "Login successful", 
      user: userWithoutPassword 
    });
  } catch (err) {
    console.error("Login error details:", {
      error: err.message,
      stack: err.stack,
      name: err.name
    });
    return res.status(500).json({ message: "Server error!", error: err.message });
  }
};

// Logout function
export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};
