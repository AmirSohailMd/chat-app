import React, { useEffect, useState, useRef } from "react";
//import { connectSocket, getSocket } from "../socket";
import { ChatState } from "../Context/ChatProvider";
import axios from "axios";

function ChatPage() {
  //const [user, setUser] = useState(null);
  const { socket, socketConnected, user } = ChatState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const bottomRef = useRef();
  const chatId = "69ad582139d47e9a3542b7a6"; // your chat id
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTJjZTM1Njk0ZjBlZDg0MGRiNjdhZiIsImlhdCI6MTc3MjM3OTIyNiwiZXhwIjoxNzc0OTcxMjI2fQ.DwJnkgWSfE_wwXY3y_LXKQ2K3FNre1Pp5iLhOAMyeBc";

  const inputRef = useRef();
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Wait for the provider to signal that the socket is ready
    if (!socketConnected || !socket || !user) return;

    socket.emit("join chat", chatId);

    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:8000/api/message/${chatId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    fetchMessages();
  }, [socketConnected, socket, user, chatId]); // Triggers only when connection is confirmed

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (newMessageReceived) => {
      //if (chatId !== newMessageReceived.chat._id) return;

      const incomingChatId =
        typeof newMessageReceived.chat === "object"
          ? newMessageReceived.chat._id
          : newMessageReceived.chat;

      if (chatId !== incomingChatId) return;
      setMessages((prev) => [...prev, newMessageReceived]);
    };

    socket.on("message received", handleMessage);
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    socket.on("message received", (msg) => {
      console.log("Incoming socket message:", msg);
    });

    return () => {
      socket.off("message received", handleMessage);
      socket.off("typing");
      socket.off("stop typing");
    };
  }, [socket, chatId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!newMessage) return;
    if (!newMessage.trim()) return;

    //const socket = getSocket();
    console.log("Socket:", socket);
    if (!socket) {
      console.log("Socket not connected yet");
      return;
    }
    const { data } = await axios.post(
      "http://localhost:8000/api/message",
      {
        content: newMessage,
        chatId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    socket.emit("new message", data);
    socket.emit("stop typing", chatId);
    setTyping(false);

    setMessages((prev) => [...prev, data]);
    setNewMessage("");
  };

  return (
    <div className="h-screen flex flex-col max-w-xl mx-auto border shadow-lg p-4">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${
              msg.sender._id === user?._id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-xs ${
                msg.sender._id === user?._id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              <p className="text-xs opacity-70 mb-1">{msg.sender.name}</p>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      {isTyping && <div className="text-sm text-gray-500 px-2">Typing...</div>}
      <div className="mt-2 flex gap-2 border-t pt-2">
        <input
          ref={inputRef}
          className="border p-2 flex-1 rounded-lg outline-none"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);

            //const socket = getSocket();
            if (!socket) return;

            if (!typing) {
              setTyping(true);
              socket.emit("typing", chatId);
            }

            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
              socket.emit("stop typing", chatId);
              setTyping(false);
            }, 2000);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          className="bg-blue-500 text-white px-4 rounded-lg"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatPage;
