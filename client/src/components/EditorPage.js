import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import {
  useNavigate,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code,
  Users,
  MessageSquare,
  Play,
  Copy,
  LogOut,
  Settings,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
  Monitor,
  Download,
  Share2,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreHorizontal,
  Save,
  FolderOpen,
  Trash2,
  Edit3,
  Clock,
  Zap
} from "lucide-react";

// List of supported languages with icons and descriptions
const LANGUAGES = [
  { id: "cpp", name: "C++", icon: "⚡", description: "C++ 17" },
];

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [outputError, setOutputError] = useState("");
  const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [files, setFiles] = useState([
    { id: 1, name: "main.cpp", language: "cpp", content: "", isActive: true }
  ]);
  const [activeFileId, setActiveFileId] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [executionHistory, setExecutionHistory] = useState([]);
  // Remove theme state
  
  const codeRef = useRef(null);
  const chatRef = useRef(null);
  const messageInputRef = useRef(null);

  const Location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const socketRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      const handleErrors = (err) => {
        console.log("Error", err);
        toast.error("Connection failed. Please try again.");
        navigate("/");
      };

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: Location.state?.username,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== Location.state?.username) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });

      // Chat functionality
      socketRef.current.on("chat_message", ({ username, message, timestamp }) => {
        setMessages(prev => [...prev, { username, message, timestamp, isOwn: username === Location.state?.username }]);
      });

      socketRef.current.on("user_typing", ({ username }) => {
        if (username !== Location.state?.username) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });
    };
    init();

    return () => {
      socketRef.current && socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.off("chat_message");
      socketRef.current.off("user_typing");
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  if (!Location.state) {
    return <Navigate to="/" />;
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch (error) {
      console.log(error);
      toast.error("Unable to copy the room ID");
    }
  };

  const leaveRoom = async () => {
    navigate("/");
  };

  const runCode = async () => {
    setIsCompiling(true);
    setOutputError("");
    try {
      const response = await axios.post("https://codetogether-j8fx.onrender.com/compile", {
        code: codeRef.current,
        language: selectedLanguage,
      });
      
      const result = response.data.output || JSON.stringify(response.data);
      setOutput(result);
      setOutputError("");
      // Add to execution history
      setExecutionHistory(prev => [{
        id: Date.now(),
        language: selectedLanguage,
        code: codeRef.current,
        output: result,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]); // Keep last 10 executions
      
      if (response.data.compilationStatus === "error" || response.data.error) {
        setOutputError(response.data.error || "Compilation failed");
        toast.error(response.data.error || "Compilation failed");
      } else {
        toast.success("Code executed successfully!");
      }
    } catch (error) {
      console.error("Error compiling code:", error);
      const errorMessage = error.response?.data?.error || "An error occurred during compilation";
      setOutputError(errorMessage);
      setOutput("");
      toast.error(errorMessage);
    } finally {
      setIsCompiling(false);
    }
  };

  const toggleCompileWindow = () => {
    setIsCompileWindowOpen(!isCompileWindowOpen);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const messageData = {
      username: Location.state?.username,
      message: newMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    socketRef.current.emit("chat_message", messageData);
    setNewMessage("");
  };

  const handleTyping = () => {
    socketRef.current.emit("user_typing", { username: Location.state?.username });
  };

  const createNewFile = () => {
    const newFile = {
      id: Date.now(),
      name: `file_${files.length + 1}.cpp`,
      language: "cpp",
      content: "",
      isActive: false
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const deleteFile = (fileId) => {
    if (files.length === 1) {
      toast.error("Cannot delete the last file");
      return;
    }
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFileId === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId);
      setActiveFileId(remainingFiles[0]?.id);
    }
  };

  const downloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([codeRef.current], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `codetogether_${selectedLanguage}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Code downloaded successfully!");
  };

  const shareRoom = async () => {
    try {
      await navigator.share({
        title: 'CodeTogether Room',
        text: `Join my coding session: ${roomId}`,
        url: window.location.href
      });
    } catch (error) {
      copyRoomId();
    }
  };

  const currentUser = clients.find(client => client.username === Location.state?.username);
  const isHost = currentUser?.socketId === socketRef.current?.id;

  return (
    <div className="min-h-screen flex flex-col theme-dark" style={{ background: 'linear-gradient(135deg, #18181b 0%, #232336 100%)' }}>
      {/* Top Bar */}
      <header className="w-full shadow-lg bg-gray-900/90 sticky top-0 z-50">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 24, marginLeft: 0 }}>CodeTogether</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedLanguage}
                disabled
                className="bg-gray-800 border border-gray-700 text-white px-6 py-2 rounded-full appearance-none pr-10 cursor-not-allowed font-semibold text-lg shadow-md"
              >
                <option value="cpp">⚡ C++</option>
              </select>
            </div>
            <button onClick={downloadCode} className="btn-modern rounded-full px-6 py-2 text-base">Download</button>
            <button onClick={runCode} disabled={isCompiling} className="btn-success-modern rounded-full px-6 py-2 text-base">
              {isCompiling ? (<><div className="spinner w-4 h-4 mr-2"></div>Running...</>) : (<><Play className="w-4 h-4 mr-2" />Run Code</>)}
            </button>
          </div>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden" style={{ gap: 32, padding: 32 }}>
        {/* Sidebar */}
        <aside style={{ minWidth: 280, maxWidth: 320, background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px #ff980022', padding: 32, marginRight: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ background: '#fff3e0', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Room ID:</span>
              <code className="text-xs bg-gray-700 px-2 py-1 rounded" style={{ background: '#ffe0b2', color: '#d61c4e' }}>{roomId.slice(0, 8)}...</code>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Connected:</span>
              <span className="text-sm text-green-400">{clients.length} users</span>
            </div>
          </div>
          <div style={{ background: '#fff3e0', borderRadius: 16, padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: '#232336' }}><Users className="w-5 h-5 mr-2" />Members ({clients.length})</h3>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {clients.map((client) => (
                <Client key={client.socketId} username={client.username} isHost={client.socketId === socketRef.current?.id} isOnline={true} />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={copyRoomId} className="w-full btn-modern flex items-center justify-center rounded-xl" style={{ background: 'linear-gradient(90deg, #ff9800 0%, #fb8c00 100%)', color: 'white', border: 'none' }}> <Copy className="w-4 h-4 mr-2" />Copy Room ID</button>
            <button onClick={shareRoom} className="w-full btn-modern flex items-center justify-center rounded-xl" style={{ background: 'linear-gradient(90deg, #ff9800 0%, #fb8c00 100%)', color: 'white', border: 'none' }}> <Share2 className="w-4 h-4 mr-2" />Share Room</button>
            <button onClick={leaveRoom} className="w-full btn-danger-modern flex items-center justify-center rounded-xl" style={{ background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none' }}> <LogOut className="w-4 h-4 mr-2" />Leave Room</button>
          </div>
        </aside>
        {/* Main Content */}
        <section className="flex-1 flex flex-col gap-6" style={{ minWidth: 0 }}>
          <div className="flex gap-6 h-full">
            {/* Editor Panel */}
            <div className="flex-1 flex flex-col" style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px #ff980022', padding: 32, minWidth: 0 }}>
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setShowFileManager(!showFileManager)} className="btn-modern flex items-center rounded-xl px-4 py-2" style={{ background: '#ff9800', color: 'white', border: 'none' }}><FileText className="w-4 h-4 mr-2" />Files</button>
                <button onClick={() => setIsChatOpen(!isChatOpen)} className="btn-modern flex items-center rounded-xl px-4 py-2" style={{ background: '#ff9800', color: 'white', border: 'none' }}><MessageSquare className="w-4 h-4 mr-2" />Chat</button>
              </div>
              <div className="flex-1 flex gap-6 min-w-0">
                {/* File Manager */}
                {showFileManager && (
                  <div style={{ background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: 16, padding: 16, width: 180, flexShrink: 0, boxShadow: '0 2px 8px #ff980033', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold" style={{ color: '#ff9800' }}>Files</h3>
                      <button onClick={createNewFile} className="text-indigo-400 hover:text-indigo-300"><Edit3 className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div key={file.id} className={`flex items-center justify-between p-2 rounded cursor-pointer ${activeFileId === file.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`} onClick={() => setActiveFileId(file.id)}>
                          <span className="text-sm">{file.name}</span>
                          {files.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Editor */}
                <div className="flex-1 flex flex-col min-w-0">
                  <Editor socketRef={socketRef} roomId={roomId} selectedLanguage={selectedLanguage} onCodeChange={(code) => { codeRef.current = code; }} />
                </div>
                {/* Chat Panel */}
                {isChatOpen && (
                  <div style={{ background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: 16, padding: 16, width: 260, flexShrink: 0, boxShadow: '0 2px 8px #ff980033', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex items-center justify-between mb-4"><h3 className="font-semibold" style={{ color: '#ff9800' }}>Chat</h3></div>
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4" ref={chatRef}>
                      {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.isOwn ? 'own' : 'other'} rounded-lg p-3`} style={{ background: msg.isOwn ? '#ff9800' : '#fff8f1', color: msg.isOwn ? 'white' : '#232336' }}>
                          <div className="text-xs text-gray-400 mb-1">{msg.username} • {msg.timestamp}</div>
                          <div>{msg.message}</div>
                        </div>
                      ))}
                      {isTyping && (<div className="text-sm text-gray-400 italic">Someone is typing...</div>)}
                    </div>
                    <div className="flex space-x-2 mt-auto">
                      <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} onInput={handleTyping} placeholder="Type a message..." className="flex-1 bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg" ref={messageInputRef} />
                      <button onClick={sendMessage} className="btn-modern px-4 rounded-lg" style={{ background: '#ff9800', color: 'white', border: 'none' }}><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Output Panel */}
            <div style={{ width: 380, background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px #ff980022', padding: 32, marginLeft: 32, display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center justify-between mb-4">
                <h5 className="m-0 flex items-center text-lg font-semibold" style={{ color: '#232336' }}><Monitor className="w-5 h-5 mr-2" />Output</h5>
                <button onClick={runCode} disabled={isCompiling} className="btn-success-modern flex items-center rounded-full px-4 py-2" style={{ background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)', color: 'white', border: 'none' }}>
                  {isCompiling ? (<><div className="spinner w-4 h-4 mr-2"></div>Running...</>) : (<><Play className="w-4 h-4 mr-2" />Run</>)}
                </button>
              </div>
              <div className="compiler-output flex-1 bg-gray-900/80 rounded-xl p-4 overflow-y-auto" style={{ background: '#fff3e0', color: '#232336', minHeight: 120 }}>
                {outputError ? (<div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '1rem' }}><span style={{ marginRight: 8 }}>❌</span>{outputError}</div>) : null}
                {output && !outputError ? output : null}
                {!output && !outputError ? <span className="text-gray-400">Output will appear here after compilation</span> : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EditorPage;
