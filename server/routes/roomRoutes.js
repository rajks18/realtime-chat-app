 const express = require('express');
const router = express.Router();
const { createRoom, getRooms, joinRoom, leaveRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRoom);
router.get('/', protect, getRooms);
router.post('/:id/join', protect, joinRoom);
router.post('/:id/leave', protect, leaveRoom);

module.exports = router;