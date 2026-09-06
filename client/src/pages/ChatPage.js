import React, { useEffect, useState, useRef } from "react";
//import { connectSocket, getSocket } from "../socket";
import { ChatState } from "../Context/ChatProvider";
import axios from "axios";
import { UNSAFE_AwaitContextProvider, useNavigate } from "react-router-dom";

function ChatPage() {
  //const [user, setUser] = useState(null);
  const {
    socket,
    socketConnected,
    user,
    logout,
    selectedChat,
    setSelectedChat,
    chats,
    setChats,
    onLineUsers,
  } = ChatState();

  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const bottomRef = useRef();
  //const chatId = "6a928e154122e6fddf6006ec"; // your chat id, the chat room ID where the users join.

  const token = user?.token;

  const inputRef = useRef();
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const getChatPartner = (chat) => {
    if (!chat || !user) return null;
    return chat.users?.find((u) => u._id !== user._id);
  };

  const isUserOnline = (userId) => {
    return onLineUsers?.includes(userId);
  };

  // useEffect(() => {
  //   // Wait for the provider to signal that the socket is ready
  //   if (!socketConnected || !socket || !user) return;

  //   socket.emit("join chat", chatId);

  //   const fetchMessages = async () => {
  //     try {
  //       const { data } = await axios.get(
  //         `http://localhost:8000/api/message/${chatId}`,
  //         { headers: { Authorization: `Bearer ${token}` } },
  //       );
  //       setMessages(data);
  //     } catch (error) {
  //       console.error("Failed to fetch messages", error);
  //     }
  //   };

  //   fetchMessages();
  // }, [socketConnected, socket, user, chatId, token]); // Triggers only when connection is confirmed

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (newMessageReceived) => {
      //if (chatId !== newMessageReceived.chat._id) return;

      const incomingChatId =
        typeof newMessageReceived.chat === "object"
          ? newMessageReceived.chat._id
          : newMessageReceived.chat;

      if (selectedChat && selectedChat._id === incomingChatId) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === newMessageReceived._id)) return prev; // ✅ prevent duplicates
          return [...prev, newMessageReceived];
        });
      }
      fetchChats();
    };

    socket.on("message received", handleMessage);
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // socket.on("message received", (msg) => {
    //   console.log("Incoming socket message:", msg);
    //});

    return () => {
      socket.off("message received", handleMessage);
      socket.off("typing");
      socket.off("stop typing");
    };
  }, [socket, selectedChat]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo) {
      navigate("/");
    }
  }, [navigate, user]);

  //serach users
  const handleSearch = async (query) => {
    setSearch(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoadingSearch(true);
      const { data } = await axios.get(
        `http://localhost:8000/api/users?search=${query}`,
        { headers: { Authorization: `Bearer ${user.token}` } },
      );

      setSearchResults(data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoadingSearch(false);
    }
  };

  //access chat
  const accessChat = async (userId) => {
    try {
      const { data } = await axios.post(
        "http://localhost:8000/api/chat",
        { userId },
        { headers: { Authorization: `Bearer ${user.token}` } },
      );

      //Add to chat list if not already present
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }

      setSelectedChat(data);
      setSearch("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error accessing chat:", error);
    }
  };

  //fetch recent chat

  const fetchChats = async () => {
    try {
      const { data } = await axios.get("http://localhost:8000/api/chat", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setChats(data);
    } catch (error) {
      console.error("Failed to fetch chat:", error);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchChats();
    }
  }, [user]);

  //fetch messages when selected chat changes

  useEffect(() => {
    if (!selectedChat?._id || !socket || !user) {
      setMessages([]);
      return;
    }

    socket.emit("join chat", selectedChat._id);

    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:8000/api/message/${selectedChat._id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          },
        );
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, [selectedChat, socket, user]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage) return;
    if (!newMessage.trim() || !selectedChat?._id || !socket) return;

    console.log("Socket:", socket);
    if (!socket) {
      console.log("Socket not connected yet");
      return;
    }
    try {
      const { data } = await axios.post(
        "http://localhost:8000/api/message",
        {
          content: newMessage,
          chatId: selectedChat._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      socket.emit("new message", data);
      socket.emit("stop typing", selectedChat._id);
      setTyping(false);

      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      fetchChats();
    } catch (error) {
      console.error("Failed to send messages:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#121417",
        color: "#f1f5f9",
      }}
    >
      {/* 1. TOP NAVBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 28px",
          background: "#1c1f26",
          borderBottom: "1px solid #2e3440",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
              display: "inline-block",
            }}
          ></span>
          <h2
            style={{
              color: "#f8fafc",
              margin: 0,
              fontSize: "20px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            PING
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div>
            <span style={{ color: "#10b981", marginRight: "6px" }}>●</span>
            <strong style={{ color: "#f1f5f9" }}>{user?.name}</strong>{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              ({user?.email})
            </span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            style={{
              background: "#2b1719",
              color: "#f87171",
              border: "1px solid #451a1d",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "opacity 0.2s",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN CONTAINER */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          maxWidth: "1200px",
          width: "100%",
          margin: "16px auto",
          gap: "16px",
          padding: "0 16px",
        }}
      >
        {/* === LEFT SIDE PANE (Search + Chats List) === */}
        <div
          style={{
            width: "340px",
            background: "#1c1f26",
            borderRadius: "12px",
            border: "1px solid #2e3440",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Search Box */}
          <div style={{ padding: "12px", borderBottom: "1px solid #262b35" }}>
            <input
              type="text"
              placeholder="🔍 Search users by name or email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#15181e",
                color: "#f1f5f9",
                borderRadius: "8px",
                border: "1px solid #2d333f",
                outline: "none",
                boxSizing: "border-box",
                fontSize: "13px",
              }}
            />
          </div>

          {/* List Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
            {/* Search Results */}
            {search.trim() ? (
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#94a3b8",
                    margin: "4px 6px 10px",
                    letterSpacing: "0.5px",
                  }}
                >
                  SEARCH RESULTS
                </p>
                {loadingSearch && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      padding: "8px",
                    }}
                  >
                    Searching...
                  </p>
                )}
                {searchResults.length === 0 && !loadingSearch && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      padding: "8px",
                    }}
                  >
                    No users found
                  </p>
                )}
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => accessChat(u._id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: "#15181e",
                      marginBottom: "6px",
                      border: "1px solid #262b35",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          color: isUserOnline(u._id) ? "#10b981" : "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        ●
                      </span>
                      <strong style={{ color: "#f1f5f9" }}>{u.name}</strong>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        margin: "3px 0 0",
                      }}
                    >
                      {u.email}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* Recent Chats List */
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#94a3b8",
                    margin: "4px 6px 10px",
                    letterSpacing: "0.5px",
                  }}
                >
                  RECENT CHATS
                </p>
                {chats.length === 0 && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      padding: "8px",
                    }}
                  >
                    No chats yet. Search for a user above to start chatting!
                  </p>
                )}
                {chats.map((c) => {
                  const partner = getChatPartner(c);
                  const isOnline = partner ? isUserOnline(partner._id) : false;
                  const isSelected = selectedChat?._id === c._id;
                  return (
                    <div
                      key={c._id}
                      onClick={() => setSelectedChat(c)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        background: isSelected ? "#282e38" : "#15181e",
                        marginBottom: "6px",
                        border: isSelected
                          ? "1.5px solid #6366f1"
                          : "1px solid #262b35",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              color: isOnline ? "#10b981" : "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            ●
                          </span>
                          <strong style={{ color: "#f1f5f9" }}>
                            {partner?.name || "Chat"}
                          </strong>
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            color: isOnline ? "#10b981" : "#64748b",
                            fontWeight: "600",
                          }}
                        >
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                      {c.latestMessage && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#94a3b8",
                            margin: "4px 0 0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.latestMessage.sender?.name}:{" "}
                          {c.latestMessage.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* === RIGHT ACTIVE CHAT PANEL === */}
        <div
          style={{
            flex: 1,
            background: "#1c1f26",
            borderRadius: "12px",
            border: "1px solid #2e3440",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {selectedChat ? (
            <>
              {/* Partner Header */}
              {(() => {
                const partner = getChatPartner(selectedChat);
                const isOnline = partner ? isUserOnline(partner._id) : false;
                return (
                  <div
                    style={{
                      padding: "14px 20px",
                      borderBottom: "1px solid #262b35",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#15181e",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          color: "#f8fafc",
                          fontWeight: "700",
                        }}
                      >
                        {partner?.name || "Chat"}
                      </h3>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        {partner?.email}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: isOnline ? "#10b981" : "#64748b",
                      }}
                    >
                      ● {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                );
              })()}

              {/* Messages Scroll Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {messages.map((msg) => {
                  const isMine = msg.sender?._id === user?._id;
                  return (
                    <div
                      key={msg._id}
                      style={{
                        display: "flex",
                        justifyContent: isMine ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "10px 14px",
                          borderRadius: "12px",
                          background: isMine ? "#4f46e5" : "#282e38",
                          color: isMine ? "#ffffff" : "#f1f5f9",
                          border: isMine ? "none" : "1px solid #333a48",
                          wordBreak: "break-word",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "11px",
                            opacity: 0.8,
                            margin: "0 0 2px",
                          }}
                        >
                          {msg.sender?.name}
                        </p>
                        <p style={{ margin: 0, fontSize: "14px" }}>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef}></div>
              </div>

              {/* Typing Indicator */}
              {isTyping && (
                <div
                  style={{
                    padding: "4px 16px",
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontStyle: "italic",
                  }}
                >
                  {getChatPartner(selectedChat)?.name || "Partner"} is typing...
                </div>
              )}

              {/* Input Box */}
              <div
                style={{
                  padding: "14px 16px",
                  borderTop: "1px solid #262b35",
                  display: "flex",
                  gap: "10px",
                  background: "#15181e",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    if (!socket || !selectedChat) return;
                    if (!typing) {
                      setTyping(true);
                      socket.emit("typing", selectedChat._id);
                    }
                    if (typingTimeoutRef.current)
                      clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                      socket.emit("stop typing", selectedChat._id);
                      setTyping(false);
                    }, 2000);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    background: "#1c1f26",
                    color: "#f1f5f9",
                    borderRadius: "8px",
                    border: "1px solid #2d333f",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />
                <button
                  onClick={sendMessage}
                  style={{
                    background: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    padding: "0 20px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            /* Empty State */
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
              }}
            >
              <span style={{ fontSize: "48px", marginBottom: "12px" }}>💬</span>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "500",
                  margin: 0,
                  color: "#94a3b8",
                }}
              >
                Select a conversation from the left or search for a user to
                start chatting!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
