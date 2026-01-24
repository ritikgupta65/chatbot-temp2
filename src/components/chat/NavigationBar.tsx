
import { useTheme } from '@/contexts/ThemeContext';
import { MessageCircle, Clock, FileText, Home, Tag } from 'lucide-react';
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
    { id: 'offer' as ChatState, icon: Tag, label: 'Offers' },
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
              className={`group flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-300 min-w-[70px] hover:scale-105 ${
                isActive 
                  ? 'bg-gradient-to-r from-gray-700 to-black text-white shadow-md border border-gray-600/50 transform scale-105'
                  : 'text-gray-700 border border-transparent hover:border-gray-600/40 hover:bg-gradient-to-r hover:from-gray-700 hover:to-black hover:text-white hover:shadow-md'
              }`}
            >
              <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} />
              <span className={`text-xs font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-white'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NavigationBar;
