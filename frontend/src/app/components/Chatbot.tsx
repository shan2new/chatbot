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
  const [displayResponse, setDisplayResponse] = useState<string>('');
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayResponse]);

  useEffect(() => {
    if (displayResponse) {
      const botMessageIndex = messages.length - 1;
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[botMessageIndex] = {
          ...newMessages[botMessageIndex],
          content: displayResponse,
        };
        return newMessages;
      });
    }
  }, [displayResponse]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (customInput = null) => {
    const content = customInput || input;
    if (!content || !accessToken) return;

    const userMessage: Message = { role: 'user', content: content };
    const botMessage: Message = { role: 'assistant', content: '' };

    setMessages((prevMessages) => [...prevMessages, userMessage, botMessage]);
    setInput('');
    setLoading(true);
    setShowRetry(false);

    try {
      const response = await axios.post('/api/query', {
        session_id: sessionId,
        query: content,
        access_token: accessToken,
      });
      setLoading(false);
      typeResponse(response.data.answer);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Something went wrong, please try again later.');
      setLoading(false);
      setShowRetry(true);
    }
  };

  const typeResponse = (text: string) => {
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      setDisplayResponse(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
      }
    }, 20);
  };

  const handleKeyPressToken = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && accessToken && accessToken !== '') {
      setIsEditing(false);
    }
  };

  const handleKeyPressMessage = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input !== '') {
      handleSendMessage();
    }
  };

  const handleAccessTokenChange = (e: ChangeEvent<HTMLInputElement>) => {
    const token = e.target.value;
    setAccessToken(token);
  };

  const handleRetry = () => {
    const lastMessage = messages.at(-1);
    if (lastMessage) {
      handleSendMessage(lastMessage.content);
    }
  };

  const handleSaveClick = () => {
    setIsEditing(!isEditing);
  };

  const getLatestBotResponseText = (msg: Message, index: number, allMessages: Message[]) => {
    if (index === allMessages.length - 1 && loading) {
      return (
        <Box display="flex" alignItems="left">
          <CircularProgress size={20} />
          <Typography variant="body2" marginLeft={1}>
            AI Bot is thinking... 🤔
          </Typography>
        </Box>
      );
    }
    return <Typography variant="body2">{msg.content}</Typography>;
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
          color={isEditing ? 'primary' : 'secondary'}
          onClick={handleSaveClick}
          size={'large'}
        >
          {isEditing ? 'Save' : 'Edit'}
        </Button>
      </Box>
      <ChatBox ref={chatBoxRef} elevation={3}>
        <List>
          {messages.map((msg, index, allMessages) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar>{msg.role === 'user' ? 'U' : 'B'}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={msg.role === 'user' ? 'You' : 'Bot'}
                secondary={getLatestBotResponseText(msg, index, allMessages)}
              />
            </ListItem>
          ))}
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
          onClick={() => handleSendMessage()}
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
