import { useContext, useState } from "react";
import "./profileUpdatePage.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { useNavigate } from "react-router-dom";
import UploadWidget from "../../components/uploadWidget/UploadWidget";

function ProfileUpdatePage() {
  const { currentUser, updateUser } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState([]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const validateInputs = (username, email, password) => {
    // Username validation
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (username && !alphanumericRegex.test(username)) {
      setError("Username must contain only alphanumeric characters!");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setError("Please enter a valid email address!");
      return false;
    }

    // Password validation (only if provided)
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters long!");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
  
    try {
      const formData = new FormData(e.target);
      const { username, email, password, currentPassword } = Object.fromEntries(formData);
  
      // Only send fields that have changed
      const updates = {};
      if (username && username !== currentUser.username) updates.username = username;
      if (email && email !== currentUser.email) updates.email = email;
      if (password) updates.password = password;
      if (avatar[0]) updates.avatar = avatar[0];
  
      // If no changes, return early
      if (Object.keys(updates).length === 0) {
        setError("No changes to update!");
        setIsSubmitting(false);
        return;
      }
  
      // Check for current password for ANY changes
      if (!currentPassword) {
        setError("Please enter your current password to make changes!");
        setIsSubmitting(false);
        return;
      }
      // Always include currentPassword with any updates
      updates.currentPassword = currentPassword;
  
      if (!validateInputs(username, email, password)) {
        setIsSubmitting(false);
        return;
      }
  
      const res = await apiRequest.put(`/users/${currentUser.id}`, updates);
  
      if (res.data.requiresOTP) {
        setShowOtpModal(true);
        setTempEmail(res.data.tempEmail);
        setError("");
      } else {
        updateUser(res.data);
        navigate("/profile");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleOtpSubmit = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest.post(`/users/verify-email`, {
        id: currentUser.id,
        email: tempEmail,
        otp
      });

      updateUser(res.data);
      setShowOtpModal(false);
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profileUpdatePage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>Update Profile</h1>
          <div className="item">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue={currentUser.username}
              pattern="^[a-zA-Z0-9]+$"
              title="Username must contain only alphanumeric characters"
            />
          </div>
          <div className="item">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={currentUser.email}
            />
          </div>
          <div className="item">
            <label htmlFor="currentPassword">Current Password</label>
            <input 
              id="currentPassword" 
              name="currentPassword" 
              type="password"
              placeholder="Required for any changes"
              required
            />
          </div>
          <div className="item">
            <label htmlFor="password">New Password</label>
            <input 
              id="password" 
              name="password" 
              type="password"
              placeholder="Leave blank to keep current password"
            />
          </div>
          <button disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update"}
          </button>
          {error && <span className="error">{error}</span>}
        </form>
      </div>
      <div className="sideContainer">
        <img
          src={avatar[0] || currentUser.avatar || "/noavatar.jpg"}
          alt=""
          className="avatar"
        />
        <UploadWidget
          uwConfig={{
            cloudName: "lamadev",
            uploadPreset: "estate",
            multiple: false,
            maxImageFileSize: 2000000,
            folder: "avatars",
          }}
          setState={setAvatar}
        />
      </div>

      {showOtpModal && (
        <div className="otpModal">
          <div className="modalContent">
            <h2>Verify Your Email</h2>
            <p>Please enter the OTP sent to {tempEmail}</p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength="6"
            />
            <button 
              onClick={handleOtpSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </button>
            {error && <span className="error">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileUpdatePage;