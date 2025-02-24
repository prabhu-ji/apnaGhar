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
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
            <span>
              Avatar:
              <img src={currentUser?.avatar || "/noavatar.jpg"} alt="User Avatar" />
            </span>
            <span>Username: <b>{currentUser?.username || "N/A"}</b></span>
            <span>E-mail: <b>{currentUser?.email || "N/A"}</b></span>
            <span>Account Type: <b>{currentUser?.userType || "N/A"}</b></span>
            <button onClick={() => setShowDialog(true)} style={{ background: "red", color: "white" }}>
              Delete Account
            </button>
          </div>

          {currentUser?.userType === "seller" && (
            <>
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
            </>
          )}

          {currentUser?.userType !== "seller" && (
            <>
              <div className="title">
                <h1>Saved List</h1>
              </div>
              <Suspense fallback={<p>Loading...</p>}>
                <Await resolve={data?.postResponse} errorElement={<p>Error loading saved posts!</p>}>
                  {(postResponse) => (
                    <List posts={postResponse?.data?.savedPosts || []} listType="saved" />
                  )}
                </Await>
              </Suspense>
            </>
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
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button onClick={handleDeleteAccount}>Confirm Delete</button>
            <button onClick={() => setShowDialog(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
