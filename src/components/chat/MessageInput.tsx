
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
  addTryOnMessage?: (content: string, sender: 'user' | 'bot', isLoading?: boolean) => string;
  removeTryOnLoadingMessage?: (messageId: string) => void;
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
  removeTryOnLoadingMessage,
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

  // Store loading message ID
  const loadingMessageIdRef = useRef<string | null>(null);

  const handleTryOnStart = (humanImage: string, clothImage: string) => {
    // When try-on generation starts, send both images as a user message (collage)
    if (addTryOnMessage) {
      const collageMessage = `
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
          <div style="text-align: center;">
            <img src="${humanImage}" alt="Human Photo" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 2px solid #ddd;" />
            <p style="font-size: 10px; color: #666; margin-top: 4px;">Human Photo</p>
          </div>
          <div style="text-align: center;">
            <img src="${clothImage}" alt="Clothing" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 2px solid #ddd;" />
            <p style="font-size: 10px; color: #666; margin-top: 4px;">Clothing</p>
          </div>
        </div>
        <p style="font-size: 12px; color: #333; margin-top: 4px;">Generate virtual try-on</p>
      `;
      addTryOnMessage(collageMessage, 'user');
      
      // Add loading message for bot response
      const loadingId = addTryOnMessage('Generating try-on...', 'bot', true);
      loadingMessageIdRef.current = loadingId;
    }
  };

  const handleTryOnComplete = (resultImageUrl: string) => {
    // When try-on generation is complete, add the result directly to try-on messages
    console.log('=== TRY-ON COMPLETE ===');
    console.log('Result URL:', resultImageUrl);
    
    if (addTryOnMessage && removeTryOnLoadingMessage) {
      // Remove loading message first
      if (loadingMessageIdRef.current) {
        removeTryOnLoadingMessage(loadingMessageIdRef.current);
        loadingMessageIdRef.current = null;
      }
      
      // Validate the image URL
      if (!resultImageUrl || resultImageUrl.length < 10) {
        console.error('Invalid result image URL');
        addTryOnMessage('⚠️ Error: Received invalid image URL from server', 'bot');
        return;
      }
      
      // Fix Google Drive URL format for direct image display
      let displayUrl = resultImageUrl;
      if (resultImageUrl.includes('drive.google.com')) {
        // Extract file ID from various Google Drive URL formats
        let fileId = null;
        
        // Format: https://drive.google.com/uc?id=FILE_ID
        if (resultImageUrl.includes('/uc?id=')) {
          fileId = resultImageUrl.split('/uc?id=')[1].split('&')[0];
        }
        // Format: https://drive.google.com/file/d/FILE_ID/view
        else if (resultImageUrl.includes('/file/d/')) {
          fileId = resultImageUrl.split('/file/d/')[1].split('/')[0];
        }
        // Format: https://drive.google.com/open?id=FILE_ID
        else if (resultImageUrl.includes('open?id=')) {
          fileId = resultImageUrl.split('open?id=')[1].split('&')[0];
        }
        
        // Use direct download format which bypasses CORS and preview screens
        if (fileId) {
          displayUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          console.log('Converted Google Drive URL to direct download format');
        }
      }
      console.log('Display URL:', displayUrl);
      
      const resultMessage = `<div class="try-on-result" style="position: relative; display: inline-block;">
        <img src="${displayUrl}" alt="Try-On Result" style="max-width: 280px; border-radius: 8px; display: block;" crossorigin="anonymous" onerror="console.error('Image load error for URL:', '${displayUrl}'); this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<p style=\\'color: red;\\'>⚠️ Image failed to load. <a href=\\'${displayUrl}\\' target=\\'_blank\\' style=\\'color: blue; text-decoration: underline;\\'>Click here to view</a></p>';" />
        <a href="${displayUrl}" download="try-on-result.jpg" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; padding: 6px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 500; display: flex; align-items: center; gap: 4px; transition: all 0.2s; backdrop-filter: blur(4px);" onmouseover="this.style.background='rgba(0,0,0,0.9)'; this.style.transform='scale(1.05)';" onmouseout="this.style.background='rgba(0,0,0,0.7)'; this.style.transform='scale(1)';" title="Download image">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download
        </a>
        <p style="font-size: 12px; color: #666; margin-top: 8px;">✨ Virtual Try-On Result</p>
      </div>`;
      console.log('Adding try-on result message to chat');
      addTryOnMessage(resultMessage, 'bot');
    }
  };

  const handleTryOnError = (error: string) => {
    // Send error message directly to try-on chat WITHOUT going through webhook
    if (addTryOnMessage && removeTryOnLoadingMessage) {
      // Remove loading message first
      if (loadingMessageIdRef.current) {
        removeTryOnLoadingMessage(loadingMessageIdRef.current);
        loadingMessageIdRef.current = null;
      }
      
      addTryOnMessage(`⚠️ Try-On Error: ${error}`, 'bot');
    }
  };

  return (
    <div className="p-3 bg-gradient-to-r from-gray-700/20 to-black/20 backdrop-blur-md border-t border-gray-600/30 rounded-b-[inherit]">
      {isTryOnMode ? (
        /* Try-On Mode: Use ImageGenerator Component */
        <ImageGenerator 
          onGenerationStart={handleTryOnStart}
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
