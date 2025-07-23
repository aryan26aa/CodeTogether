import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Code, 
  Users, 
  Zap, 
  Globe, 
  Copy, 
  ArrowRight,
  Sparkles,
  Shield,
  Clock
} from "lucide-react";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("create"); // Default to create

  const navigate = useNavigate();

  const generateRoomId = (e) => {
    e.preventDefault();
    const Id = uuid();
    setRoomId(Id);
    toast.success("Room ID generated successfully!");
  };

  const joinRoom = async () => {
    if (!roomId || !username) {
      toast.error("Both Room ID and Username are required");
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      navigate(`/editor/${roomId}`, {
        state: {
          username,
        },
      });
      toast.success("Welcome to CodeTogether!");
      setIsLoading(false);
    }, 1000);
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  const copyRoomId = async () => {
    if (!roomId) {
      toast.error("Generate a room ID first");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy room ID");
    }
  };

  const features = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "Real-time Collaboration",
      description: "Code together with your team in real-time with live synchronization"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-user Support",
      description: "Support for multiple users with live presence indicators"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Compilation",
      description: "Run and test your code instantly with our integrated compiler"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "C++ Only",
      description: "This platform currently supports only C++ for casting and collaboration."
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 20% 40%, #ffe0b2 30%, #fff8f1 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header className="w-full flex items-center justify-between px-8 py-6" style={{ background: 'transparent' }}>
        <div className="flex items-center gap-3">
          {/* Removed logo */}
          <span style={{ color: '#ff9800', fontWeight: 700, fontSize: 24, marginLeft: 0 }}>CodeTogether</span>
        </div>
        {/* Removed Login button */}
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4" style={{ width: '100%' }}>
        <div style={{ maxWidth: 600, width: '100%', background: 'white', borderRadius: 32, boxShadow: '0 8px 32px #ff980022', padding: '3rem 2rem', margin: '2rem 0', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -48, left: '50%', transform: 'translateX(-50%)', background: '#fff3e0', color: '#ff9800', borderRadius: 16, padding: '12px 28px', fontWeight: 600, fontSize: 16, boxShadow: '0 2px 8px #ff980033', letterSpacing: 0.5, marginBottom: 24 }}>Smart Coding Collaboration</div>
          <div style={{ height: 40 }} />
          <h1 style={{ fontSize: 44, fontWeight: 800, margin: '2.5rem 0 0.5rem', color: '#232336', letterSpacing: -1, fontFamily: 'Inter, sans-serif' }}>
            Start Your <span style={{ color: '#ff9800', background: 'linear-gradient(90deg, #ff9800 60%, #fb8c00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CodeTogether Journey</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: 18, margin: '1.5rem 0 2.5rem' }}>
            Create or join a collaborative C++ coding room. Real-time sync, instant compilation, and a beautiful experience for teams, classrooms, and friends.
          </p>
          <div className="flex justify-center mb-8" style={{ gap: 16 }}>
            <button
              onClick={() => setActiveTab("create")}
              style={{
                background: activeTab === 'create' ? 'linear-gradient(90deg, #ff9800 0%, #fb8c00 100%)' : '#fff3e0',
                color: activeTab === 'create' ? 'white' : '#ff9800',
                border: 'none',
                borderRadius: 24,
                padding: '10px 32px',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: activeTab === 'create' ? '0 2px 8px #ff980033' : 'none',
                cursor: 'pointer',
                marginRight: 8,
                transition: 'all 0.2s',
              }}
            >Create Room</button>
            <button
              onClick={() => setActiveTab("join")}
              style={{
                background: activeTab === 'join' ? 'linear-gradient(90deg, #ff9800 0%, #fb8c00 100%)' : '#fff3e0',
                color: activeTab === 'join' ? 'white' : '#ff9800',
                border: 'none',
                borderRadius: 24,
                padding: '10px 32px',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: activeTab === 'join' ? '0 2px 8px #ff980033' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Join Room</button>
          </div>
          {activeTab === "create" ? (
            <div style={{ marginTop: 24 }}>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your name"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: '2px solid #ffe0b2',
                  fontSize: 18,
                  marginBottom: 18,
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  background: '#fff8f1',
                  color: '#232336',
                  fontWeight: 500,
                  boxSizing: 'border-box',
                }}
                onKeyUp={handleInputEnter}
              />
              <div className="flex gap-3 mb-4">
                <button
                  onClick={generateRoomId}
                  style={{
                    background: 'linear-gradient(90deg, #ff9800 0%, #fb8c00 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 16,
                    padding: '12px 24px',
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: '0 2px 8px #ff980033',
                    cursor: 'pointer',
                  }}
                >Generate Room ID</button>
                {roomId && (
                  <button
                    onClick={copyRoomId}
                    style={{
                      background: '#fff3e0',
                      color: '#ff9800',
                      border: 'none',
                      borderRadius: 16,
                      padding: '12px 24px',
                      fontWeight: 700,
                      fontSize: 16,
                      boxShadow: '0 2px 8px #ff980033',
                      cursor: 'pointer',
                    }}
                  >Copy</button>
                )}
              </div>
              {roomId && (
                <div style={{ background: '#fff3e0', color: '#ff9800', borderRadius: 12, padding: '12px 20px', fontWeight: 600, fontSize: 18, marginBottom: 18 }}>
                  Room ID: <span style={{ fontFamily: 'monospace', background: '#fff8f1', padding: '2px 8px', borderRadius: 8 }}>{roomId}</span>
                </div>
              )}
              <button
                onClick={joinRoom}
                disabled={!roomId || !username || isLoading}
                style={{
                  background: 'linear-gradient(90deg, #ff9800 0%, #fb8c00 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 24,
                  padding: '14px 0',
                  fontWeight: 700,
                  fontSize: 18,
                  width: '100%',
                  boxShadow: '0 2px 8px #ff980033',
                  cursor: !roomId || !username || isLoading ? 'not-allowed' : 'pointer',
                  opacity: !roomId || !username || isLoading ? 0.7 : 1,
                  marginTop: 8,
                }}
              >{isLoading ? 'Creating Room...' : 'Create & Join Room'}</button>
            </div>
          ) : (
            <div style={{ marginTop: 24 }}>
              <input
                type="text"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: '2px solid #ffe0b2',
                  fontSize: 18,
                  marginBottom: 18,
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  background: '#fff8f1',
                  color: '#232336',
                  fontWeight: 500,
                  boxSizing: 'border-box',
                }}
                onKeyUp={handleInputEnter}
              />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your name"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: '2px solid #ffe0b2',
                  fontSize: 18,
                  marginBottom: 18,
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  background: '#fff8f1',
                  color: '#232336',
                  fontWeight: 500,
                  boxSizing: 'border-box',
                }}
                onKeyUp={handleInputEnter}
              />
              <button
                onClick={joinRoom}
                disabled={!roomId || !username || isLoading}
                style={{
                  background: 'linear-gradient(90deg, #ff9800 0%, #fb8c00 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 24,
                  padding: '14px 0',
                  fontWeight: 700,
                  fontSize: 18,
                  width: '100%',
                  boxShadow: '0 2px 8px #ff980033',
                  cursor: !roomId || !username || isLoading ? 'not-allowed' : 'pointer',
                  opacity: !roomId || !username || isLoading ? 0.7 : 1,
                  marginTop: 8,
                }}
              >{isLoading ? 'Joining...' : 'Join Room'}</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;
