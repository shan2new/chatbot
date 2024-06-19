"use client";

import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
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
  TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  flexDirection: 'column',
}));

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('default-session-id');
  const [accessToken, setAccessToken] = useState<string>(''); 
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [showRetry, setShowRetry] = useState<boolean>(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      console.log("Scrolled to bottom");
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customInput = null) => {
    const content = customInput || input;
    if (!content || !accessToken) return;

    const userMessage: Message = { role: 'user', content: content };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);
    setShowRetry(false);

    try {
      const response = await axios.post('http://localhost:8000/api/query', {
        session_id: sessionId,
        query: content,
        access_token: accessToken,
      });

      const botMessage: Message = { role: 'assistant', content: response.data.answer };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Something went wrong, please try again later.');
      setLoading(false);
      setShowRetry(true);
    }
  };

  const handleKeyPressToken = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && accessToken && accessToken != '') {
      setIsEditing(false);
    }
  };

  const handleKeyPressMessage = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input != '') {
      handleSendMessage(); 
    }
  };

  const handleAccessTokenChange = (e: ChangeEvent<HTMLInputElement>) => {
    const token = e.target.value;
    setAccessToken(token);
  };

  const handleRetry = () => {
    const lastMessage = messages.at(-1);
    if(lastMessage) {
      handleSendMessage(lastMessage.content);
    }
  }

  const handleSaveClick = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ bgcolor: '#f0f0f0', p: 2, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" align="center" gutterBottom>
        ChatBot
      </Typography>
      <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
        <TextField
          label="Access Token"
          value={accessToken}
          onChange={handleAccessTokenChange}
          variant="outlined"
          fullWidth
          disabled={!isEditing}
          sx={{
            mr: 2,
            bgcolor: isEditing ? '#fff' : '#e0e0e0',
          }}
          onKeyPress={handleKeyPressToken}
        />
        <Button
          variant="contained"
          color={isEditing ? "primary" : "secondary"}
          onClick={handleSaveClick}
        >
          {isEditing ? 'Editing' : 'Saved'}
        </Button>
      </Box>
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
          {showRetry && (
            <ListItem alignItems="flex-start">
              <ListItemText
                primary="Error"
                secondary={
                  <Button variant="contained" color="error" onClick={handleRetry}>
                    Try Again
                  </Button>
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
          onKeyPress={handleKeyPressMessage}
          placeholder="Type a message..."
          fullWidth
          sx={{
            padding: '10px',
            borderRadius: 1,
            border: '1px solid #ccc',
            bgcolor: '#fff',
            marginRight: 1,
            marginBottom: 1,
          }}
          disabled={loading}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          endIcon={<SendIcon />}
          disabled={loading}
        >
          Send
        </Button>
      </InputContainer>
      <ToastContainer />
    </Container>
  );
};

export default ChatBot;
