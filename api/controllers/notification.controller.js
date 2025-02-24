// // controllers/visit.controller.js
// import prisma from "../lib/prisma.js";

// export const createVisitRequest = async (req, res) => {
//   const { postId, date, timeSlot, message } = req.body;
//   const visitorId = req.userId;

//   try {
//     // Check if user already has a pending or accepted visit for this property
//     const existingVisit = await prisma.visit.findFirst({
//       where: {
//         postId,
//         visitorId,
//         status: {
//           in: ['PENDING', 'ACCEPTED']
//         },
//         date: {
//           gte: new Date() // Only check future visits
//         }
//       }
//     });

//     if (existingVisit) {
//       return res.status(400).json({ 
//         message: "You already have a pending or accepted visit for this property" 
//       });
//     }

//     // Check if visitor already has another visit at the same time
//     const conflictingVisit = await prisma.visit.findFirst({
//       where: {
//         visitorId,
//         date,
//         timeSlot,
//         status: 'ACCEPTED',
//       }
//     });

//     if (conflictingVisit) {
//       return res.status(400).json({ 
//         message: "You already have another visit scheduled at this time" 
//       });
//     }

//     // Check if the property is already booked for this time slot
//     const existingBooking = await prisma.visit.findFirst({
//       where: {
//         postId,
//         date,
//         timeSlot,
//         status: 'ACCEPTED'
//       }
//     });

//     if (existingBooking) {
//       return res.status(400).json({ 
//         message: "This time slot is already booked" 
//       });
//     }

//     // Create the visit request
//     const post = await prisma.post.findUnique({
//       where: { id: postId },
//       include: { owner: true }
//     });

//     if (!post) {
//       return res.status(404).json({ message: "Property not found" });
//     }

//     const visit = await prisma.visit.create({
//       data: {
//         postId,
//         visitorId,
//         date,
//         timeSlot,
//         message,
//         status: 'PENDING'
//       },
//       include: {
//         post: {
//           include: { owner: true }
//         },
//         visitor: true
//       }
//     });

//     // Create notification for property owner
//     await prisma.notification.create({
//       data: {
//         userId: post.ownerId,
//         type: 'VISIT_REQUEST',
//         message: `New visit request from ${visit.visitor.username} for ${post.title}`,
//         read: false,
//         visitId: visit.id
//       }
//     });

//     res.status(201).json(visit);
//   } catch (err) {
//     console.error("Error creating visit request:", err);
//     res.status(500).json({ message: "Failed to create visit request" });
//   }
// };

// // controllers/notification.controller.js
// export const getNotifications = async (req, res) => {
//   const userId = req.userId;

//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: userId }
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found!" });
//     }

//     const notifications = await prisma.notification.findMany({
//       where: {
//         userId: userId,
//         ...(user.role === 'BUYER' && {
//           NOT: {
//             type: 'VISIT_REQUEST'
//           }
//         })
//       },
//       include: {
//         visit: {
//           include: {
//             post: {
//               include: {
//                 owner: {
//                   select: {
//                     id: true,
//                     username: true,
//                     role: true
//                   }
//                 }
//               }
//             },
//             visitor: {
//               select: {
//                 id: true,
//                 username: true,
//                 avatar: true,
//                 role: true
//               }
//             }
//           }
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     });

//     res.status(200).json(notifications);
//   } catch (err) {
//     console.error("Error fetching notifications:", err);
//     res.status(500).json({ message: "Failed to get notifications!" });
//   }
// };

// export const handleVisitResponse = async (req, res) => {
//   const { visitId } = req.params;
//   const { status, responseMessage } = req.body;
//   const userId = req.userId;

//   try {
//     const visit = await prisma.visit.findUnique({
//       where: { id: visitId },
//       include: {
//         post: {
//           include: {
//             owner: true
//           }
//         },
//         visitor: true
//       }
//     });

//     if (!visit) {
//       return res.status(404).json({ message: "Visit request not found!" });
//     }

//     if (visit.post.ownerId !== userId) {
//       return res.status(403).json({ message: "Not authorized to respond to this visit request!" });
//     }

//     // Check if there's already an accepted visit for this time slot
//     if (status === 'ACCEPTED') {
//       const existingBooking = await prisma.visit.findFirst({
//         where: {
//           postId: visit.postId,
//           date: visit.date,
//           timeSlot: visit.timeSlot,
//           status: 'ACCEPTED',
//           id: { not: visitId } // Exclude current visit
//         }
//       });

//       if (existingBooking) {
//         return res.status(400).json({ 
//           message: "This time slot has already been booked by another visitor" 
//         });
//       }
//     }

//     const updatedVisit = await prisma.visit.update({
//       where: { id: visitId },
//       data: {
//         status,
//         responseMessage
//       }
//     });

//     // Create notification for the visitor (buyer)
//     await prisma.notification.create({
//       data: {
//         userId: visit.visitorId,
//         type: status === 'ACCEPTED' ? 'VISIT_ACCEPTED' : 'VISIT_REJECTED',
//         message: status === 'ACCEPTED' 
//           ? `Your visit request for ${visit.post.title} has been accepted!`
//           : `Your visit request for ${visit.post.title} has been rejected. ${responseMessage ? `Reason: ${responseMessage}` : ''}`,
//         read: false,
//         visitId: visit.id
//       }
//     });

//     res.status(200).json(updatedVisit);
//   } catch (err) {
//     console.error("Error handling visit response:", err);
//     res.status(500).json({ message: "Failed to process visit response!" });
//   }
// };
