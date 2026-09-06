// client/src/Context/ChatProvider.js
import { io } from "socket.io-client";
import React, { createContext, useContext, useEffect, useState } from "react";

const ENDPOINT = "http://localhost:8000";
const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [onLineUsers, setOnLineUsers] = useState([]);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setUser(userInfo);
  }, []);

  useEffect(() => {
    if (!user) {
      setSocket((prevSocket) => {
        if (prevSocket) prevSocket.disconnect();
        return null;
      });
      setSocketConnected(false);
      return;
    }
    const newSocket = io(ENDPOINT);
    newSocket.emit("setup", user);

    newSocket.on("connected", () => {
      console.log("Socket connected for", user.name);
      setSocketConnected(true);
    });

    newSocket.on("online users updated", (users) => {
      setOnLineUsers(users);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const logout = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    setSelectedChat(null);
    setChats([]);
  };

  useEffect(() => {
    setSelectedChat(null);
    setChats([]);
  }, [user?._id]);

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        socket,
        socketConnected,
        logout,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        onLineUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
