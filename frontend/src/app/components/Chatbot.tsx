"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  InputBase,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';

const ChatBox = styled(Paper)(({ theme }) => ({
  height: '400px',
  overflowY: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginTop: theme.spacing(2),
}));

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('default-session-id'); // you can generate a unique session ID if needed
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef(null);

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      console.log("Scrolled to bottom");
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async () => {
    if (!input) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/query', {
        session_id: sessionId,
        query: input,
      });

      const botMessage = { role: 'assistant', content: response.data.answer };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ bgcolor: '#f0f0f0', p: 2, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" align="center" gutterBottom>
        ChatBot
      </Typography>
      <ChatBox ref={chatBoxRef} elevation={3}>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar>{msg.role === 'user' ? 'U' : 'B'}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={msg.role === 'user' ? 'You' : 'Bot'}
                secondary={<Typography variant="body2">{msg.content}</Typography>}
              />
            </ListItem>
          ))}
          {loading && (
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar>B</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Bot"
                secondary={
                  <Box display="flex" alignItems="center">
                    <CircularProgress size={20} />
                    <Typography variant="body2" marginLeft={1}>
                      Bot is typing...
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          )}
          <div ref={chatBoxRef} />
        </List>
      </ChatBox>
      <InputContainer>
        <InputBase
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          fullWidth
          sx={{
            padding: '10px',
            borderRadius: 1,
            border: '1px solid #ccc',
            bgcolor: '#fff',
            marginRight: 1,
          }}
        />
        <Button variant="contained" color="primary" onClick={handleSendMessage} endIcon={<SendIcon />}>
          Send
        </Button>
      </InputContainer>
    </Container>
  );
};

export default ChatBot;
