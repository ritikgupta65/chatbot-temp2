
import { useTheme } from '@/contexts/ThemeContext';
import { MessageCircle, Clock, FileText, Home } from 'lucide-react';
import { ChatState } from '@/types/chat';

interface NavigationBarProps {
  currentView: ChatState;
  onNavigate: (view: ChatState) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ currentView, onNavigate }) => {
  const { theme } = useTheme();

  const navItems = [
    { id: 'welcome' as ChatState, icon: Home, label: 'Home' },
    { id: 'history' as ChatState, icon: MessageCircle, label: 'Chats' },
    { id: 'form' as ChatState, icon: FileText, label: 'Form' },
  ];

  return (
    <div className="bg-gradient-to-r from-gray-700/20 to-black/20 backdrop-blur-md border-t border-gray-600/30 p-2">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-300 min-w-[70px] hover:scale-105 ${
                isActive 
                  ? 'bg-gradient-to-r from-gray-700 to-black text-white shadow-md border border-gray-600/50 transform scale-105'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-700/20 hover:to-black/20 border border-transparent hover:border-gray-600/30'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NavigationBar;
