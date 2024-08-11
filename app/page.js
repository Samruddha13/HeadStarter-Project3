'use client';
import { Box, Stack, TextField, Button, CircularProgress } from "@mui/material";
import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hi, I am an AI assistant designed to respond to your queries with clarity, helpfulness, and accuracy. My goal is to provide informative and relevant responses in a concise and user-friendly manner. I tailor my answers to meet your needs, ensuring you receive the best possible assistance.'
  }]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    setMessage('');
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: '...' }, // Placeholder for streaming content
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }])
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from the assistant');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1].content += text;
          return newMessages;
        });
      }
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <Stack direction="column"
        width="600px" height="700px" border="1px solid black" p={2} spacing={3}>
        <Stack direction="column" spacing={2} flexGrow="1" overflow="auto" maxHeight="100%">
          {messages.map((message, index) => (
            <Box key={index} display="flex" justifyContent={
              message.role === 'assistant' ? 'flex-start' : 'flex-end'
            }>
              <Box bgcolor={
                message.role === 'assistant' ? 'lightgray' : 'lightblue'
              } color="black" borderRadius={16} p={3}>
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2} >
          <TextField 
            label="Message" 
            fullWidth 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
          />
          <Button variant="contained" onClick={sendMessage} disabled={isSending}>
            {isSending ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
