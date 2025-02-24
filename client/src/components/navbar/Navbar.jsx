import { useContext, useState } from "react";
import "./navbar.scss";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useNotificationStore } from "../../lib/notificationStore";
import apiRequest from "../../lib/apiRequest";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const { currentUser, updateUser } = useContext(AuthContext);

  const fetch = useNotificationStore((state) => state.fetch);
  const number = useNotificationStore((state) => state.number);

  if (currentUser) fetch();

  const handleLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
      updateUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  return (
    <nav>
      <div className="left">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="" />
          <span>Apna Ghar</span>
        </Link>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/agents">Agents</Link>
        {currentUser?.userType === "seller" && (
          <Link to="/add" className="add">Enlist</Link>
        )}
      </div>
      <div className="right">
        {currentUser ? (
          <div className="user" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <img src={currentUser.avatar || "/noavatar.jpg"} alt="" />
            <span>{currentUser.username}</span>
            {dropdownOpen && (
              <div className="dropdown">
                <button onClick={() => navigate("/profile")}>Profile</button>
                <button onClick={handleLogout} style={{ color: "red" }}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/register" className="register">
              Sign up
            </Link>
          </>
        )}
        <div className="menuIcon">
          <img
            src="/menu.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
        </div>
        {open && (
          <div className="mobileMenu">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/agents">Agents</Link>
            {currentUser?.userType === "seller" && (
              <Link to="/add">Add Property</Link>
            )}
            {!currentUser && (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register">Sign up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar; 