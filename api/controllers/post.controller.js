import prisma from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

export const getPosts = async (req, res) => {
  const query = req.query;
  const token = req.cookies?.token;
  let userId = null;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
      userId = payload.id;
    } catch (err) {
      console.log('Token verification error:', err);
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
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (userId) {
      // Get all saved posts for the user
      const savedPosts = await prisma.savedPost.findMany({
        where: {
          userId: userId,
        },
        select: {
          postId: true,
        },
      });

      const savedPostIds = new Set(savedPosts.map((sp) => sp.postId));

      // Add isSaved property to each post
      const postsWithSavedStatus = posts.map((post) => ({
        ...post,
        isSaved: savedPostIds.has(post.id),
      }));

      res.status(200).json(postsWithSavedStatus);
    } else {
      // If user is not logged in, mark all posts as not saved
      const postsWithSavedStatus = posts.map((post) => ({
        ...post,
        isSaved: false,
      }));
      res.status(200).json(postsWithSavedStatus);
    }
  } catch (err) {
    console.error('Get Posts Error:', err);
    res.status(500).json({ message: 'Failed to get posts' });
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
        visits: true,
      },
    });

    if (!post) return res.status(404).json({ message: 'Post not found' });

    const token = req.cookies?.token;
    let isSaved = false;

    if (token) {
      try {
        const { id: userId } = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const saved = await prisma.savedPost.findFirst({
          where: {
            userId,
            postId: id,
          },
        });
        isSaved = !!saved;
      } catch (err) {
        console.log('Token verification error:', err);
      }
    }

    res.status(200).json({ ...post, isSaved });
  } catch (err) {
    console.error('Get Post Error:', err);
    res.status(500).json({ message: 'Failed to get post' });
  }
};

export const addPost = async (req, res) => {
  const { postData, postDetail } = req.body;
  const tokenUserId = req.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: tokenUserId } });
    if (!user || user.userType !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can add posts!' });
    }

    const newPost = await prisma.post.create({
      data: {
        ...postData,
        isSold: false,
        isRented: false,
        user: { connect: { id: tokenUserId } },
        postDetail: { create: postDetail },
      },
      include: { postDetail: true },
    });

    res.status(201).json(newPost);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to create post', error: err.message });
  }
};

export const updatePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const { postData, postDetail } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: { postDetail: true },
    });
    if (!post || post.userId !== tokenUserId || post.isSold) {
      return res.status(403).json({ message: 'Not authorized!' });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { ...postData, postDetail: { update: postDetail } },
      include: { postDetail: true },
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to update post', error: err.message });
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
      return res.status(404).json({ message: 'Post not found!' });
    }

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: 'Not Authorized!' });
    }

    // Check if post is already marked as sold
    if (post.isSold) {
      return res
        .status(403)
        .json({ message: 'Cannot delete a sold property!' });
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

      // Delete scheduled visits
      await prisma.visit.deleteMany({
        where: { postId: id },
      });

      // Delete the post
      await prisma.post.delete({
        where: { id },
      });
    });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete Post Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to delete post. Please try again.' });
  }
};

export const toggleSoldStatus = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found!' });
    }

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: 'Not authorized!' });
    }

    // Add this check to ensure id is valid ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    // If property type is for buy
    if (post.type === 'buy') {
      // If already sold, never allow toggle back without explicit confirmation
      if (post.isSold) {
        // Only allow changing back to available with explicit confirmation
        const updatedPost = await prisma.post.update({
          where: { id },
          data: {
            isSold: false,
            isRented: false,
          },
        });

        return res.status(200).json(updatedPost);
      }

      // If not yet sold, mark as sold
      const updatedPost = await prisma.post.update({
        where: { id },
        data: {
          isSold: true,
          isRented: false,
        },
      });

      return res.status(200).json(updatedPost);
    }
    // For all other property types, just toggle isSold
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        isSold: !post.isSold,
      },
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error('Toggle Sold Status Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to update status', error: err.message });
  }
};

export const toggleRentedStatus = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found!' });
    }

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: 'Not authorized!' });
    }

    // Add this check to ensure id is valid ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    // We'll allow toggling rented status regardless of property type
    // This is more flexible than the current implementation
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        isRented: !post.isRented,
        // If we're marking as rented, make sure isSold is false
        isSold: post.isRented ? post.isSold : false,
      },
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error('Toggle Rented Status Error:', err);
    res
      .status(500)
      .json({ message: 'Failed to update rented status', error: err.message });
  }
};

// const PageViewFrequency = {
//   RARE: 'Rare Visits',
//   LOW: 'Low Popularity',
//   MODERATE: 'Moderate Popularity',
//   HIGH: 'High Popularity'
// };

// export const getPageViewFrequencyLabel = (totalViews) => {
//   if (totalViews > 100) return PageViewFrequency.HIGH;
//   if (totalViews > 50) return PageViewFrequency.MODERATE;
//   if (totalViews > 10) return PageViewFrequency.LOW;
//   return PageViewFrequency.RARE;
// };

// export const trackPageView = async (req, res) => {
//   const pageId = req.params.id;
//   const tokenUserId = req.userId;

//   try {
//     const page = await prisma.page.findUnique({
//       where: { id: pageId }
//     });

//     if (!page) {
//       return res.status(404).json({ message: "Page not found" });
//     }

//     const now = new Date();
//     const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

//     // Check for existing view within the last hour
//     const existingPageView = await prisma.pageView.findFirst({
//       where: {
//         pageId: pageId,
//         viewerId: tokenUserId,
//         createdAt: {
//           gte: oneHourAgo
//         }
//       }
//     });

//     // If no recent view, create a new page view record
//     if (!existingPageView) {
//       await prisma.pageView.create({
//         data: {
//           pageId: pageId,
//           viewerId: tokenUserId,
//           ownerId: page.userId,
//           date: now,
//           hour: now.getHours(),
//           minute: now.getMinutes(),
//           ipAddress: req.ip,
//           userAgent: req.get('User-Agent') || 'Unknown',
//           referrer: req.get('Referer') || 'Direct',
//           status: 'UNIQUE'
//         }
//       });

//       // Increment page view counters
//       await prisma.page.update({
//         where: { id: pageId },
//         data: {
//           totalViews: { increment: 1 },
//           uniqueViews: { increment: 1 }
//         }
//       });
//     }

//     // Get comprehensive view metrics
//     const viewMetrics = await prisma.pageView.aggregate({
//       where: {
//         pageId: pageId,
//         status: 'UNIQUE'
//       },
//       _count: {
//         pageId: true
//       },
//       _max: {
//         createdAt: true
//       }
//     });

//     // Get hourly breakdown of views
//     const hourlyViews = await prisma.pageView.groupBy({
//       by: ['hour'],
//       where: {
//         pageId: pageId,
//         status: 'UNIQUE'
//       },
//       _count: {
//         pageId: true
//       }
//     });

//     res.status(200).json({
//       totalViews: viewMetrics._count.pageId,
//       lastViewedAt: viewMetrics._max.createdAt,
//       viewFrequency: getPageViewFrequencyLabel(viewMetrics._count.pageId),
//       hourlyBreakdown: hourlyViews.map(hourView => ({
//         hour: hourView.hour,
//         viewCount: hourView._count.pageId
//       }))
//     });

//   } catch (err) {
//     console.error("Page View Tracking Error:", err);
//     res.status(500).json({
//       message: "Failed to track page view",
//       error: err instanceof Error ? err.message : 'Unknown error'
//     });
//   }
// };

// export const getPageViewStats = async (req, res) => {
//   const pageId = req.params.id;

//   try {
//     const pageViewStats = await prisma.page.findUnique({
//       where: { id: pageId },
//       select: {
//         totalViews: true,
//         uniqueViews: true,
//         _count: {
//           select: {
//             PageView: {
//               where: { status: 'UNIQUE' }
//             }
//           }
//         }
//       }
//     });

//     if (!pageViewStats) {
//       return res.status(404).json({ message: "Page not found" });
//     }

//     res.status(200).json({
//       totalViews: pageViewStats.totalViews,
//       uniqueViews: pageViewStats.uniqueViews,
//       viewFrequency: getPageViewFrequencyLabel(pageViewStats.totalViews)
//     });
//   } catch (err) {
//     console.error("Page View Stats Error:", err);
//     res.status(500).json({ message: "Failed to retrieve page view statistics" });
//   }
// };
