import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const getPosts = async (req, res) => {
  const query = req.query;
  const token = req.cookies?.token;
  let userId = null;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
      userId = payload.id;
    } catch (err) {
      console.log("Token verification error:", err);
    }
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city || undefined,
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: parseInt(query.bedroom) || undefined,
        price: {
          gte: parseInt(query.minPrice) || undefined,
          lte: parseInt(query.maxPrice) || undefined,
        },
      },
    });

    if (userId) {
      // Get all saved posts for the user
      const savedPosts = await prisma.savedPost.findMany({
        where: {
          userId: userId
        },
        select: {
          postId: true
        }
      });

      const savedPostIds = new Set(savedPosts.map(sp => sp.postId));

      // Add isSaved property to each post
      const postsWithSavedStatus = posts.map(post => ({
        ...post,
        isSaved: savedPostIds.has(post.id)
      }));

      res.status(200).json(postsWithSavedStatus);
    } else {
      // If user is not logged in, mark all posts as not saved
      const postsWithSavedStatus = posts.map(post => ({
        ...post,
        isSaved: false
      }));
      res.status(200).json(postsWithSavedStatus);
    }
  } catch (err) {
    console.error("Get Posts Error:", err);
    res.status(500).json({ message: "Failed to get posts" });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
        visits: true, // Include scheduled visits
      },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    const token = req.cookies?.token;
    let isSaved = false;

    if (token) {
      try {
        const { id: userId } = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const saved = await prisma.savedPost.findUnique({
          where: {
            userId_postId: { postId: id, userId },
          },
        });
        isSaved = !!saved;
      } catch (err) {
        console.log("Token verification error:", err);
      }
    }

    res.status(200).json({ ...post, isSaved });
  } catch (err) {
    console.error("Get Post Error:", err);
    res.status(500).json({ message: "Failed to get post" });
  }
};


export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = await prisma.post.create({
      data: {
        ...body.postData,
        userId: tokenUserId,
        postDetail: {
          create: body.postDetail,
        },
      },
    });
    res.status(200).json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const body = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: { postDetail: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }
    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not authorized!" });
    }
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...body.postData,
        postDetail: {
          update: body.postDetail,
        },
      },
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Update Post Error:", err);
    res.status(500).json({ message: "Failed to update post" });
  }
};


export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    // First check if post exists and user is authorized
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    // Delete in transaction to ensure both records are deleted or none
    await prisma.$transaction(async (prisma) => {
      // Delete post details first
      if (post.postDetail) {
        await prisma.postDetail.delete({
          where: { postId: id },
        });
      }

      // Delete saved posts references
      await prisma.savedPost.deleteMany({
        where: { postId: id },
      });

      // Delete the post
      await prisma.post.delete({
        where: { id },
      });
    });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete Post Error:", err);
    res.status(500).json({ message: "Failed to delete post. Please try again." });
  }
};
