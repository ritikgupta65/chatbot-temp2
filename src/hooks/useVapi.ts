import { useEffect, useState } from 'react';
import Vapi from '@vapi-ai/web';

export const useVapi = (apiKey: string, assistantId: string) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string; timestamp: number }>>([]);

  useEffect(() => {
    const vapiInstance = new Vapi(apiKey);
    setVapi(vapiInstance);

    vapiInstance.on('call-start', () => setIsConnected(true));
    vapiInstance.on('call-end', () => {
      setIsConnected(false);
      setIsSpeaking(false);
    });
    vapiInstance.on('speech-start', () => setIsSpeaking(true));
    vapiInstance.on('speech-end', () => setIsSpeaking(false));

    vapiInstance.on('message', (message) => {
      if (message.type === 'transcript') {
        setTranscript(prev => [...prev, { 
          role: message.role, 
          text: message.transcript,
          timestamp: Date.now() // Store timestamp when message is received
        }]);
      }
    });

    vapiInstance.on('error', console.error);

    return () => vapiInstance.stop();
  }, [apiKey]);

  const startCall = () => {
    if (vapi) vapi.start(assistantId);
  };

  const stopCall = () => {
    if (vapi) vapi.stop();
  };

  const clearTranscript = () => {
    setTranscript([]);
  };

  return { isConnected, isSpeaking, transcript, startCall, stopCall, clearTranscript };
};