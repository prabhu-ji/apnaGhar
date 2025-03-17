import prisma from '../lib/prisma.js';

export const getChats = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    // Only get chats that have at least one message
    const chats = await prisma.chat.findMany({
      where: {
        userIDs: { has: tokenUserId },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get only the latest message
        },
      },
    });

    // Filter out chats with no messages
    const chatsWithMessages = chats.filter((chat) => chat.messages.length > 0);

    const userIdsToFetch = chatsWithMessages
      .flatMap((chat) => chat.userIDs)
      .filter((id) => id !== tokenUserId);
    const uniqueUserIds = [...new Set(userIdsToFetch)];

    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, username: true, avatar: true },
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const formattedChats = chatsWithMessages
      .map((chat) => {
        const receiverId = chat.userIDs.find((id) => id !== tokenUserId);
        const receiver = userMap[receiverId] || null;

        // Only include chats with valid receivers
        if (!receiver) return null;

        return {
          ...chat,
          receiver,
          lastMessage: chat.messages[0]?.text || '',
        };
      })
      .filter(Boolean); // Remove null entries

    res.status(200).json(formattedChats);
  } catch (err) {
    console.error('Error fetching chats:', err);
    res.status(500).json({ message: 'Failed to get chats!' });
  }
};

export const getChat = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.id;

  try {
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userIDs: { has: tokenUserId },
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!chat) return res.status(404).json({ message: 'Chat not found!' });

    // Get the other user in the chat
    const otherUserId = chat.userIDs.find((id) => id !== tokenUserId);
    if (!otherUserId) {
      return res
        .status(400)
        .json({ message: 'Invalid chat: Missing other user' });
    }

    // Get the other user's information
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, username: true, avatar: true },
    });

    if (!otherUser) {
      return res
        .status(400)
        .json({ message: 'Invalid chat: Other user not found' });
    }

    if (!chat.seenBy.includes(tokenUserId)) {
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          seenBy: { push: tokenUserId },
        },
      });
    }

    // Include the receiver information in the response
    const responseChat = {
      ...chat,
      receiver: otherUser,
    };

    res.status(200).json(responseChat);
  } catch (err) {
    console.error('Error fetching chat:', err);
    res.status(500).json({ message: 'Failed to get chat!' });
  }
};

export const sendLocation = async (req, res) => {
  const { chatId, location } = req.body;
  const tokenUserId = req.userId;

  try {
    // Check if chat exists and user is authorized to access it
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userIDs: { has: tokenUserId },
      },
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found!' });
    }

    // Ensure chat has at least two users
    if (!chat.userIDs || chat.userIDs.length < 2) {
      return res.status(400).json({ message: 'Invalid chat: Missing users' });
    }

    // Get the other user in the chat
    const receiverId = chat.userIDs.find((id) => id !== tokenUserId);
    if (!receiverId) {
      return res
        .status(400)
        .json({ message: 'Invalid chat: Missing receiver' });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return res.status(400).json({ message: 'Receiver not found!' });
    }

    const message = await prisma.message.create({
      data: {
        text: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
        chatId,
        userId: tokenUserId,
      },
    });

    // Update chat with new message and seen status
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        seenBy: { set: [tokenUserId] },
        lastMessage: message.text,
      },
    });

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending location:', err);
    res.status(500).json({ message: 'Failed to send location' });
  }
};

export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  const receiverId = req.body.receiverId;

  try {
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required!' });
    }

    // Validate that receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found!' });
    }

    // Check if chat already exists between these users
    const existingChat = await prisma.chat.findFirst({
      where: {
        userIDs: { hasEvery: [tokenUserId, receiverId] },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existingChat) {
      // Add receiver information to the response
      return res.status(200).json({
        ...existingChat,
        receiver,
        lastMessage: existingChat.messages[0]?.text || '',
      });
    }

    // Instead of creating an empty chat, require an initial message
    if (!req.body.initialMessage) {
      return res.status(400).json({
        message: 'Initial message is required to create a new chat!',
      });
    }

    // Create new chat with an initial message
    const newChat = await prisma.chat.create({
      data: {
        userIDs: [tokenUserId, receiverId],
        seenBy: [tokenUserId],
      },
    });

    // Create the initial message
    const message = await prisma.message.create({
      data: {
        text: req.body.initialMessage,
        chatId: newChat.id,
        userId: tokenUserId,
      },
    });

    // Update the chat with the initial message
    await prisma.chat.update({
      where: { id: newChat.id },
      data: {
        lastMessage: message.text,
      },
    });

    // Return the chat with the receiver information
    res.status(201).json({
      ...newChat,
      receiver,
      messages: [message],
      lastMessage: message.text,
    });
  } catch (err) {
    console.error('Error adding chat:', err);
    res.status(500).json({ message: 'Failed to add chat!' });
  }
};

export const readChat = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.id;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!chat) return res.status(404).json({ message: 'Chat not found!' });

    // Don't process chats with no messages
    if (chat.messages.length === 0) {
      return res.status(400).json({ message: 'Chat has no messages!' });
    }

    if (!chat.seenBy.includes(tokenUserId)) {
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          seenBy: { push: tokenUserId },
        },
      });
    }

    res.status(200).json({ message: 'Chat marked as read.' });
  } catch (err) {
    console.error('Error marking chat as read:', err);
    res.status(500).json({ message: 'Failed to read chat!' });
  }
};

export const cleanupEmptyChats = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    // Find all chats for this user
    const chats = await prisma.chat.findMany({
      where: {
        userIDs: { has: tokenUserId },
      },
      include: {
        messages: {
          take: 1,
        },
      },
    });

    // Filter chats with no messages
    const emptyChatsIds = chats
      .filter((chat) => chat.messages.length === 0)
      .map((chat) => chat.id);

    // Delete empty chats
    if (emptyChatsIds.length > 0) {
      await prisma.chat.deleteMany({
        where: {
          id: { in: emptyChatsIds },
        },
      });
    }

    res.status(200).json({
      message: `Successfully deleted ${emptyChatsIds.length} empty chats.`,
    });
  } catch (err) {
    console.error('Error cleaning up empty chats:', err);
    res.status(500).json({ message: 'Failed to clean up empty chats!' });
  }
};
