# 💬 Real-Time Chat App

A full-stack real-time chat application built with the MERN stack and Socket.io. Supports multiple concurrent users, chat rooms, live messaging, typing indicators, and online presence tracking.

**Live Demo:** [rajgram28.vercel.app](https://rajgram28.vercel.app)  
**Backend API:** [realtime-chat-app28.up.railway.app](https://realtime-chat-app28.up.railway.app)

---

## 🚀 Features

- JWT Authentication (Register & Login)
- Real-time messaging with Socket.io WebSockets
- Multiple chat rooms (create, join, leave)
- Typing indicators ("User is typing...")
- Online/offline presence tracking
- Message history (last 50 messages loaded on join)
- Rate limiting to prevent spam
- Secure password hashing with bcrypt
- Protected routes (frontend + backend)
- Fully deployed on Vercel + Railway

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Socket.io-client, Axios, React Router |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Caching/Limits | express-rate-limit |
| Deployment | Vercel (frontend), Railway (backend) |

---

## 📁 Project Structure

```
realtime-chat-app/
├── server/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── allowedOrigins.js      # CORS allowed origins
│   ├── controllers/
│   │   ├── authController.js      # Register & Login logic
│   │   └── roomController.js      # Room CRUD logic
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT protection middleware
│   │   └── rateLimiter.js         # Rate limiting middleware
│   ├── models/
│   │   ├── User.js                # User schema
│   │   ├── Room.js                # Room schema
│   │   └── Message.js             # Message schema
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth routes
│   │   └── roomRoutes.js          # /api/rooms routes
│   ├── socket.js                  # Socket.io events
│   ├── index.js                   # Main server entry point
│   └── .env                       # Environment variables
└── client/
    ├── src/
    │   ├── components/            # Reusable UI components
    │   ├── context/
    │   │   ├── AuthContext.jsx    # Global auth state
    │   │   └── SocketContext.jsx  # Global socket connection
    │   ├── pages/
    │   │   ├── Login.jsx          # Login page
    │   │   ├── Register.jsx       # Register page
    │   │   └── Chat.jsx           # Main chat page
    │   ├── utils/
    │   │   └── axios.js           # Axios instance with interceptors
    │   ├── App.jsx                # Routes + protected route
    │   └── main.jsx               # React entry point
    └── vercel.json                # Vercel SPA routing fix
```

---

## ⚙️ How I Built It — Step by Step

### Phase 1 — Environment & Project Setup

1. Verified Node.js (v24) and npm (v11) were installed
2. Created project folder structure with `/server` and `/client` directories
3. Initialized npm in `/server` with `npm init -y`
4. Installed backend packages:
   ```bash
   npm install express socket.io mongoose jsonwebtoken bcryptjs cors dotenv
   npm install --save-dev nodemon
   ```
5. Created `.env` file with `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`
6. Set up basic Express server using `http.createServer(app)` (required for Socket.io)
7. Connected MongoDB Atlas using Mongoose with IPv4 DNS fix:
   ```javascript
   const dns = require('dns');
   dns.setServers(['8.8.8.8', '8.8.4.4']);
   dns.setDefaultResultOrder('ipv4first');
   ```

---

### Phase 2 — Authentication

8. Created `User` model with username, email, password, isOnline fields
   - Used `pre('save')` Mongoose hook to auto-hash passwords with bcrypt
   - Added `matchPassword()` custom method for login comparison
9. Built `/api/auth/register` route — validates input, checks for duplicate email, creates user, returns JWT
10. Tested register route with Postman
11. Built `/api/auth/login` route — finds user by email, compares hashed password, returns JWT
12. Built JWT middleware (`protect`) — reads `Authorization: Bearer token` header, verifies token, attaches user to `req.user`

---

### Phase 3 — Real-Time Messaging with Socket.io

13. Integrated Socket.io into Express server — created `socket.js` with `initializeSocket(server)`
14. Added Socket.io authentication middleware — verifies JWT token from `socket.handshake.auth.token`
15. Handled `connection` and `disconnect` events — updates `isOnline` in MongoDB, broadcasts to all users
16. Created `Message` model (sender, room, content, readBy, timestamps)
17. Created `Room` model (name, description, members, createdBy, lastMessage)
18. Handled all real-time socket events:

| Event (client → server) | Action |
|---|---|
| `join_room` | Join socket room, load last 50 messages |
| `send_message` | Save to MongoDB, broadcast to room |
| `typing` | Broadcast "user is typing" to room |
| `stop_typing` | Broadcast stop typing to room |
| `leave_room` | Leave socket room |

---

### Phase 4 — Room REST API

19. Built room controller with:
    - `POST /api/rooms` — create room
    - `GET /api/rooms` — list all rooms
    - `POST /api/rooms/:id/join` — join a room
    - `POST /api/rooms/:id/leave` — leave a room
20. All room routes protected with JWT middleware

---

### Phase 5 — Rate Limiting

21. Installed `express-rate-limit`
22. Created two limiters:
    - Auth limiter: max 10 requests per 15 minutes
    - API limiter: max 100 requests per 15 minutes
23. Applied to routes in `index.js`

---

### Phase 6 — React Frontend

24. Created React app using Vite: `npm create vite@latest . -- --template react`
25. Installed `socket.io-client`, `axios`, `react-router-dom`
26. Created folder structure: `components/`, `context/`, `pages/`, `utils/`
27. Created Axios instance (`utils/axios.js`) with:
    - `baseURL` pointing to backend
    - Request interceptor to auto-attach JWT token to every request
28. Created `AuthContext` — manages user state, login, register, logout using `localStorage`
29. Created `SocketContext` — connects Socket.io-client using JWT token, provides socket globally
30. Built `Register.jsx` and `Login.jsx` pages with form validation and error handling
31. Set up React Router in `App.jsx` with a `ProtectedRoute` component
32. Built full `Chat.jsx` page with:
    - Sidebar with room list + create room input
    - Real-time message display with sender bubbles
    - Typing indicator
    - Auto-scroll to latest message
    - Keyboard shortcut (Enter to send)

---

### Phase 7 — Deployment

33. Added `.gitignore` files to both `/server` and `/client`
34. Pushed code to GitHub
35. Deployed backend to **Railway**:
    - Set root directory to `/server`
    - Added all environment variables
    - Set start command to `node index.js`
36. Deployed frontend to **Vercel**:
    - Connected GitHub repo
    - Set root directory to `client`
    - Added `VITE_API_URL` and `VITE_SOCKET_URL` environment variables
37. Fixed CORS issues by creating `config/allowedOrigins.js` with exact Vercel domain
38. Fixed React Router refresh 404 by adding `vercel.json`:
    ```json
    {
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    }
    ```
39. Fixed Socket.io pointing to localhost in production — used `import.meta.env.VITE_SOCKET_URL`

---

## 🔧 Running Locally

### Backend
```bash
cd server
npm install
# Create .env with MONGO_URI, JWT_SECRET, PORT, CLIENT_URL
npm run dev
```

### Frontend
```bash
cd client
npm install
# Create .env with VITE_API_URL and VITE_SOCKET_URL
npm run dev
```

Visit `http://localhost:5173`

---

## 🌍 Environment Variables

### Server `.env`
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=yoursecretkey
CLIENT_URL=http://localhost:5173
```

### Client `.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📚 Key Concepts Learned

- **WebSockets** — persistent two-way connection between client and server
- **Socket.io rooms** — broadcast messages only to users in the same room
- **JWT Authentication** — stateless auth using signed tokens
- **bcrypt hashing** — one-way password hashing with salt
- **Mongoose hooks** — `pre('save')` to auto-hash passwords
- **React Context API** — global state for auth and socket
- **Axios interceptors** — auto-attach token to every request
- **Rate limiting** — protect API from spam and abuse
- **CORS** — allow specific origins to access the API
- **Vercel SPA routing** — fix 404 on page refresh with `vercel.json`

---

## 👨‍💻 Author

Built by **Rajkumar Sarker** as a portfolio project for backend engineering roles.

- GitHub: [github.com/rajks18](https://github.com/rajks18)
- LinkedIn: [linkedin.com/in/rajkumar1101](https://linkedin.com/in/rajkumar1101)
