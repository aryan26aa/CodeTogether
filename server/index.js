const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");
const cors = require("cors");
const axios = require("axios");
const server = http.createServer(app);
require("dotenv").config();
const path = require("path");

const languageConfig = {
  python3: { versionIndex: "3" },
  java: { versionIndex: "3" },
  cpp: { versionIndex: "4" },
  nodejs: { versionIndex: "3" },
  c: { versionIndex: "4" },
  ruby: { versionIndex: "3" },
  go: { versionIndex: "3" },
  scala: { versionIndex: "3" },
  bash: { versionIndex: "3" },
  sql: { versionIndex: "3" },
  pascal: { versionIndex: "2" },
  csharp: { versionIndex: "3" },
  php: { versionIndex: "3" },
  swift: { versionIndex: "3" },
  rust: { versionIndex: "3" },
  r: { versionIndex: "3" },
};

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from React app
app.use(express.static(path.join(__dirname, "build")));

// Fallback to React for any unknown routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {};
const roomMessages = {}; // Store chat messages for each room
const userTypingMap = {}; // Track typing status

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  console.log('Socket connected:', socket.id);
  
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    
    // Initialize room messages if not exists
    if (!roomMessages[roomId]) {
      roomMessages[roomId] = [];
    }
    
    const clients = getAllConnectedClients(roomId);
    
    // Notify all clients in the room about the new user
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
    
    // Send existing messages to the new user
    socket.emit("chat_history", roomMessages[roomId]);
    
    console.log(`User ${username} joined room ${roomId}`);
  });

  // Handle code changes
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  
  // Sync code when new user joins
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // Handle chat messages
  socket.on("chat_message", ({ username, message, timestamp }) => {
    const roomId = Array.from(socket.rooms)[1]; // Get the room ID (first room is socket ID)
    if (roomId) {
      const messageData = { username, message, timestamp };
      
      // Store message in room history
      if (!roomMessages[roomId]) {
        roomMessages[roomId] = [];
      }
      roomMessages[roomId].push(messageData);
      
      // Keep only last 100 messages per room
      if (roomMessages[roomId].length > 100) {
        roomMessages[roomId] = roomMessages[roomId].slice(-100);
      }
      
      // Broadcast to all users in the room
      socket.to(roomId).emit("chat_message", messageData);
      
      console.log(`Chat message in room ${roomId}: ${username}: ${message}`);
    }
  });

  // Handle typing indicators
  socket.on("user_typing", ({ username }) => {
    const roomId = Array.from(socket.rooms)[1];
    if (roomId) {
      userTypingMap[socket.id] = { username, roomId };
      socket.to(roomId).emit("user_typing", { username });
      
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        if (userTypingMap[socket.id]) {
          delete userTypingMap[socket.id];
          socket.to(roomId).emit("user_stopped_typing", { username });
        }
      }, 3000);
    }
  });

  // Handle user disconnection
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    const username = userSocketMap[socket.id];
    
    // Notify all rooms about the disconnection
    rooms.forEach((roomId) => {
      if (roomId !== socket.id) { // Skip socket's own room
        socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: username,
        });
        
        // Clean up typing indicator
        if (userTypingMap[socket.id]) {
          delete userTypingMap[socket.id];
          socket.to(roomId).emit("user_stopped_typing", { username });
        }
      }
    });

    // Clean up user data
    delete userSocketMap[socket.id];
    socket.leave();
    
    console.log(`User ${username} disconnected`);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Enhanced compile endpoint with better error handling
app.post("/compile", async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ 
      error: "Code and language are required" 
    });
  }

  if (!languageConfig[language]) {
    return res.status(400).json({ 
      error: "Unsupported programming language" 
    });
  }

  // Check if JDoodle credentials are available
  const clientId = process.env.jDoodle_clientId;
  const clientSecret = process.env.kDoodle_clientSecret;

  if (!clientId || !clientSecret) {
    // Return a mock response for demonstration
    console.log("JDoodle credentials not found, using mock response");
    return res.json({
      output: `// Mock execution for ${language}\n\nYour code:\n${code}\n\nOutput: Hello from CodeTogether!\n\nNote: This is a mock execution. To enable real code compilation, please add your JDoodle API credentials to the .env file.`,
      memory: "0 MB",
      cpuTime: "0.001",
      compilationStatus: "success",
      isMock: true
    });
  }

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      script: code,
      language: language,
      versionIndex: languageConfig[language].versionIndex,
      clientId: clientId,
      clientSecret: clientSecret,
    }, {
      timeout: 10000 // 10 second timeout
    });

    // Enhanced response handling
    const result = response.data;
    
    if (result.statusCode === 200) {
      res.json({
        output: result.output,
        memory: result.memory,
        cpuTime: result.cpuTime,
        compilationStatus: "success"
      });
    } else {
      res.json({
        output: result.output || "Compilation failed",
        error: result.error || "Unknown error occurred",
        compilationStatus: "error"
      });
    }
  } catch (error) {
    console.error("Compilation error:", error);
    
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({ 
        error: "Request timeout. Please try again." 
      });
    } else if (error.response) {
      res.status(error.response.status).json({ 
        error: error.response.data?.error || "Compilation service error" 
      });
    } else {
      res.status(500).json({ 
        error: "Failed to compile code. Please check your internet connection." 
      });
    }
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    connectedUsers: Object.keys(userSocketMap).length,
    activeRooms: io.sockets.adapter.rooms.size
  });
});

// Get room statistics
app.get("/rooms/:roomId/stats", (req, res) => {
  const { roomId } = req.params;
  const clients = getAllConnectedClients(roomId);
  
  res.json({
    roomId,
    connectedUsers: clients.length,
    users: clients.map(client => client.username),
    messageCount: roomMessages[roomId]?.length || 0
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 CodeTogether Server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  
  // Check if JDoodle credentials are available
  if (!process.env.jDoodle_clientId || !process.env.kDoodle_clientSecret) {
    console.log(`⚠️  JDoodle API credentials not found. Code execution will use mock responses.`);
    console.log(`   To enable real code compilation, add your JDoodle credentials to the .env file:`);
    console.log(`   jDoodle_clientId=your_client_id`);
    console.log(`   kDoodle_clientSecret=your_client_secret`);
  } else {
    console.log(`✅ JDoodle API credentials found. Real code compilation enabled.`);
  }
});

console.log(process.env.jDoodle_clientId);
console.log(process.env.kDoodle_clientSecret);