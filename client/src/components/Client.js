import React from 'react';
import Avatar from 'react-avatar';
import { motion } from 'framer-motion';
import { Crown, User, Wifi } from 'lucide-react';

function Client({ username, isHost = false, isTyping = false, isOnline = true }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="client-item"
    >
      <div className="client-avatar">
        <Avatar 
          name={username.toString()} 
          size={40} 
          round="12px" 
          color={isHost ? "#f59e0b" : "#6366f1"}
        />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center">
          <span className="client-name">
            {username.toString()}
          </span>
          {isHost && (
            <Crown className="w-4 h-4 text-yellow-500 ml-2" />
          )}
        </div>
        
        <div className="flex items-center mt-1">
          <div className={`status-${isOnline ? 'online' : 'offline'}`}></div>
          <span className="text-xs text-gray-400">
            {isTyping ? 'typing...' : (isOnline ? 'online' : 'offline')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default Client;
