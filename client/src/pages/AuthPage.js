//1.Imports
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../Context/ChatProvider";

function Authpage() {
  //2.State definitions
  // A. Toggle state (true = Login, false = Sign Up)
  const [isLogin, setIsLogin] = useState(true);

  //B.Input field states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  //C.Network / Feedback states

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  //D.Hooks

  const navigate = useNavigate();
  const { setUser } = ChatState();

  //3.Side Effects

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      navigate("/chats");
    }
  }, [navigate]);

  //4.Event Handler

  const handleTabSwitch = (loginState) => {
    setIsLogin(loginState);
    setErrorMessage(""); // clear previous errors when switching
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post(
        "http://localhost:8000/api/users/login",
        { email, password },
        config,
      );
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      navigate("/chats");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Invalid email or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (password != confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post(
        "http://localhost:8000/api/users/register",
        { name, email, password },
        config,
      );

      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      navigate("/chats");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Registration failed, Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  //5JSX (UI RENDERING)
  return (
    <>
      <div className="auth-container">
        <div className="auth-card">
          {/*Header*/}
          <div className="auth-header">
            <h1> Chat App</h1>
            <p> Real-time messaging made simple</p>
          </div>

          {/*Tab Switching Button*/}
          <div className="tabs-container">
            <button
              type="button"
              className={`tab-btn ${isLogin ? "active" : ""}`}
              onClick={() => handleTabSwitch(true)}
            >
              Login
            </button>
            <button
              type="button"
              className={`tab-btn ${!isLogin ? "active" : ""}`}
              onClick={() => handleTabSwitch(false)}
            >
              Sign Up
            </button>
          </div>

          {/*Error alert (Conditional Render)*/}
          {errorMessage && (
            <div className="alert-box alert-error">{errorMessage}</div>
          )}

          {/*Forms: Show Login OR Sign Up based on isLogin*/}

          {isLogin ? (
            <form onSubmit={handleLogin} className="auth-form">
              {/*Email & Password inputs + Login Button*/}
              <div className="form-group">
                <label> Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label> Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Loggin in.." : "Login"}
              </button>
            </form>
          ) : (
            /*Sign Up form */
            <form onSubmit={handleRegister} className="auth-form">
              {/*Name, Email, Password, Confirm Password inputs + Sign Up Button*/}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g Alice Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label> Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confrim Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

//6.export

export default Authpage;
