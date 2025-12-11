import { useTheme } from '@/contexts/ThemeContext';
import { MessageCircle } from 'lucide-react';

const LoadingAnimation = () => {
  const { theme } = useTheme();

  return (
    <div className="flex justify-start mb-4">
      <div className="flex">
        {/* Compact Avatar */}
        <div className="flex-shrink-0 mr-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${theme.primaryGradient} flex items-center justify-center shadow-md`}>
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt="Bot" className="w-8 h-8 rounded-full object-cover bg-white" />
            ) : (
              <MessageCircle className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Compact Loading Bubble */}
        <div className="relative p-3 rounded-xl bg-gradient-to-r from-white/30 to-rare-50/30 backdrop-blur-md border border-rare-200/30 shadow-md">
          <div className="flex space-x-1.5">
            <div className={`w-2.5 h-2.5 bg-gradient-to-r ${theme.primaryGradient} rounded-full animate-bounce`}></div>
            <div className={`w-2.5 h-2.5 bg-gradient-to-r ${theme.primaryGradient} rounded-full animate-bounce delay-100`}></div>
            <div className={`w-2.5 h-2.5 bg-gradient-to-r ${theme.primaryGradient} rounded-full animate-bounce delay-200`}></div>
          </div>
          
          {/* Compact Message Tail */}
          <div className="absolute top-3 left-0 transform -translate-x-1">
            <div className="w-2.5 h-2.5 rotate-45 bg-gradient-to-r from-white/30 to-rare-50/30 border-l border-t border-rare-200/30"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
