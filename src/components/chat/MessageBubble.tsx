import { useTheme } from '@/contexts/ThemeContext';
import { Message } from '@/types/chat';
import { User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface MessageBubbleProps {
  message: Message;
  onStartChat?: (initialMessage?: string, productImageUrl?: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onStartChat }) => {
  const { theme } = useTheme();
  const isUser = message.sender === 'user';
  
  // Typing animation states
  const [displayedText, setDisplayedText] = useState(isUser ? message.content as string : '');
  const [isTyping, setIsTyping] = useState(!isUser);
  const typingSpeed = 5; // milliseconds per character (faster display)
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Typing animation effect for bot messages (but not for product recommendations)
  useEffect(() => {
    if (isUser) return; // Only animate bot messages
    
    // Check if this is a product recommendation
    const isProductRecommendation =
      typeof message.content === 'string' &&
      /\*\*Product Name\*\*:/.test(message.content) &&
      /\*\*Image URL\*\*:/.test(message.content);
    
    // If it's a product recommendation, display instantly without typing animation
    if (isProductRecommendation) {
      setDisplayedText(message.content as string);
      setIsTyping(false);
      return;
    }
    
    let currentText = '';
    let currentIndex = 0;
    const fullText = message.content as string;
    
    setIsTyping(true);
    
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        currentText += fullText[currentIndex];
        setDisplayedText(currentText);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  }, [message.content, isUser]);

  // --- PRODUCT PARSER ---
  const parseProductMarkdown = (text: string) => {
    if (!text) return { products: [], textBefore: '', textAfter: '' };
    
    // Check if the text is complete enough to parse products
    // Only try to parse if we have at least one complete product block
    if (!text.includes('**Product Name**') || !text.includes('**Image URL**')) {
      return { products: [], textBefore: text, textAfter: '' };
    }
    
    const productRegex = /\*\*Product Name\*\*:([\s\S]*?)\*\*Image URL\*\*: !\[.*?\]\((.*?)\)/g;

    let match;
    const products = [];
    let firstIndex = -1;
    let lastIndex = -1;

    while ((match = productRegex.exec(text)) !== null) {
      const block = match[0];
      const start = match.index;
      const end = start + block.length;

      if (firstIndex === -1) firstIndex = start;
      lastIndex = end;

      const titleMatch = block.match(/\*\*Product Name\*\*: (.*?)(\n|$)/);
      const descriptionMatch = block.match(/\*\*Description\*\*: (.*?)(\n|$)/);
      const urlMatch = block.match(/\*\*Product URL\*\*: \[.*?\]\((.*?)\)/);
      const imageMatch = block.match(/\*\*Image URL\*\*: !\[.*?\]\((.*?)\)/);

      // Only add complete product entries
      if (titleMatch && imageMatch) {
        // Clean title and description to remove markdown links
        const cleanTitle = (titleMatch?.[1] ?? '').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1').trim();
        const cleanDescription = (descriptionMatch?.[1] ?? '').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1').trim();
        
        products.push({
          title: cleanTitle,
          description: cleanDescription,
          url: urlMatch?.[1] ?? '',
          image: imageMatch?.[1] ?? '',
        });
      }
    }

    // Handle partial text during typing animation
    return {
      products,
      textBefore: firstIndex >= 0 ? text.slice(0, firstIndex).trim() : text.trim(),
      textAfter: lastIndex >= 0 ? text.slice(lastIndex).trim() : '',
    };
  };

  // --- CARD RENDER ---
  const renderProductCards = (text: string) => {
    const { products, textBefore, textAfter } = parseProductMarkdown(text);

    return (
      <div className="space-y-4">
        {textBefore && (
          <p
            className="text-sm text-gray-900"
            dangerouslySetInnerHTML={{ __html: formatProductCardMessage(textBefore) }}
          />
        )}

        <div className="grid gap-4">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-[#1f2937] border border-[#374151] rounded-xl p-3 w-[260px] text-white shadow-lg"
            >
              <img
                src={product.image}
                alt={product.title}
                className="rounded-lg w-full h-40 object-cover mb-3"
              />
              <h3 className="text-white font-medium text-sm mb-1">{product.title}</h3>
              <p className="text-sm text-gray-300 font-normal">{product.description}</p>
              <div className="mt-3 flex gap-2">
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 transition text-white rounded-md py-2 text-sm font-medium"
                >
                  Buy Product
                </a>
                <button
                  onClick={() => {
                    // Navigate to Try-On mode with preloaded product image
                    if (onStartChat) {
                      onStartChat('Try-On', product.image);
                    }
                  }}
                  className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition text-white rounded-md py-2 text-sm font-medium"
                >
                  Try On
                </button>
              </div>
            </div>
          ))}
        </div>

        {textAfter && (
          <p
            className="text-sm text-gray-900"
            dangerouslySetInnerHTML={{ __html: formatProductCardMessage(textAfter) }}
          />
        )}
      </div>
    );
  };

  // --- CHECK IF MESSAGE CONTAINS HTML ---
  const containsHtml = (text: string) => {
    // Check if message contains HTML tags (like try-on result)
    return /<[a-z][\s\S]*>/i.test(text);
  };

  // --- DEFAULT TEXT FORMATTER ---
  const formatMessage = (text: string) => {
    // If the message already contains HTML (like try-on result), return it as-is
    if (containsHtml(text)) {
      return text;
    }
    
    return text
      .replace(/^###\s+(.*)$/gm, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" class="underline text-blue-400">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/^\*\s+(.*)$/gm, '• $1')
      .replace(/\n/g, '<br/>');
  };

  // --- PRODUCT CARD TEXT FORMATTER (removes links) ---
  const formatProductCardMessage = (text: string) => {
    return text
      .replace(/^###\s+(.*)$/gm, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '') // Remove links entirely for product cards
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/^\*\s+(.*)$/gm, '• $1')
      .replace(/\n/g, '<br/>');
  };

  const isProductRecommendation =
    typeof message.content === 'string' &&
    /\*\*Product Name\*\*:/.test(message.content) &&
    /\*\*Image URL\*\*:/.test(message.content);

  // Check if this is a loading message (bot side with loading state)
  const isLoadingMessage = !isUser && message.isLoading;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[300px] min-w-[180px] w-[140px ] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}> 
        {/* Compact Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-black flex items-center justify-center shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-md bg-white">
              <img
                src={theme.logoUrl}
                alt={theme.brandName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Compact Message Bubble */}
        <div
          className={`relative p-3 rounded-xl ${isUser
            ? 'bg-gradient-to-r from-gray-700 to-black backdrop-blur-md border border-gray-600/30 text-white ml-auto shadow-md'
            : 'bg-gradient-to-r from-white/30 to-gray-100/30 backdrop-blur-md border border-gray-200/30 text-gray-900 shadow-md'} shadow-lg`}
        >
          {isLoadingMessage ? (
            // Show skeleton loader for loading images
            <div className="space-y-2">
              <Skeleton className="h-[200px] w-[250px] rounded-lg" />
              <Skeleton className="h-4 w-[150px]" />
              <p className="text-xs text-gray-600 mt-1">Generating try-on image...</p>
            </div>
          ) : isProductRecommendation ? (
            renderProductCards(isUser ? message.content as string : displayedText)
          ) : (
            <div ref={messageRef} className="text-xs leading-relaxed">
              <p dangerouslySetInnerHTML={{ __html: formatMessage(isUser ? message.content as string : displayedText) }} />
              {isTyping && <span className="inline-block w-1.5 h-3 ml-0.5 bg-current animate-pulse">|</span>}
            </div>
          )}

          <p className={`text-xs mt-1 ${isUser ? 'text-white/80' : 'text-gray-600'}`}>
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          {/* Compact Tail */}
          <div className={`absolute top-3 ${isUser ? 'right-0 translate-x-1' : 'left-0 -translate-x-1'}`}>
            <div
              className={`w-2.5 h-2.5 rotate-45 ${isUser
                ? 'bg-gradient-to-r from-gray-700 to-black border-l border-t border-gray-600/30'
                : 'bg-gradient-to-r from-white/30 to-gray-100/30 border-l border-t border-gray-200/30'}`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

