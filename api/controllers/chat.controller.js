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



// In your message controller (example)
export const sendLocation = async (req, res) => {
  const { chatId, location } = req.body;
  const tokenUserId = req.userId;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { userIDs: true }
    });

    if (!chat || !chat.userIDs.includes(tokenUserId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: tokenUserId,
        type: "location", // Add type as "location"
        content: JSON.stringify(location), // Save location as a JSON string
      },
    });

    // Emit socket event for real-time message sending
    socket.emit("sendMessage", {
      receiverId: chat.receiverId, // adjust receiverId logic accordingly
      data: message,
    });

    res.status(200).json(message);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to send location" });
  }
};


export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  const receiverId = req.body.receiverId;

  try {
    if (!receiverId) return res.status(400).json({ message: "Receiver ID is required!" });

    const existingChat = await prisma.chat.findFirst({
      where: {
        userIDs: { equals: [tokenUserId, receiverId] },
      },
    });

    if (existingChat) return res.status(200).json(existingChat);

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