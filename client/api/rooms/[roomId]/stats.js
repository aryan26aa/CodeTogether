export default function handler(req, res) {
  const { roomId } = req.query;
  res.json({
    roomId,
    connectedUsers: 0,
    users: [],
    messageCount: 0
  });
} 