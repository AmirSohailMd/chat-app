    •	System Overview
	•	Tech Stack
	•	Component Diagram (you can draw and attach image)
	•	High-level data flow
	•	Scalability considerations

    1. Project Overview

This project is a real-time one-to-one chat application built using the MERN stack (MongoDB, Express, React, Node.js).

The goal of this project is to gain hands-on understanding of:
	•	Full-stack system architecture
	•	REST API design
	•	WebSocket-based real-time communication
	•	JWT authentication
	•	Database schema design
	•	Deployment and scalability considerations

⸻

2. Core Features (MVP Scope)
	•	User registration
	•	User login
	•	JWT-based authentication
	•	One-to-one messaging
	•	Real-time message delivery using WebSockets
	•	Persistent message storage
	•	Load chat history when opening a conversation
	•	Online/offline user status

⸻

3. Tech Stack

Frontend:
	•	React

Backend:
	•	Node.js
	•	Express.js

Database:
	•	MongoDB
	•	Mongoose ODM

Real-Time Communication:
	•	Socket.IO

Authentication:
	•	JWT (JSON Web Token)

Version Control:
	•	Git + GitHub

Deployment (Planned):
	•	TBD (Docker + Cloud Provider)

⸻

4. High-Level Architecture

Components:
	1.	Client (React Application)
	2.	Backend API Server (Express)
	3.	Real-Time Server (Socket.IO running on Node)
	4.	Database (MongoDB)

Communication Types:
	•	HTTP (REST APIs) for authentication & fetching data
	•	WebSocket (Socket.IO) for real-time messaging

⸻

5. System Flow (Conceptual)
	1.	User registers/logs in.
	2.	Server validates credentials and issues JWT.
	3.	Client stores token and includes it in future requests.
	4.	User opens chat.
	5.	Client fetches previous messages via REST API.
	6.	Client connects to WebSocket server.
	7.	Messages are sent through WebSocket.
	8.	Backend stores message in database.
	9.	Backend emits message to receiver in real-time.