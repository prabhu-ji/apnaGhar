import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import OtpService from "../utils/otpService.js";

// Register function
const usernameRegex = /^[A-Za-z]{3,}$/;  
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/; 

export const register = async (req, res) => {
  const { username, email, password, userType } = req.body;

  if (!usernameRegex.test(username)) {
    return res.status(400).json({ message: "Username must contain only letters and be at least 3 characters long." });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      message: "Password must be at least 6 characters long and include at least one letter, one digit, and one special character." 
    });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: "A user with this email or username already exists!" });
    }
    2
    const otpResult = await OtpService.initiateOTP(email, "verification");
    
    if (!otpResult.success) {
      return res.status(500).json({ message: "Failed to send OTP email." });
    }

    return res.status(200).json({ message: "OTP sent successfully. Verify OTP to complete registration." });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Failed to send OTP! " + err.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp, password, username, userType } = req.body;

  try {
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

    const verificationResult = await OtpService.verifyOTP(email, otp);
    
    if (!verificationResult.valid) {
      return res.status(400).json({ message: verificationResult.message });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          userType: userType.toLowerCase(),
        },
      });

      await OtpService.clearOTP(email);

      return res.status(201).json({ message: "User registered successfully!" });
    } catch (createError) {
      if (createError.code === 'P2002') {
        return res.status(400).json({ 
          message: "A user with this email or username already exists!" 
        });
      }
      throw createError; 
    }
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Failed to verify OTP! " + err.message });
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