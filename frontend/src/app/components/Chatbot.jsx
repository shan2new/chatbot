"use client";

import React, { useState } from 'react';
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
    <Container maxWidth="sm" sx={{ bgcolor: '#f0f0f0', p: 2, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" align="center" gutterBottom color={'#000'}>
        Apollo-ChatBot
      </Typography>
      <ChatBox elevation={3}>
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
