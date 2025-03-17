// import prisma from "../lib/prisma.js";
// import axios from "axios";

// export const verifyAadhaar = async (req, res) => {
//   const { aadhaar } = req.body;
//   const userId = req.user.id; // Assuming you have authentication middleware

//   try {
//     // Validate if aadhaar is provided
//     if (!aadhaar) {
//       return res.status(400).json({ message: "Aadhaar number is required!" });
//     }

//     // Call the ApyHub API to validate the Aadhaar
//     const response = await axios.post(
//       "https://api.apyhub.com/validate/aadhaar",
//       { aadhaar },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "apy-token": process.env.APYHUB_API_KEY,
//         },
//       }
//     );

//     // Check if the Aadhaar is valid
//     if (response.data && response.data.data === true) {
//       // Update user's verification status
//       await prisma.user.update({
//         where: { id: userId },
//         data: { isVerified: true },
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Account verified successfully!",
//       });
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Aadhaar number. Please check and try again.",
//       });
//     }
//   } catch (err) {
//     console.error("Aadhaar Verification Error:", err.response?.data || err);

//     // Handle API-specific errors
//     if (err.response?.data?.error) {
//       return res.status(400).json({
//         success: false,
//         message: err.response.data.error.message || "Validation failed",
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Failed to verify Aadhaar. Please try again later.",
//     });
//   }
// };
