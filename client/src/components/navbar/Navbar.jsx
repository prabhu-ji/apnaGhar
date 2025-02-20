import { useState } from "react";
import "./navbar.scss";
import { Link } from "react-router-dom";

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav>
      <div className="left">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="Logo" />
          <span>Apna Ghar</span>
        </Link>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/agents">Agents</Link>
      </div>
      <div className="right">
        {/* Guest User - Default behavior */}
        <div className="user">
          <img src="/noavatar.jpg" alt="User Avatar" />
          <span>Guest</span>
        </div>
        {/* Sign in / Sign up links */}
        <div className="auth-links">
          <Link to="/login">Sign in</Link>
          <Link to="/register" className="register">Sign up</Link>
        </div>
        <div className="menuIcon">
          <img
            src="/menu.png"
            alt="Menu"
            onClick={() => setOpen((prev) => !prev)}
          />
        </div>
        {/* Mobile menu visibility */}
        {open && (
          <div className="mobileMenu">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/agents">Agents</Link>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
