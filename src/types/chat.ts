
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
  imageUrl?: string;
}

export type ChatState = 'welcome' | 'chatting' | 'history' | 'faq' | 'form' | 'offer';

export interface QuickAction {
  label: string;
  message?: string;
  action?: () => void;
}
