import prisma from "../lib/prisma.js";

export const getChats = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chats = await prisma.chat.findMany({
      where: {
        userIDs: { has: tokenUserId },
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get only the latest message
        },
      },
    });

    const userIdsToFetch = chats.flatMap(chat => chat.userIDs).filter(id => id !== tokenUserId);
    const uniqueUserIds = [...new Set(userIdsToFetch)];

    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, username: true, avatar: true },
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const formattedChats = chats.map(chat => {
      const receiverId = chat.userIDs.find(id => id !== tokenUserId);
      return { ...chat, receiver: userMap[receiverId] || null };
    });

    res.status(200).json(formattedChats);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ message: "Failed to get chats!" });
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
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    if (!chat.seenBy.includes(tokenUserId)) {
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          seenBy: { push: tokenUserId },
        },
      });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error("Error fetching chat:", err);
    res.status(500).json({ message: "Failed to get chat!" });
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
        userIDs: { has: tokenUserId }
      }
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found!" });
    }

    // Ensure chat has at least two users
    if (!chat.userIDs || chat.userIDs.length < 2) {
      return res.status(400).json({ message: "Invalid chat: Missing users" });
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
    console.error("Error sending location:", err);
    res.status(500).json({ message: "Failed to send location" });
  }
};


export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  const receiverId = req.body.receiverId;

  try {
    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required!" });
    }
    
    // Validate that receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });
    
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found!" });
    }

    // Check if chat already exists between these users
    const existingChat = await prisma.chat.findFirst({
      where: {
        userIDs: { hasEvery: [tokenUserId, receiverId] }
      },
    });

    if (existingChat) return res.status(200).json(existingChat);

    // Create new chat only if both users are valid
    const newChat = await prisma.chat.create({
      data: {
        userIDs: [tokenUserId, receiverId],
        seenBy: [tokenUserId],
      },
    });

    res.status(201).json(newChat);
  } catch (err) {
    console.error("Error adding chat:", err);
    res.status(500).json({ message: "Failed to add chat!" });
  }
};


export const readChat = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.id;

  try {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    if (!chat.seenBy.includes(tokenUserId)) {
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          seenBy: { push: tokenUserId },
        },
      });
    }

    res.status(200).json({ message: "Chat marked as read." });
  } catch (err) {
    console.error("Error marking chat as read:", err);
    res.status(500).json({ message: "Failed to read chat!" });
  }
};