import prisma from '../lib/prisma.js';

export const createVisit = async (req, res) => {
  const { visitorId, postId, date, timeSlot, message } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true }, //idhr user owner hai
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingVisit = await prisma.visit.findFirst({
      where: {
        postId,
        visitorId,
        status: { in: ['PENDING', 'ACCEPTED'] },
        date: { gte: new Date() },
      },
    });

    if (existingVisit) {
      return res.status(400).json({
        message:
          'You already have a pending or accepted visit for this property',
      });
    }

    const existingSlotVisit = await prisma.visit.findFirst({
      where: {
        postId,
        date: new Date(date),
        timeSlot,
        status: 'ACCEPTED',
      },
    });

    if (existingSlotVisit) {
      return res
        .status(400)
        .json({ message: 'This time slot is already booked' });
    }

    const visit = await prisma.visit.create({
      data: {
        date: new Date(date),
        timeSlot,
        message,
        status: 'PENDING',
        post: { connect: { id: postId } },
        visitor: { connect: { id: visitorId } },
        owner: { connect: { id: post.userId } },
      },
      include: {
        post: { include: { user: true } },
        visitor: true,
        owner: true,
      },
    });

    const notification = await prisma.notification.create({
      data: {
        type: 'VISIT_REQUEST',
        message: `New visit request for ${post.title}`,
        read: false,
        user: { connect: { id: post.userId } },
        visit: { connect: { id: visit.id } },
      },
    });

    res.status(201).json({ visit, notification });
  } catch (err) {
    console.error('Error creating visit:', err);
    res
      .status(500)
      .json({ message: 'Failed to create visit', error: err.message });
  }
};

export const updateVisitStatus = async (req, res) => {
  const { visitId } = req.params;
  const { userId, status, responseMessage } = req.body;

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { post: true, visitor: true, owner: true },
    });

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found!' });
    }

    if (visit.ownerId !== userId) {
      return res.status(403).json({ message: 'Not authorized!' });
    }

    const updatedVisit = await prisma.visit.update({
      where: { id: visitId },
      data: { status, responseMessage },
      include: { post: true, visitor: true, owner: true },
    });

    const notification = await prisma.notification.create({
      data: {
        type: status === 'ACCEPTED' ? 'VISIT_ACCEPTED' : 'VISIT_REJECTED',
        message:
          status === 'ACCEPTED'
            ? `Your visit request for ${visit.post.title} has been accepted!`
            : `Your visit request for ${visit.post.title} has been rejected. ${responseMessage || ''}`,
        read: false,
        user: { connect: { id: visit.visitorId } },
        visit: { connect: { id: visit.id } },
      },
    });

    res.status(200).json({ visit: updatedVisit, notification });
  } catch (err) {
    console.error('Error updating visit:', err);
    res.status(500).json({ message: 'Failed to update visit status!' });
  }
};

export const getVisits = async (req, res) => {
  const userId = req.userId;

  try {
    const visits = await prisma.visit.findMany({
      where: { OR: [{ visitorId: userId }, { ownerId: userId }] },
      include: { post: true, visitor: true, owner: true },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(visits);
  } catch (err) {
    console.error('Error fetching visits:', err);
    res.status(500).json({ message: 'Failed to get visits!' });
  }
};

export const getPostVisits = async (req, res) => {
  const { postId } = req.params;

  try {
    const visits = await prisma.visit.findMany({
      where: { postId, status: 'ACCEPTED' },
      select: { date: true, timeSlot: true, status: true },
    });

    res.status(200).json(visits);
  } catch (err) {
    console.error('Error fetching post visits:', err);
    res.status(500).json({ message: 'Failed to get post visits!' });
  }
};

export const getVisitRequests = async (req, res) => {
  const sellerId = req.userId;

  try {
    const visitRequests = await prisma.visit.findMany({
      where: {
        ownerId: sellerId,
        status: 'PENDING',
      },
      include: {
        post: true,
        visitor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(visitRequests);
  } catch (err) {
    console.error('Error fetching visit requests:', err);
    res.status(500).json({ message: 'Failed to get visit requests!' });
  }
};

export const getAllVisitRequests = async (req, res) => {
  const sellerId = req.userId;

  try {
    const visitRequests = await prisma.visit.findMany({
      where: {
        ownerId: sellerId,
      },
      include: {
        post: true,
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    res.status(200).json(visitRequests);
  } catch (err) {
    console.error('Error fetching all visit requests:', err);
    res.status(500).json({ message: 'Failed to get visit requests!' });
  }
};

export const getVisitHistory = async (req, res) => {
  const sellerId = req.userId;

  try {
    const visitHistory = await prisma.visit.findMany({
      where: {
        ownerId: sellerId,
      },
      include: {
        post: true,
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    res.status(200).json(visitHistory);
  } catch (err) {
    console.error('Error fetching visit history:', err);
    res.status(500).json({ message: 'Failed to get visit history!' });
  }
};
