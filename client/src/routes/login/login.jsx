import { useContext, useState } from "react";
import "./login.scss";
import { Link, useNavigate } from "react-router-dom";
import apiRequest from "../../lib/apiRequest";
import { AuthContext } from "../../context/AuthContext";

function Login() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const username = formData.get("username").trim();
    const password = formData.get("password").trim();

    if (!username || !password) {
      setError("Both fields are required!");
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiRequest.post("/auth/login", { username, password });

      if (!res || !res.data) {
        throw new Error("Invalid response from server");
      }

      console.log("Login response:", res.data);
      console.log("User data:", res.data.user);

      if (!res.data.user?.userType) {
        console.error("Warning: User type is missing in the response");
      }

      const userData = {
        ...res.data.user,
        userType: res.data.user?.userType || "buyer" 
      };

      console.log("Final user data being stored:", userData);
      updateUser(userData);
      navigate("/");
    } catch (err) {
      console.error("Login Error:", err);
      if (err.response) {
        setError(err.response.data?.message || "Invalid username or password!");
      } else if (err.request) {
        setError("Network error! Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>Welcome Back!</h1>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            required
            minLength={3}
            maxLength={20}
            type="text"
            placeholder="Username"
            disabled={isLoading}
            autoComplete="off"
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Password"
            disabled={isLoading}
            autoComplete="current-password"
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
          {error && <span className="error">{error}</span>}
          <Link to="/register">Do not have an account? Sign up</Link>
        </form>
      </div>
    </div>
  );
}

export default Login;
