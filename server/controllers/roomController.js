 const Room = require('../models/Room');

// @route  POST /api/rooms
const createRoom = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    // Check if room already exists
    const roomExists = await Room.findOne({ name });
    if (roomExists) {
      return res.status(400).json({ message: 'Room already exists' });
    }

    // Create room — creator is automatically a member
    const room = await Room.create({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(room);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('createdBy', 'username')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json(rooms);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/rooms/:id/join
const joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if already a member
    const isMember = room.members.includes(req.user._id);
    if (isMember) {
      return res.status(400).json({ message: 'Already a member' });
    }

    // Add user to members
    room.members.push(req.user._id);
    await room.save();

    res.status(200).json({ message: 'Joined room successfully', room });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/rooms/:id/leave
const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Remove user from members
    room.members = room.members.filter(
      (member) => member.toString() !== req.user._id.toString()
    );
    await room.save();

    res.status(200).json({ message: 'Left room successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRoom, getRooms, joinRoom, leaveRoom };