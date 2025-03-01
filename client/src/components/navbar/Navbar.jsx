import { useContext, useState, useEffect } from "react";
import "./navbar.scss";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useNotificationStore } from "../../lib/notificationStore";
import apiRequest from "../../lib/apiRequest";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Get current location to determine active page
  
  const { currentUser, updateUser } = useContext(AuthContext);
  
  const fetch = useNotificationStore((state) => state.fetch);
  const number = useNotificationStore((state) => state.number);
  
  if (currentUser) fetch();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpen(false);
    };
    
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  
  // Prevent closing when clicking on the user div itself
  const handleUserClick = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
      updateUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  // Helper function to check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav>
      <div className="left">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="" />
          <span>Apna Ghar</span>
        </Link>
      </div>
      
      <div className="center">
        <Link to="/" className={isActive("/") ? "active" : ""}>Home</Link>
        <Link to="/about" className={isActive("/about") ? "active" : ""}>About</Link>
        <Link to="/contact" className={isActive("/contact") ? "active" : ""}>Contact</Link>
        {currentUser?.userType === "seller" && (
          <Link to="/add" className={`enlist ${isActive("/add") ? "active" : ""}`}>Enlist</Link>
        )}
      </div>
      
      <div className="right">
        {currentUser ? (
          <div className="user" onClick={handleUserClick}>
            <img src={currentUser.avatar || "/noavatar.jpg"} alt="" />
            <span>{currentUser.username}</span>
            {dropdownOpen && (
              <div className="dropdown">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/profile");
                    setDropdownOpen(false);
                  }}
                  className={isActive("/profile") ? "active" : ""}
                >
                  Profile
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }} 
                  style={{ color: "red" }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className={isActive("/login") ? "active" : ""}>Sign in</Link>
            <Link to="/register" className={`register ${isActive("/register") ? "active" : ""}`}>
              Sign up
            </Link>
          </>
        )}
        <div className="menuIcon">
          <img
            src="/menu.png"
            alt=""
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
          />
        </div>
        {open && (
          <div className="mobileMenu">
            <Link to="/" className={isActive("/") ? "active" : ""}>Home</Link>
            <Link to="/about" className={isActive("/about") ? "active" : ""}>About</Link>
            <Link to="/contact" className={isActive("/contact") ? "active" : ""}>Contact</Link>
            {currentUser?.userType === "seller" && (
              <Link to="/add" className={isActive("/add") ? "active" : ""}>Add Property</Link>
            )}
            {!currentUser && (
              <>
                <Link to="/login" className={isActive("/login") ? "active" : ""}>Sign in</Link>
                <Link to="/register" className={isActive("/register") ? "active" : ""}>Sign up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;