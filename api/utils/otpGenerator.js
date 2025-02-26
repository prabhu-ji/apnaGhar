// utils/otpGenerator.js

/**
 * Generates a random numeric OTP of specified length
 * @param {number} length - Length of the OTP
 * @returns {string} - Generated OTP
 */
export const generateOTP = (length = 6) => {
    // Generate a random number with the specified number of digits
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const otp = Math.floor(min + Math.random() * (max - min + 1)).toString();
    
    return otp;
  };