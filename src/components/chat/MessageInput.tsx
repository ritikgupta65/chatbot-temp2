
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Send, Phone, Paperclip } from 'lucide-react';
import ImageGenerator from './ImageGenerator';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isConnected: boolean;
  startCall: () => void;
  stopCall: () => void;
  isTryOnMode?: boolean;
  addTryOnMessage?: (content: string, sender: 'user' | 'bot') => void;
  preloadedClothImage?: string | null;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
  isConnected,
  startCall,
  stopCall,
  isTryOnMode = false,
  addTryOnMessage,
  preloadedClothImage,
}) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { theme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCallClick = () => {
    if (isConnected) {
      stopCall();
    } else {
      startCall();
    }
  };

  // const handleAttachmentClick = () => {
  //   console.log('Attachment button clicked');
  // };


const fileInputRef = useRef<HTMLInputElement>(null);

const handleAttachmentClick = () => {
  fileInputRef.current?.click();
};

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Regular mode only: Single image
      setSelectedImage(base64);
    };
    reader.readAsDataURL(file);
  }
  // Reset file input
  e.target.value = '';
};

const removeImage = () => {
  setSelectedImage(null);
};



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Regular mode only: Text or image
    if ((message.trim() || selectedImage) && !disabled) {
      let finalMessage = '';
      
      // Add image if selected
      if (selectedImage) {
        finalMessage += `<img src="${selectedImage}" alt="uploaded" class="max-w-[200px] max-h-[200px] rounded-lg mb-2" />`;
      }
      
      // Add text if provided
      if (message.trim()) {
        finalMessage += selectedImage ? `<br/>${message.trim()}` : message.trim();
      }
      
      onSendMessage(finalMessage);
      setMessage('');
      setSelectedImage(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleTryOnComplete = (resultImageUrl: string) => {
    // When try-on generation is complete, add the result directly to try-on messages
    // WITHOUT going through the regular webhook
    if (addTryOnMessage) {
      const resultMessage = `<div class="try-on-result"><img src="${resultImageUrl}" alt="Try-On Result" class="max-w-[300px] rounded-lg" /><p class="text-xs text-gray-600 mt-2">✨ Virtual Try-On Result</p></div>`;
      addTryOnMessage(resultMessage, 'bot');
    }
  };

  const handleTryOnError = (error: string) => {
    // Send error message directly to try-on chat WITHOUT going through webhook
    if (addTryOnMessage) {
      addTryOnMessage(`⚠️ Try-On Error: ${error}`, 'bot');
    }
  };

  return (
    <div className="p-3 bg-gradient-to-r from-gray-700/20 to-black/20 backdrop-blur-md border-t border-gray-600/30 rounded-b-[inherit]">
      {isTryOnMode ? (
        /* Try-On Mode: Use ImageGenerator Component */
        <ImageGenerator 
          onGenerationComplete={handleTryOnComplete}
          onError={handleTryOnError}
          preloadedClothImage={preloadedClothImage}
        />
      ) : (
        /* Regular Mode */
        <>
          {/* Regular Mode Image Preview */}
          {selectedImage && (
            <div className="mb-3 p-3 bg-gray-100/90 backdrop-blur-md rounded-lg border border-gray-300/50">
              <div className="flex items-start space-x-3">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">Image attached</p>
                  <p className="text-xs text-gray-500">You can add text below and send both together</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage()}
                  className="text-gray-500 hover:text-red-500 text-sm font-medium transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={disabled}
                className="w-full p-3 pr-28 bg-white/40 backdrop-blur-md border border-gray-600/30 rounded-lg text-gray-900 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-gray-600/50 focus:border-gray-600/50 transition-all duration-200 min-h-[48px] max-h-24 scrollbar-hide shadow-sm"
                rows={1}
              />
            
              {/* Compact Buttons inside the input */}
              <div className="absolute right-1.5 bottom-1.5 flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleCallClick}
                  className={`p-2 rounded-full border transition-all duration-300 hover:scale-110 shadow-sm ${
                    isConnected 
                      ? 'bg-red-500 hover:bg-red-600 border-red-400/50 text-white' 
                      : 'bg-gradient-to-r from-gray-700 to-black hover:from-gray-800 hover:to-black border-gray-600/50 text-white hover:shadow-md'
                  }`}
                >
                  <Phone className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={handleAttachmentClick}
                  className="p-2 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-black border border-gray-600/50 hover:border-gray-700/50 transition-all duration-300 text-white hover:scale-110 shadow-sm hover:shadow-md"
                >
                  <Paperclip className="w-3 h-3" />
                </button>

                <button
                  type="submit"
                  disabled={(!message.trim() && !selectedImage) || disabled}
                  className={`p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-sm ${
                    (message.trim() || selectedImage) && !disabled
                      ? 'bg-gradient-to-r from-gray-700 to-black backdrop-blur-md border border-gray-600/50 text-white hover:from-gray-800 hover:to-black hover:shadow-md'
                      : 'bg-gray-200/50 text-gray-600 cursor-not-allowed border border-gray-600/30'
                  }`}
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Hidden file input for regular mode */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </form>
        </>
      )}
    </div>
  );
};

export default MessageInput;
