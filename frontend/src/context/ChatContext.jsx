import { createContext, useContext, useState, useCallback } from 'react';
import chatService from '../services/chatService';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);

  const loadMessages = useCallback(async (orderId) => {
    setLoading(true);
    try {
      const response = await chatService.getMessages(orderId);
      setMessages((prev) => ({
        ...prev,
        [orderId]: response.data.map((m) => ({
          id: m.id,
          orderId: m.orderId,
          sender: m.sender_register_number,
          text: m.message,
          timestamp: m.sent_at,
        })),
      }));
    } catch (err) {
      console.error('Failed to load messages:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (orderId, text) => {
    setLoading(true);
    try {
      const response = await chatService.sendMessage(orderId, text);
      const newMessage = {
        id: response.data.id,
        orderId: response.data.orderId,
        sender: response.data.sender_register_number,
        text: response.data.message,
        timestamp: response.data.sent_at,
      };
      setMessages((prev) => ({
        ...prev,
        [orderId]: [...(prev[orderId] || []), newMessage],
      }));
      return newMessage;
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        loadMessages,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
