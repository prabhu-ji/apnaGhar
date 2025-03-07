import prisma from "../lib/prisma.js";

export const createRating = async (req, res) => {
  const { visitId, rating, comment } = req.body;
  const userId = req.userId;

  try {
    // Verify the visit
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { post: true }
    });

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    // Check if visit is completed and property is not sold/rented
    if (visit.status !== 'ACCEPTED' || visit.post.isSold || visit.post.isRented) {
      return res.status(400).json({ message: "Cannot rate this property" });
    }

    // Check if rating already exists
    const existingRating = await prisma.rating.findUnique({
      where: {
        postId_userId_visitId: {
          postId: visit.postId,
          userId: userId,
          visitId: visitId
        }
      }
    });

    if (existingRating) {
      return res.status(400).json({ message: "You have already rated this property" });
    }

    // Create rating
    const newRating = await prisma.rating.create({
      data: {
        postId: visit.postId,
        userId: userId,
        visitId: visitId,
        rating: parseFloat(rating),
        comment: comment
      }
    });

    // Calculate average rating for the post
    const postRatings = await prisma.rating.findMany({
      where: { postId: visit.postId }
    });

    const averageRating = postRatings.length > 0 
      ? postRatings.reduce((sum, r) => sum + r.rating, 0) / postRatings.length 
      : 0;

    // Optional: Update post with average rating (if you want to store it)
    await prisma.post.update({
      where: { id: visit.postId },
      data: { 
        averageRating: averageRating,
        totalRatings: postRatings.length
      }
    });

    res.status(201).json({ 
      rating: newRating, 
      averageRating: averageRating,
      totalRatings: postRatings.length
    });

  } catch (err) {
    console.error("Error creating rating:", err);
    res.status(500).json({ message: "Failed to create rating", error: err.message });
  }
};

export const getPostRatings = async (req, res) => {
  const { postId } = req.params;

  try {
    const ratings = await prisma.rating.findMany({
      where: { postId },
      include: { 
        user: {
          select: { 
            id: true, 
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    res.status(200).json({ 
      ratings, 
      averageRating,
      totalRatings: ratings.length
    });
  } catch (err) {
    console.error("Error fetching ratings:", err);
    res.status(500).json({ message: "Failed to get ratings", error: err.message });
  }
};

export const getUserVisitEligibility = async (req, res) => {
  const { postId } = req.params;
  const userId = req.userId;

  try {
    // Find a completed visit for this user and post
    const visit = await prisma.visit.findFirst({
      where: {
        postId: postId,
        visitorId: userId,
        status: 'ACCEPTED'
      }
    });

    // Check if rating already exists
    const existingRating = visit ? await prisma.rating.findUnique({
      where: {
        postId_userId_visitId: {
          postId: postId,
          userId: userId,
          visitId: visit.id
        }
      }
    }) : null;

    res.status(200).json({
      isEligible: !!visit && !existingRating,
      visitId: visit?.id
    });
  } catch (err) {
    console.error("Error checking rating eligibility:", err);
    res.status(500).json({ message: "Failed to check eligibility", error: err.message });
  }
};