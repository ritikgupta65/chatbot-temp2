
import { useState, useEffect } from 'react';
import WelcomeScreenWidget from './WelcomeScreenWidget';
import ChatWindow from './ChatWindow';
import NavigationBar from './NavigationBar';
import ContactForm from './ContactForm';
import { Message, ChatState } from '@/types/chat';
import { useVapi } from '@/hooks/useVapi';
import { getUserId } from '@/lib/userIdManager';

const ChatInterface = () => {

  const [chatState, setChatState] = useState<ChatState>('welcome');
  const [regularMessages, setRegularMessages] = useState<Message[]>([]);
  const [tryOnMessages, setTryOnMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTryOnMode, setIsTryOnMode] = useState(false);
  const [preloadedClothImage, setPreloadedClothImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  
  // Initialize userId on component mount
  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);
  
  // Get current messages based on mode
  const messages = isTryOnMode ? tryOnMessages : regularMessages;
  const setMessages = isTryOnMode ? setTryOnMessages : setRegularMessages;

  // Notification sound function
  const playNotificationSound = () => {
    try {
      // Create a simple notification beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set up a pleasant notification sound (two-tone beep)
      oscillator.frequency.value = 800; // First tone
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      
      // Second tone
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.value = 1000;
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.1);
      }, 100);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const apiKey = 'c24b5ae5-acc4-446a-a601-f590170aba94';
  const assistantId = 'f6eb5237-b933-4dc0-9257-c049347309fc';
  const { isConnected, isSpeaking, startCall, stopCall, transcript, clearTranscript } = useVapi(apiKey, assistantId);

  // Monitor for new bot messages when chatbot is on welcome screen
  useEffect(() => {
    const allMessages = isTryOnMode ? tryOnMessages : regularMessages;
    
    // Check if we just received a new bot message
    if (allMessages.length > 0) {
      const lastMessage = allMessages[allMessages.length - 1];
      
      // If chatbot is on welcome screen (minimized/closed) and last message is from bot
      if (chatState === 'welcome' && lastMessage.sender === 'bot') {
        // Play notification sound
        playNotificationSound();
      }
    }
  }, [regularMessages, tryOnMessages, chatState, isTryOnMode]);

  const startChat = (initialMessage?: string, productImageUrl?: string) => {
    if (initialMessage === 'form') {
      setChatState('form');
      return;
    }
    if (initialMessage === 'Try-On') {
      // Try-On mode: Switch to Try-On and load its history
      setIsTryOnMode(true);
      setChatState('chatting');
      
      // Set preloaded cloth image if provided
      if (productImageUrl) {
        setPreloadedClothImage(productImageUrl);
      }
      
      // Only add welcome message if Try-On history is empty
      if (tryOnMessages.length === 0) {
        const tryOnWelcomeMessage: Message = {
          id: Date.now().toString(),
          content: productImageUrl 
            ? '👕 Product loaded! 📸\n\nNow upload your photo to see how this looks on you:\n\n📷 **Upload your photo** - A clear photo of yourself\n\nThen click "Generate Try-On" to see the result!'
            : '👕 Welcome to Virtual Try-On! 📸\n\nUpload two images to see how clothes look on you:\n\n1️⃣ **Your photo** - A clear photo of yourself\n2️⃣ **Clothing item** - The garment you want to try on\n\nThen click send and I\'ll show you how it looks!',
          sender: 'bot',
          timestamp: new Date(),
        };
        setTryOnMessages([tryOnWelcomeMessage]);
      }
      return;
    }
    
    // Regular chat mode: Switch to regular chat and load its history
    setIsTryOnMode(false);
    setChatState('chatting');
    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add to appropriate message history based on current mode
    if (isTryOnMode) {
      setTryOnMessages((prev) => [...prev, userMessage]);
    } else {
      setRegularMessages((prev) => [...prev, userMessage]);
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('https://ritik-n8n-e9673da43cf4.herokuapp.com/webhook/327b7049-d402-4001-bd1a-d4a08a29f187', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userId,
          message: content 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply || 'Sorry, I couldn\'t understand that.',
        sender: 'bot',
        timestamp: new Date(),
      };

      // Add to appropriate message history based on current mode
      if (isTryOnMode) {
        setTryOnMessages((prev) => [...prev, botMessage]);
      } else {
        setRegularMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Oops! Something went wrong. Try again later.',
        sender: 'bot',
        timestamp: new Date(),
      };

      // Add to appropriate message history based on current mode
      if (isTryOnMode) {
        setTryOnMessages((prev) => [...prev, errorMessage]);
      } else {
        setRegularMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goHome = () => {
    setChatState('welcome');
    setIsTryOnMode(false);
  };

  const startNewChat = () => {
    // Clear only the current mode's history
    if (isTryOnMode) {
      setTryOnMessages([]);
    } else {
      setRegularMessages([]);
    }
    clearTranscript();
    setIsLoading(false);
  };

  const addTryOnMessage = (content: string, sender: 'user' | 'bot') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
    };
    setTryOnMessages((prev) => [...prev, newMessage]);
  };

  return (
    // Outer wrapper holds the border and rounded corners
    <div className="h-full rounded-lg border border-gray-600/30">
      {/* Inner wrapper carries background + clipping so the border shows cleanly at corners */}
      <div className="h-full flex flex-col rounded-[inherit] overflow-hidden bg-white/40 backdrop-blur-md">
        <div className="flex-1 overflow-hidden">
        {chatState === 'welcome' ? (
          <div className="h-full flex flex-col">
            <div className="h-full flex-1 overflow-y-auto scrollbar-hide">
              <WelcomeScreenWidget onStartChat={startChat} />
            </div>
            {/* Navigation Bar only on welcome screen */}
            <div className="flex-shrink-0">
              <NavigationBar currentView={chatState} onNavigate={setChatState} />
            </div>
          </div>
        ) : chatState === 'form' ? (
          <ContactForm onGoHome={goHome} />
        ) : (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onGoHome={goHome}
            onNewChat={startNewChat}
            isConnected={isConnected}
            transcript={transcript}
            startCall={startCall}
            stopCall={stopCall}
            isTryOnMode={isTryOnMode}
            addTryOnMessage={addTryOnMessage}
            preloadedClothImage={preloadedClothImage}
            onStartChat={startChat}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
