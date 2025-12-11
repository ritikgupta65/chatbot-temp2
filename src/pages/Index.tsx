
import ChatInterface from '@/components/chat/ChatInterface';
import { ThemeProvider } from '@/contexts/ThemeContext';

const Index = () => {
  return (
    <ThemeProvider>
      {/* Elegant background with black and white theme */}
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 flex items-center justify-center">
        {/* Compact professional widget-style chatbot container */}
        <div className="w-full max-w-sm h-[600px] bg-gradient-to-br from-white via-gray-100 to-gray-200 rounded-2xl shadow-2xl border border-gray-300/50 relative overflow-hidden">
          {/* Enhanced background elements with black and white theme */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-300/30 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-gray-400/20 via-transparent to-transparent"></div>
          
          {/* Removed animated background circles */}
          
          {/* Main Chat Interface */}
          <ChatInterface />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;
