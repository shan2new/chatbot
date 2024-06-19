"use client";

import React from 'react';
import ChatBot from './components/ChatBot';
import { Box } from '@mui/material';

const Home = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="#e0e0e0"
    >
      <ChatBot />
    </Box>
  );
};

export default Home;
