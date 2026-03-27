# 📋 Real-Time Chat App — Complete Build Documentation
## All 39 Steps — Exactly What Was Done

---

## 🔧 Phase 1 — Environment & Project Setup

---

### ✅ Step 1 — Check Node.js & npm

**What to do:**
Open terminal and run:
```bash
node -v
npm -v
```

**Expected output:**
```
v24.14.0
11.9.0
```

**Result:** Node v24.14.0 and npm v11.9.0 confirmed installed.

---

### ✅ Step 2 — Create Project Folder Structure

**What to do:**
```bash
mkdir realtime-chat-app
cd realtime-chat-app
mkdir server client
```

Verify with:
```bash
dir
```

**Expected output:**
```
realtime-chat-app/
├── server/
└── client/
```

**Result:** Both folders created successfully.

---

### ✅ Step 3 — Initialize npm in `/server`

**What to do:**
```bash
cd server
npm init -y
```

**Expected output:**
```
Wrote to .../server/package.json
```

**Result:** `package.json` created inside `/server`.

---

### ✅ Step 4 — Install Backend Packages

**What to do:**
```bash
npm install express socket.io mongoose jsonwebtoken bcryptjs cors dotenv
npm install --save-dev nodemon
```

| Package | Purpose |
|---|---|
| express | Web server & REST API |
| socket.io | Real-time WebSocket communication |
| mongoose | Connect & interact with MongoDB |
| jsonwebtoken | Create & verify JWT tokens |
| bcryptjs | Hash passwords securely |
| cors | Allow frontend to talk to backend |
| dotenv | Load secrets from .env file |
| nodemon | Auto-restart server on file save |

**Result:** All packages installed successfully.

---

### ✅ Step 5 — Create `.env` File

**What to do:**
```bash
echo. > .env
```

Open `.env` and paste:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/realtime-chat
JWT_SECRET=mysupersecretkey123
CLIENT_URL=http://localhost:3000
```

Update `package.json` scripts:
```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

**Result:** `.env` file created and scripts updated.

---

### ✅ Step 6 — Create Basic Express Server

**What to do:**
```bash
echo. > index.js
```

Open `index.js` and paste:
```javascript
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Chat server is running! 🚀' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Run server:
```bash
npm run dev
```

Visit `http://localhost:5000` — should see:
```json
{ "message": "Chat server is running! 🚀" }
```

**Result:** Express server running successfully on port 5000.

---

### ✅ Step 7 — Connect MongoDB Atlas

**What to do:**
```bash
mkdir config
echo. > config/db.js
```

Open `config/db.js` and paste:
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

Update `index.js` to add DNS fix and MongoDB connection:
```javascript
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');
```

Update `.env` with real Atlas connection string:
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/realtime-chat?retryWrites=true&w=majority
```

**Issues faced & fixed:**
- `ECONNREFUSED` error → Fixed by allowing IP in Atlas Network Access
- DNS issue → Fixed using `dns.setServers(['8.8.8.8', '8.8.4.4'])` in `index.js`

**Result:** MongoDB Atlas connected — `MongoDB connected: ac-2f3jssz-shard-00-02.f5oqjbq.mongodb.net`

---

## 🔐 Phase 2 — Authentication

---

### ✅ Step 8 — Create the User Model

**What to do:**
```bash
mkdir models
echo. > models/User.js
```

Open `models/User.js` and paste:
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    avatar: {
      type: String,
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords on login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

**Result:** User model created with auto password hashing.

---

### ✅ Step 9 — Build `/auth/register` Route

**What to do:**
```bash
mkdir routes controllers
echo. > routes/authRoutes.js
echo. > controllers/authController.js
```

Open `controllers/authController.js` and paste:
```javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser };
```

Open `routes/authRoutes.js` and paste:
```javascript
const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/authController');

router.post('/register', registerUser);

module.exports = router;
```

Add to `index.js`:
```javascript
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
```

**Result:** Register route created and connected.

---

### ✅ Step 10 — Test Register Route with Postman

**What to do:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "username": "ishan",
  "email": "ishan@gmail.com",
  "password": "hello123"
}
```

**Issues faced & fixed:**
- Got `"next is not a function"` error
- Fixed by removing `next` parameter from `pre('save')` hook in newer Mongoose versions

**Expected response:**
```json
{
  "_id": "69c5d031150139296330f08f",
  "username": "ishan",
  "email": "ishan@gmail.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Result:** Registration working, JWT token returned successfully.

---

### ✅ Step 11 — Build `/auth/login` Route

**What to do:**
Add `loginUser` to `controllers/authController.js`:
```javascript
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
```

Add login route to `routes/authRoutes.js`:
```javascript
router.post('/login', loginUser);
```

**Test in Postman:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/login`
- Body: `{ "email": "ishan@gmail.com", "password": "hello123" }`

**Result:** Login working, wrong password returns 401 error.

---

### ✅ Step 12 — Build JWT Middleware

**What to do:**
```bash
mkdir middleware
echo. > middleware/authMiddleware.js
```

Open `middleware/authMiddleware.js` and paste:
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } else {
      res.status(401).json({ message: 'Not authorized, no token' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
```

Add protected test route to `authRoutes.js`:
```javascript
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});
```

**Test in Postman:**
- Method: `GET`
- URL: `http://localhost:5000/api/auth/me`
- Headers: `Authorization: Bearer your_token_here`

**Result:** JWT middleware working — protected routes return user data with valid token.

---

## ⚡ Phase 3 — Real-Time Messaging with Socket.io

---

### ✅ Step 13 — Integrate Socket.io into Express Server

**What to do:**
```bash
echo. > socket.js
```

Open `socket.js` and paste initial Socket.io setup with JWT authentication middleware:
```javascript
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const initializeSocket = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username}`);
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });
    socket.broadcast.emit('user_online', {
      userId: socket.user._id,
      username: socket.user.username,
    });

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(socket.user._id, { isOnline: false });
      socket.broadcast.emit('user_offline', {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });
  });

  return io;
};

module.exports = initializeSocket;
```

Update `index.js`:
```javascript
const initializeSocket = require('./socket');
const io = initializeSocket(server);
```

**Result:** Socket.io integrated — server running with no errors.

---

### ✅ Step 14 — Create the Message Model

**What to do:**
```bash
echo. > models/Message.js
```

Open `models/Message.js` and paste:
```javascript
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
```

**Result:** Message model created.

---

### ✅ Step 15 — Create the Room Model

**What to do:**
```bash
echo. > models/Room.js
```

Open `models/Room.js` and paste:
```javascript
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      unique: true,
      trim: true,
    },
    description: { type: String, default: '' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
```

**Result:** Room model created.

---

### ✅ Step 16 — Handle Real-Time Socket Events

**What to do:**
Updated `socket.js` with all real-time events:

| Event (client sends) | Action |
|---|---|
| `join_room` | Join socket room, load last 50 messages, broadcast user joined |
| `send_message` | Save to MongoDB, populate sender, broadcast to room |
| `typing` | Broadcast typing indicator to room |
| `stop_typing` | Broadcast stop typing to room |
| `leave_room` | Leave socket room, broadcast user left |

| Event (server sends) | Meaning |
|---|---|
| `message_history` | Last 50 messages on room join |
| `new_message` | New message broadcast to room |
| `user_typing` | Someone is typing |
| `user_stop_typing` | Someone stopped typing |
| `user_joined` | Someone joined the room |
| `user_left` | Someone left the room |
| `user_online` | Someone connected |
| `user_offline` | Someone disconnected |

**Result:** Full real-time messaging system working.

---

## 🏠 Phase 4 — Room REST API

---

### ✅ Step 17 — Build Room Routes

**What to do:**
```bash
echo. > controllers/roomController.js
echo. > routes/roomRoutes.js
```

Created 4 routes in `roomController.js`:
- `POST /api/rooms` — create room (creator auto-added as member)
- `GET /api/rooms` — list all rooms with populated lastMessage
- `POST /api/rooms/:id/join` — add user to members array
- `POST /api/rooms/:id/leave` — remove user from members array

All routes protected with JWT middleware.

Added to `index.js`:
```javascript
const roomRoutes = require('./routes/roomRoutes');
app.use('/api/rooms', roomRoutes);
```

**Test in Postman:**
- Method: `POST`
- URL: `http://localhost:5000/api/rooms`
- Headers: `Authorization: Bearer token`
- Body: `{ "name": "general", "description": "General chat room" }`

**Result:** Room created successfully in MongoDB.

---

## 🛡️ Phase 5 — Rate Limiting

---

### ✅ Step 18 — Add Rate Limiting

**What to do:**
```bash
npm install express-rate-limit
echo. > middleware/rateLimiter.js
```

Open `middleware/rateLimiter.js` and paste:
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts, please try again after 15 minutes' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please slow down!' },
});

module.exports = { authLimiter, apiLimiter };
```

Applied in `index.js`:
```javascript
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/rooms', apiLimiter, roomRoutes);
```

**Result:** Rate limiting working — 10 requests per 15 min on auth routes.

---

## ⚛️ Phase 6 — React Frontend

---

### ✅ Step 19 — Create React App with Vite

**What to do:**
```bash
cd ../client
npm create vite@latest . -- --template react
npm install
npm install socket.io-client axios react-router-dom
npm run dev
```

Visit `http://localhost:5173` — default Vite + React page shows.

**Result:** React app running on port 5173.

---

### ✅ Step 20 — Set Up Folder Structure + Axios + Auth Context

**What to do:**
```bash
mkdir components context pages utils
echo. > utils/axios.js
echo. > context/AuthContext.jsx
```

`utils/axios.js` — Axios instance with auto token interceptor:
```javascript
import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
```

`context/AuthContext.jsx` — global auth state with login, register, logout functions using localStorage.

Updated `main.jsx` to wrap app with `AuthProvider`.

**Result:** Folder structure set up, Axios configured, Auth context ready.

---

### ✅ Step 21 — Build Login & Register Pages

**What to do:**
```bash
echo. > pages/Login.jsx
echo. > pages/Register.jsx
echo. > pages/Chat.jsx
```

Built `Register.jsx` with form fields: username, email, password — calls `register()` from AuthContext on submit.

Built `Login.jsx` with form fields: email, password — calls `login()` from AuthContext on submit.

Updated `App.jsx` with React Router:
```javascript
<BrowserRouter>
  <Routes>
    <Route path="/login"    element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/chat"     element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/"         element={<Navigate to="/login" />} />
  </Routes>
</BrowserRouter>
```

Added `ProtectedRoute` component — redirects to `/login` if no user in context.

**Issues faced & fixed:**
- Registration failing — CORS error
- Fixed by updating server CORS:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
```
- Updated `.env` `CLIENT_URL=http://localhost:5173`

**Result:** Login and Register pages working correctly.

---

### ✅ Step 22 — Build the Full Chat Page

**What to do:**
```bash
echo. > context/SocketContext.jsx
```

`context/SocketContext.jsx` — connects Socket.io-client using JWT token:
```javascript
const newSocket = io(
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  { auth: { token: localStorage.getItem('token') } }
);
```

Updated `main.jsx` to wrap app with `SocketProvider`.

Built full `Chat.jsx` with:
- Sidebar with room list and create room input
- Message area with sender bubbles (own messages on right, others on left)
- Typing indicator
- Auto-scroll to latest message
- Enter key to send message
- Join/leave room on sidebar click

Socket events handled in Chat:
- `message_history` → set messages on room join
- `new_message` → append to messages
- `user_typing` → show typing indicator
- `user_stop_typing` → hide typing indicator

**Result:** Full real-time chat working — messages send and receive instantly.

---

## 🚀 Phase 7 — Deployment & Fixes

---

### ✅ Step 23 — Add .gitignore Files

**What to do:**
```bash
# In server folder
echo node_modules > .gitignore
echo .env >> .gitignore

# In client folder
echo node_modules > .gitignore
echo dist >> .gitignore
```

**Result:** Both `.gitignore` files created.

---

### ✅ Step 24 — Push to GitHub

**What to do:**
```bash
cd ..   # go to root
git init
echo node_modules > .gitignore
echo .env >> .gitignore
git add .
git commit -m "Initial commit - Real-time chat app"
git remote add origin https://github.com/yourusername/realtime-chat-app.git
git branch -M main
git push -u origin main
```

**Result:** Code pushed to GitHub successfully.

---

### ✅ Step 25 — Deploy Backend to Railway

**What to do:**
1. Go to [railway.app](https://railway.app) → sign up with GitHub
2. New Project → Deploy from GitHub repo
3. Select `realtime-chat-app` repository
4. Settings → Root Directory → set to `/server`
5. Variables tab → add:
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=mysupersecretkey123
CLIENT_URL=https://your-vercel-url.vercel.app
```
6. Settings → Start Command → `node index.js`
7. Click Deploy

**Result:** Backend deployed at `https://realtime-chat-app28.up.railway.app`

---

### ✅ Step 26 — Deploy Frontend to Vercel (Website Method)

**What to do:**
1. Go to [vercel.com](https://vercel.com) → login with GitHub
2. New Project → Import Git Repository → select repo
3. Root Directory → set to `client`
4. Environment Variables → add:
```
VITE_API_URL    = https://realtime-chat-app28.up.railway.app/api
VITE_SOCKET_URL = https://realtime-chat-app28.up.railway.app
```
5. Click Deploy

**Note:** Initially tried Vercel CLI but accidentally installed it in root folder. Fixed with:
```bash
npm uninstall vercel          # uninstall from root
npm install -g vercel         # install globally
```
Then switched to website deployment method instead.

**Result:** Frontend deployed at `https://rajgram28.vercel.app`

---

### ✅ Step 27 — Fix CORS Error (First Fix)

**Issue:**
```
Access to XMLHttpRequest blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present
```

**Fix — updated `server/index.js`:**
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://rajgram28.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

Updated Railway `CLIENT_URL` variable to `https://rajgram28.vercel.app`.

Pushed to GitHub — Railway auto-redeployed.

**Result:** CORS fixed for REST API requests.

---

### ✅ Step 28 — Fix Socket.io Pointing to Localhost

**Issue:**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED localhost:5000/socket.io/
```

**Fix — updated `context/SocketContext.jsx`:**
```javascript
const newSocket = io(
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  { auth: { token: localStorage.getItem('token') } }
);
```

Pushed to GitHub — Vercel auto-redeployed.

**Result:** Socket.io now connects to Railway backend instead of localhost.

---

### ✅ Step 29 — Fix CORS Trailing Slash Issue

**Issue:**
```
The 'Access-Control-Allow-Origin' header has a value
'https://rajgram28.vercel.app/' that is not equal to the supplied origin
```

The problem was a trailing slash `/` in the origin value.

**Fix — created `config/allowedOrigins.js`:**
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://real-time-chat288.vercel.app',
  'https://rajgram28.vercel.app',
];

module.exports = allowedOrigins;
```

Updated `index.js` and `socket.js` to use function-based CORS:
```javascript
const allowedOrigins = require('./config/allowedOrigins');

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

Pushed to GitHub — Railway auto-redeployed.

**Result:** CORS trailing slash issue fixed — Socket.io connecting successfully.

---

### ✅ Step 30 — Fix Page Refresh 404 on Vercel

**Issue:**
Refreshing `/chat` page on Vercel showed 404 error because Vercel couldn't find the route.

**Fix — created `client/vercel.json`:**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Pushed to GitHub — Vercel auto-redeployed.

**Result:** Page refresh works correctly — React Router handles all routes.

---

### ✅ Steps 31–39 — Final Testing & README

**Step 31:** Verified messages sending and receiving in real time between two browser tabs  
**Step 32:** Verified typing indicators working  
**Step 33:** Verified online/offline presence tracking  
**Step 34:** Verified room creation and joining  
**Step 35:** Verified message history loads on room join  
**Step 36:** Verified rate limiting works (10 req/15min on auth)  
**Step 37:** Verified protected routes reject requests without token  
**Step 38:** Added `.gitignore` to root project folder  
**Step 39:** Generated professional README.md and STEPS_DOCUMENTATION.md  

---

## 📊 Final Project Summary

| Item | Detail |
|---|---|
| Total Steps | 39 |
| Total Phases | 7 |
| Backend | Node.js + Express + Socket.io |
| Database | MongoDB Atlas |
| Frontend | React + Vite |
| Auth | JWT + bcrypt |
| Real-time | Socket.io WebSockets |
| Rate Limiting | express-rate-limit |
| Backend Deployed | Railway |
| Frontend Deployed | Vercel |
| Live URL | https://rajgram28.vercel.app |

---

## 🗂️ Final Folder Structure

```
realtime-chat-app/
├── server/
│   ├── config/
│   │   ├── db.js
│   │   └── allowedOrigins.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── roomController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Room.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── roomRoutes.js
│   ├── socket.js
│   ├── index.js
│   ├── .env
│   ├── .gitignore
│   └── package.json
└── client/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Chat.jsx
    │   ├── utils/
    │   │   └── axios.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── vercel.json
    ├── .env
    ├── .gitignore
    └── package.json
```

---

*Documentation generated after completing full build — Real-Time Chat App by Ishan*
