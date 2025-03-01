import "./register.scss";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import apiRequest from "../../lib/apiRequest";

function Register() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("seller");
  const [timer, setTimer] = useState(60);
  const navigate = useNavigate();

  useEffect(() => {
    let countdown;
    if (otpSent) {
      setTimer(60);
      countdown = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [otpSent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required!");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiRequest.post("/auth/register", { 
        username, 
        email, 
        password, 
        userType 
      });

      if (res.data.message.includes("OTP sent")) {
        setOtpSent(true);
      } else {
        setError("Something went wrong during registration.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp.trim()) {
      setError("Please enter OTP");
      return;
    }

    try {
      const res = await apiRequest.post("/auth/verify-otp", {
        email,
        otp,
        username,
        password,
        userType
      });

      if (res.data.message === "User registered successfully!") {
        navigate("/login");
      } else {
        setError("OTP verification failed");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div className="registerPage">
      <div className="formContainer">
        {!otpSent && (
          <form onSubmit={handleSubmit}>
            <h1>Create an Account</h1>
            <label>Username</label>
            <input
              type="text"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label>Email</label>
            <input
              type="text"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label>User Type</label>
            <select onChange={(e) => setUserType(e.target.value)} required>
              <option value="buyer">Buyer</option>
              <option value="seller" defaultValue>Seller</option>
            </select>
            <button disabled={isLoading}>Register</button>
            {error && <span>{error}</span>}
            <Link to="/login">Already have an account?</Link>
          </form>
        )}

        {otpSent && (
          <div className="otpModal">
            <h2>Verify Your Email</h2>
            <p>We have sent a verification code to <strong>{email}</strong></p>
            <div className="timerDisplay">
              Time remaining: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </div>
            <div className="item">
              <label>Enter 6-digit OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                placeholder="000000"
              />
            </div>
            <button onClick={handleOtpSubmit}>Verify OTP</button>
            {error && <span>{error}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
