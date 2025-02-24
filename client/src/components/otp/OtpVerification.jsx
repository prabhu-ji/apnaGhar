import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function OtpVerification() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post("/auth/verify-otp", { email: "user_email", otp });

      if (res.status === 200) {
        navigate("/home"); // Redirect to the homepage or wherever
      }
    } catch (err) {
      setError("Invalid OTP or OTP expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otpVerificationPage">
      <form onSubmit={handleOtpSubmit}>
        <h1>Enter OTP</h1>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <button disabled={isLoading}>Verify OTP</button>
        {error && <span>{error}</span>}
      </form>
    </div>
  );
}

export default OtpVerification;