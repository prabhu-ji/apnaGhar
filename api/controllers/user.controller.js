import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import OtpService from "../utils/otpService.js";

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to get users!" });
  }
};

// Get a single user by ID
export const getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Failed to get user!" });
  }
};

// Update user profile
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  const { currentPassword, password, avatar, email, ...inputs } = req.body;
  
  try {
    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found!" });
    }
    
    // Verify current password if there are changes to be made
    if (Object.keys(inputs).length > 0 || password || email || avatar) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to make changes!" });
      }
      
      const validPassword = await bcrypt.compare(currentPassword, currentUser.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Current password is incorrect!" });
      }
    }

    // Check username availability if it's being changed
    if (inputs.username && inputs.username !== currentUser.username) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          username: inputs.username,
          NOT: { id }
        },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken!" });
      }
    }

    // Handle email change with OTP verification
    if (email && email !== currentUser.email) {
      // Check if email is already in use
      const existingEmailUser = await prisma.user.findFirst({
        where: { 
          email,
          NOT: { id }
        },
      });

      if (existingEmailUser) {
        return res.status(400).json({ message: "Email is already in use!" });
      }

      // Send OTP to the new email
      const otpResult = await OtpService.initiateOTP(email, "update");
      if (!otpResult.success) {
        return res.status(500).json({ message: "Failed to send verification email!" });
      }

      // Update user with temporary email and other fields
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...inputs,
          ...(password && { password: await bcrypt.hash(password, 10) }),
          ...(avatar && { avatar }),
          tempEmail: email
        }
      });

      const { password: _, ...rest } = updatedUser;
      return res.status(200).json({
        ...rest,
        requiresOTP: true,
        tempEmail: email,
        message: "Please verify your new email address"
      });
    }

    // Update user without email change
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...inputs,
        ...(password && { password: await bcrypt.hash(password, 10) }),
        ...(avatar && { avatar })
      },
    });

    const { password: _, ...rest } = updatedUser;
    res.status(200).json(rest);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Failed to update user!" });
  }
};

// Verify email update with OTP
export const verifyEmailUpdate = async (req, res) => {
  const { id, email, otp } = req.body;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  try {
    // Get user and verify they requested this email change
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user || user.tempEmail !== email) {
      return res.status(400).json({ message: "Invalid email verification request!" });
    }

    // Verify the OTP
    const verificationResult = await OtpService.verifyOTP(email, otp);
    if (!verificationResult.valid) {
      return res.status(400).json({ message: verificationResult.message });
    }

    // Update the email after verification
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email: email,
        tempEmail: null  // Clear the temporary email
      }
    });

    // Clear the OTP after successful verification
    await OtpService.clearOTP(email);

    const { password, ...rest } = updatedUser;
    res.status(200).json(rest);
  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).json({ message: "Failed to verify email!" });
  }
};

// Save/unsave a post
export const savePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.userId;

    // Validate post and user
    const [post, user] = await Promise.all([
      prisma.post.findUnique({ where: { id: postId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }
    
    if (!user) {
      return res.status(403).json({ message: "Unauthorized user!" });
    }

    // Prevent sellers from saving other sellers' posts
    if (user.userType === "seller") {
      const postOwner = await prisma.user.findUnique({ where: { id: post.userId } });
      if (postOwner && postOwner.userType === "seller") {
        return res.status(403).json({
          message: "Login with a buyer account to interact with this post.",
        });
      }
    }

    // Toggle save status
    const existingSavedPost = await prisma.savedPost.findFirst({
      where: { userId, postId },
    });

    if (existingSavedPost) {
      await prisma.savedPost.delete({ where: { id: existingSavedPost.id } });
      return res.status(200).json({ message: "Post removed from saved list" });
    }

    await prisma.savedPost.create({ data: { userId, postId } });
    res.status(200).json({ message: "Post saved successfully" });
  } catch (error) {
    console.error("Error saving post:", error);
    res.status(500).json({ message: "Failed to save/unsave post!" });
  }
};

// Get user's posts and saved posts
export const profilePosts = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    // Use Promise.all to run queries concurrently
    const [userPosts, saved] = await Promise.all([
      prisma.post.findMany({ where: { userId: tokenUserId } }),
      prisma.savedPost.findMany({
        where: { userId: tokenUserId },
        include: { post: true },
      })
    ]);

    const savedPosts = saved.map((item) => item.post);
    res.status(200).json({ userPosts, savedPosts });
  } catch (err) {
    console.error("Error fetching profile posts:", err);
    res.status(500).json({ message: "Failed to get profile posts!" });
  }
};

// Get notification count
export const getNotificationCount = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const notificationCount = await prisma.chat.count({
      where: {
        userIDs: { hasSome: [tokenUserId] },
        NOT: { seenBy: { hasSome: [tokenUserId] } },
      },
    });

    res.status(200).json(notificationCount);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Failed to get notifications!" });
  }
};

// Delete user account
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  try {
    // Transaction to ensure all operations succeed or fail together
    await prisma.$transaction([
      // Delete user's saved posts
      prisma.savedPost.deleteMany({
        where: { userId: id }
      }),
      
      // Delete user's posts
      prisma.post.deleteMany({
        where: { userId: id }
      }),
      
      // Update chat userIDs to remove the user
      prisma.chat.updateMany({
        where: {
          userIDs: { hasSome: [id] }
        },
        data: {
          userIDs: {
            set: prisma.chat.findUnique({
              where: { id: "chatId" }
            }).userIDs.filter(userId => userId !== id)
          }
        }
      }),
      
      // Finally, delete the user
      prisma.user.delete({
        where: { id }
      })
    ]);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Failed to delete user!" });
  }
};