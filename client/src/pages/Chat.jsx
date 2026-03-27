import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from '../utils/axios';

const Chat = () => {
  const { user, logout }      = useAuth();
  const { socket }            = useSocket();
  const [rooms, setRooms]         = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeout  = useRef(null);

  // Load rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await axios.get('/rooms');
      setRooms(data);
    };
    fetchRooms();
  }, []);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('message_history', (msgs) => setMessages(msgs));

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user_typing', ({ username }) => {
      setTypingUser(`${username} is typing...`);
    });

    socket.on('user_stop_typing', () => setTypingUser(''));

    return () => {
      socket.off('message_history');
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const joinRoom = (room) => {
    if (currentRoom) socket.emit('leave_room', currentRoom._id);
    setCurrentRoom(room);
    setMessages([]);
    socket.emit('join_room', room._id);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !currentRoom) return;
    socket.emit('send_message', {
      roomId: currentRoom._id,
      content: newMessage,
    });
    setNewMessage('');
    socket.emit('stop_typing', currentRoom._id);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!currentRoom) return;
    socket.emit('typing', currentRoom._id);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', currentRoom._id);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const { data } = await axios.post('/rooms', { name: newRoomName });
      setRooms((prev) => [...prev, data]);
      setNewRoomName('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating room');
    }
  };

  return (
    <div style={s.app}>

      {/* SIDEBAR */}
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <h3 style={s.appName}>💬 ChatApp</h3>
          <p style={s.username}>@{user?.username}</p>
          <button onClick={logout} style={s.logoutBtn}>Logout</button>
        </div>

        {/* Create Room */}
        <div style={s.createRoom}>
          <input
            style={s.roomInput}
            placeholder="New room name..."
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createRoom()}
          />
          <button onClick={createRoom} style={s.createBtn}>+</button>
        </div>

        {/* Room List */}
        <div style={s.roomList}>
          {rooms.map((room) => (
            <div
              key={room._id}
              style={{
                ...s.roomItem,
                background: currentRoom?._id === room._id ? '#6c63ff' : 'transparent',
                color: currentRoom?._id === room._id ? '#fff' : '#333',
              }}
              onClick={() => joinRoom(room)}
            >
              # {room.name}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div style={s.main}>
        {currentRoom ? (
          <>
            {/* Header */}
            <div style={s.chatHeader}>
              <h3># {currentRoom.name}</h3>
              <p style={s.roomDesc}>{currentRoom.description}</p>
            </div>

            {/* Messages */}
            <div style={s.messages}>
              {messages.map((msg) => {
                const isMe = msg.sender._id === user?._id ||
                             msg.sender._id === user?._id?.toString();
                return (
                  <div key={msg._id} style={{
                    ...s.message,
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                  }}>
                    {!isMe && (
                      <p style={s.senderName}>{msg.sender.username}</p>
                    )}
                    <div style={{
                      ...s.bubble,
                      background: isMe ? '#6c63ff' : '#f0f0f0',
                      color: isMe ? '#fff' : '#333',
                    }}>
                      {msg.content}
                    </div>
                    <p style={s.time}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {typingUser && (
              <p style={s.typing}>{typingUser}</p>
            )}

            {/* Input */}
            <div style={s.inputArea}>
              <input
                style={s.messageInput}
                placeholder={`Message #${currentRoom.name}...`}
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
              />
              <button onClick={sendMessage} style={s.sendBtn}>Send</button>
            </div>
          </>
        ) : (
          <div style={s.noRoom}>
            <h2>Welcome, {user?.username}! 👋</h2>
            <p>Select a room from the sidebar to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

const s = {
  app:          { display:'flex', height:'100vh', fontFamily:'sans-serif' },
  sidebar:      { width:'260px', background:'#1a1a2e', display:'flex', flexDirection:'column', color:'#fff' },
  sidebarHeader:{ padding:'20px', borderBottom:'1px solid #2d2d44' },
  appName:      { margin:'0 0 4px', fontSize:'18px' },
  username:     { margin:'0 0 10px', color:'#aaa', fontSize:'13px' },
  logoutBtn:    { background:'#ff4757', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontSize:'12px' },
  createRoom:   { display:'flex', gap:'8px', padding:'12px 16px', borderBottom:'1px solid #2d2d44' },
  roomInput:    { flex:1, padding:'8px', borderRadius:'6px', border:'none', fontSize:'13px', background:'#2d2d44', color:'#fff' },
  createBtn:    { background:'#6c63ff', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 12px', cursor:'pointer', fontSize:'16px' },
  roomList:     { flex:1, overflowY:'auto', padding:'8px' },
  roomItem:     { padding:'10px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'14px', marginBottom:'4px' },
  main:         { flex:1, display:'flex', flexDirection:'column', background:'#f8f9fa' },
  chatHeader:   { padding:'16px 20px', background:'#fff', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:'12px' },
  roomDesc:     { margin:0, color:'#888', fontSize:'13px' },
  messages:     { flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'8px' },
  message:      { display:'flex', flexDirection:'column', maxWidth:'60%' },
  senderName:   { margin:'0 0 2px 4px', fontSize:'12px', color:'#888' },
  bubble:       { padding:'10px 14px', borderRadius:'12px', fontSize:'14px', lineHeight:'1.5' },
  time:         { margin:'2px 4px 0', fontSize:'11px', color:'#aaa' },
  typing:       { padding:'4px 20px', fontSize:'12px', color:'#888', fontStyle:'italic' },
  inputArea:    { display:'flex', gap:'10px', padding:'16px 20px', background:'#fff', borderTop:'1px solid #eee' },
  messageInput: { flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'14px' },
  sendBtn:      { padding:'12px 24px', background:'#6c63ff', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px' },
  noRoom:       { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', color:'#888' },
};

export default Chat;