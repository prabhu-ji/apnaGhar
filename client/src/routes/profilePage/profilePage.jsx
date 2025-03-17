/* eslint-disable no-unused-vars */
import { useContext, useState, useEffect, Suspense } from "react";
import { Await, Link, useLoaderData, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Chat from "../../components/chat/Chat";
import List from "../../components/list/List";
import Notification from "../../components/notification/Notification.jsx";
import apiRequest from "../../lib/apiRequest";
import "./profilePage.scss";

const ProfilePage = () => {
  const data = useLoaderData();
  const { currentUser, deleteUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [error, setError] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleDeleteAccount = async () => {
    if (!password) {
      setError("Please enter your password to confirm.");
      return;
    }

    try {
      const response = await apiRequest.delete(`/users/${currentUser.id}`, {
        data: { password },
      });

      alert(response.data.message || "Account deleted successfully.");
      deleteUser();
      navigate("/signup");
    } catch (err) {
      console.error("Delete Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to delete account!");
    }
  };

  const handleVerifyAccount = () => {
    alert("This feature is currently unavailable.");
  };
  

  return (
    <div className="profilePage">
      <div className="details">
        <div className="wrapper">
          <div className="title">
            <h1>User Information</h1>
            <div className="user-actions">
              <Notification />
              <Link to="/profile/update">
                <button>Update Profile</button>
              </Link>
            </div>
          </div>

          <div className="info">
            <div className="avatar-container">
              <img src={currentUser?.avatar || "/noavatar.jpg"} alt="User Avatar" className="avatar" />
              {currentUser?.isVerified && (
                <div className="verification-badge" title="Verified Account">✓</div>
              )}
            </div>
            <span>Username: <b>{currentUser?.username || "N/A"}</b></span>
            <span>Email: <b>{currentUser?.email || "N/A"}</b></span>
            <span>Account Type: <b>{currentUser?.userType || "N/A"}</b></span>
            <span>
              Verification Status: 
              <b>
                {currentUser?.isVerified ? (
                  <span className="verified">Verified</span>
                ) : (
                  <span className="not-verified">Not Verified</span>
                )}
              </b>
            </span>
            <div className="account-actions">
              {!currentUser?.isVerified && (
                <button className="verifyAccountBtn" onClick={() => setShowVerifyDialog(true)}>
                  Verify Account
                </button>
              )}
              <button className="deleteAccountBtn" onClick={() => setShowDialog(true)}>
                Delete Account
              </button>
            </div>
          </div>

          {currentUser?.userType === "seller" ? (
            <div className="list-section">
              <div className="title">
                <h1>My List</h1>
                <Link to="/add">
                  <button>Create New Post</button>
                </Link>
              </div>
              <Suspense fallback={<p>Loading...</p>}>
                <Await resolve={data?.postResponse} errorElement={<p>Error loading posts!</p>}>
                  {(postResponse) => (
                    <List posts={postResponse?.data?.userPosts || []} listType="user" />
                  )}
                </Await>
              </Suspense>
            </div>
          ) : (
            <div className="list-section">
              <h1>Saved List</h1>
              <Suspense fallback={<p>Loading...</p>}>
                <Await resolve={data?.postResponse} errorElement={<p>Error loading saved posts!</p>}>
                  {(postResponse) => (
                    <List posts={postResponse?.data?.savedPosts || []} listType="saved" />
                  )}
                </Await>
              </Suspense>
            </div>
          )}
        </div>
      </div>

      <div className="chatContainer">
        <div className="wrapper">
          <Suspense fallback={<p>Loading...</p>}>
            <Await resolve={data?.chatResponse} errorElement={<p>Error loading chats!</p>}>
              {(chatResponse) => <Chat chats={chatResponse?.data || []} />}
            </Await>
          </Suspense>
        </div>
      </div>

      {showDialog && (
        <div className="dialogOverlay">
          <div className="dialog">
            <h3>Are you sure you want to delete your account?</h3>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="error-message">{error}</p>}
            <div className="dialog-buttons">
              <button className="confirm-btn" onClick={handleDeleteAccount}>Confirm Delete</button>
              <button className="cancel-btn" onClick={() => setShowDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showVerifyDialog && (
        <div className="dialogOverlay">
          <div className="dialog verify-dialog">
            <h3>Verify Your Account with Aadhaar</h3>
            <p className="dialog-desc">Enter your 12-digit Aadhaar number to verify your account</p>
            <input
              type="text"
              placeholder="Enter Aadhaar number"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
              maxLength={12}
            />
            {verifyError && <p className="error-message">{verifyError}</p>}
            {verifySuccess && <p className="success-message">{verifySuccess}</p>}
            <div className="dialog-buttons">
              <button 
                className="confirm-btn" 
                onClick={handleVerifyAccount}
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify Account"}
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setShowVerifyDialog(false);
                  setAadhaar("");
                  setVerifyError("");
                  setVerifySuccess("");
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;