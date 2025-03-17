import prisma from '../lib/prisma.js';

export const addMessage = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.chatId;
  const { text } = req.body;

  try {
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty!' });
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userIDs: { has: tokenUserId },
      },
    });

    if (!chat) return res.status(404).json({ message: 'Chat not found!' });

    const message = await prisma.message.create({
      data: {
        text,
        chatId,
        userId: tokenUserId,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: {
        seenBy: { set: [tokenUserId] },
        lastMessage: text,
      },
    });

    res.status(201).json(message);
  } catch (err) {
    console.error('Error adding message:', err);
    res.status(500).json({ message: 'Failed to add message!' });
  }
};
