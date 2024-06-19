"use client";

import React, { useState } from 'react';
import axios from 'axios';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('default-session-id'); // you can generate a unique session ID if needed

  const handleSendMessage = async () => {
    if (!input) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');

    try {
      const response = await axios.post('http://localhost:8000/query', {
        session_id: sessionId,
        query: input,
      });

      const botMessage = { role: 'assistant', content: response.data.answer };
      setMessages([...messages, userMessage, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>ChatBot</h1>
      <div style={styles.chatContainer}>
        {messages.map((msg, index) => (
          <div key={index} style={{ ...styles.message, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <strong style={styles.messageRole}>{msg.role === 'user' ? 'You' : 'Bot'}:</strong>
            <span style={styles.messageContent}>{msg.content}</span>
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          style={styles.input}
        />
        <button onClick={handleSendMessage} style={styles.button}>Send</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '400px',
    margin: '0 auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    color: '#333',
  },
  chatContainer: {
    background: 'white !important',
    height: '300px',
    overflowY: 'scroll',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '10px',
    backgroundColor: '#fff',
  },
  message: {
    margin: '10px 0',
  },
  messageRole: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  messageContent: {
    display: 'block',
    backgroundColor: '#e1f5fe',
    padding: '8px',
    borderRadius: '8px',
  },
  inputContainer: {
    display: 'flex',
    marginTop: '20px',
  },
  input: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    marginRight: '10px',
    fontSize: '16px',
    color: '#000 !important',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#000',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default ChatBot;
