import { useEffect, useState } from 'react';
import Vapi from '@vapi-ai/web';

export const useVapi = (apiKey: string, assistantId: string) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string; timestamp: number }>>([]);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.error('Microphone access is not supported in this environment.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop the tracks—we only needed permission
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  };

  useEffect(() => {
    const vapiInstance = new Vapi(apiKey);
    setVapi(vapiInstance);

    vapiInstance.on('call-start', () => {
      console.log('Vapi call started');
      setIsConnected(true);
    });
    
    vapiInstance.on('call-end', () => {
      console.log('Vapi call ended');
      setIsConnected(false);
      setIsSpeaking(false);
    });
    
    vapiInstance.on('speech-start', () => {
      console.log('Speech started');
      setIsSpeaking(true);
    });
    
    vapiInstance.on('speech-end', () => {
      console.log('Speech ended');
      setIsSpeaking(false);
    });

    vapiInstance.on('message', (message) => {
      console.log('Vapi message received:', message);
      if (message.type === 'transcript') {
        console.log('Transcript:', message.role, message.transcript);
        setTranscript(prev => [...prev, { 
          role: message.role, 
          text: message.transcript,
          timestamp: Date.now()
        }]);
      }
      // Also handle conversation-update messages
      if (message.type === 'conversation-update') {
        console.log('Conversation update:', message);
      }
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
    });

    return () => {
      console.log('Cleaning up Vapi instance');
      vapiInstance.stop();
    };
  }, [apiKey]);

  const startCall = async () => {
    if (!vapi) {
      console.error('Vapi instance not ready yet.');
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      console.error('Microphone access requires HTTPS or localhost.');
      return;
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      console.error('Cannot start call without microphone permission.');
      return;
    }

    try {
      console.log('Starting Vapi call with assistant:', assistantId);
      await vapi.start(assistantId);
      console.log('Vapi call started successfully');
    } catch (error) {
      console.error('Error starting Vapi call:', error);
    }
  };

  const stopCall = () => {
    if (vapi) {
      console.log('Stopping Vapi call');
      vapi.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript([]);
  };

  return { isConnected, isSpeaking, transcript, startCall, stopCall, clearTranscript };
};