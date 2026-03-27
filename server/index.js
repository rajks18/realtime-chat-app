const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const initializeSocket = require('./socket');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = initializeSocket(server);

// app.use(cors({ origin: process.env.CLIENT_URL }));
// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:3000'],
//   credentials: true,
// }));

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
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Apply rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/rooms', apiLimiter, roomRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Chat server is running! 🚀' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});