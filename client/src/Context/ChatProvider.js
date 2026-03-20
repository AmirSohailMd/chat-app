// client/src/Context/ChatProvider.js
import { io } from "socket.io-client";
import React, { createContext, useContext, useEffect, useState } from "react";

const ENDPOINT = "http://localhost:8000";
const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // TEMP user (replace later with login)
    const loggedUser = {
      _id: "69a2ce35694f0ed840db67af",
      name: "Sam",
    };

    setUser(loggedUser);

    const newSocket = io(ENDPOINT);

    newSocket.emit("setup", loggedUser);

    newSocket.on("connected", () => {
      console.log("Socket connected");
      setSocketConnected(true);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  return (
    <ChatContext.Provider value={{ user, socket, socketConnected }}>
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
