import { useState, useRef, useEffect } from 'react';
import { Paperclip } from 'lucide-react';
import { getUserId } from '@/lib/userIdManager';

interface ImageGeneratorProps {
  onGenerationComplete?: (resultImageUrl: string) => void;
  onError?: (error: string) => void;
  onGenerationStart?: (humanImage: string, clothImage: string) => void;
  preloadedClothImage?: string | null;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  onGenerationComplete,
  onError,
  onGenerationStart,
  preloadedClothImage,
}) => {
  const [humanImage, setHumanImage] = useState<string | null>(null);
  const [clothImage, setClothImage] = useState<string | null>(preloadedClothImage || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<'human' | 'cloth' | null>(null);
  const [userId, setUserId] = useState<string>('');
  
  // Ref to prevent double-execution (more reliable than state)
  const isGeneratingRef = useRef(false);

  // Use Vite proxy to avoid CORS issues
  const PROXY_URL = '/api/try-on';
  const POLL_URL = '/api/try-on-status';

  // Initialize userId on component mount
  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []); 

  // Poll for result - checks every 5 seconds for up to 3 minutes
  const pollForResult = async (pollUserId: string): Promise<string> => {
    const maxAttempts = 20; // 16 attempts * 5 seconds = 3 minutes
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`Polling attempt ${attempt + 1}/${maxAttempts} for userId: ${pollUserId}`);
      
      try {
        const response = await fetch(`${POLL_URL}?userId=${pollUserId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Poll response:', result);

          // Handle both array response (from Google Sheets) and object response
          const data = Array.isArray(result) ? result[0] : result;
          
          if (data && data.imageUrl) {
            // If we have an imageUrl, generation is complete (regardless of status field)
            console.log('✅ Image generation completed!');
            console.log('Image URL:', data.imageUrl);
            return data.imageUrl;
          } else if (data && data.status === 'failed') {
            throw new Error(data.error || 'Image generation failed');
          }
          // If no imageUrl yet, continue polling
          console.log('Still processing, will check again...');
        }
      } catch (error) {
        // Only log, don't throw - we'll retry
        console.log('Poll error (will retry):', error);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Image generation timed out after 3 minutes. Please try again.');
  };



  // Update cloth image when preloaded image changes
  useEffect(() => {
    if (preloadedClothImage) {
      setClothImage(preloadedClothImage);
    }
  }, [preloadedClothImage]);

  const handleAttachmentClick = (type: 'human' | 'cloth') => {
    setUploadingType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        
        if (uploadingType === 'human') {
          setHumanImage(base64);
        } else if (uploadingType === 'cloth') {
          setClothImage(base64);
        }
        
        setUploadingType(null);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    e.target.value = '';
  };

  const removeImage = (type: 'human' | 'cloth') => {
    if (type === 'human') {
      setHumanImage(null);
    } else {
      setClothImage(null);
    }
  };

  const handleGenerateTryOn = async () => {
    // Prevent double-clicks using ref (more reliable than state for async)
    if (isGeneratingRef.current || isGenerating) {
      console.log('Already generating, ignoring duplicate click');
      return;
    }
    
    if (!humanImage || !clothImage) {
      onError?.('Please upload both human and cloth images');
      return;
    }

    // Notify parent that generation is starting with both images
    if (onGenerationStart) {
      onGenerationStart(humanImage, clothImage);
    }

    // Set both ref and state to prevent double execution
    isGeneratingRef.current = true;
    setIsGenerating(true);
    console.log('=== STARTING TRY-ON GENERATION ===');
    
    let generationSuccessful = false;

    try {
      // Prepare the payload with labeled images and userId
      const payload = {
        userId: userId,
        humanImage: humanImage,
        clothImage: clothImage,
        imageLabels: {
          human: 'human_image',
          cloth: 'cloth_image'
        },
        timestamp: new Date().toISOString()
      };

      console.log('Sending request to webhook via proxy...');

      // Step 1: Start the generation (quick response with executionId)
      const startResponse = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Start response status:', startResponse.status);

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        console.error('Webhook error response:', errorText);
        throw new Error(`Request failed with status ${startResponse.status}`);
      }

      // Parse start response
      const startResult = await startResponse.json();
      console.log('Start response:', startResult);

      // Extract userId from response (generated by n8n)
      const responseUserId = startResult.userId || userId;
      console.log('Using userId for polling:', responseUserId);

      let resultUrl: string;

      // Check if we got an immediate result (fast generation) or need to poll
      if (startResult.imageUrl || startResult.resultImageUrl || startResult.url || startResult.image) {
        // Immediate result - extract URL directly (unlikely with 2-min generation)
        resultUrl = startResult.imageUrl || startResult.resultImageUrl || startResult.url || startResult.image;
        console.log('Got immediate result:', resultUrl);
      } else if (startResult.status === 'processing' || startResult.status === 'started') {
        // n8n acknowledged and is processing in background - start polling
        console.log('✅ Generation started successfully! Now polling for result...');
        resultUrl = await pollForResult(responseUserId);
      } else {
        console.error('Unexpected response format:', startResult);
        throw new Error('Unexpected response from server. Expected status: processing');
      }

      // Mark as successful
      generationSuccessful = true;
      
      console.log('✅ Generation successful');
      console.log('Result URL:', resultUrl);
      
      // Send the result image URL to the chat
      onGenerationComplete?.(resultUrl);
      
      // Clear the images after successful generation
      setHumanImage(null);
      setClothImage(null);
    } catch (error) {
      // Only show error if generation was not successful
      if (!generationSuccessful) {
        console.error('Error generating try-on:', error);
        
        let errorMessage = 'Failed to generate try-on. Please try again.';
        
        if (error instanceof Error && error.name === 'AbortError') {
          errorMessage = 'Request timed out. The image generation is taking longer than expected. Please try again.';
        } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection or try again later.';
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        onError?.(errorMessage);
      }
    } finally {
      // Reset both ref and state
      isGeneratingRef.current = false;
      setIsGenerating(false);
      console.log('=== TRY-ON GENERATION COMPLETE ===');
      console.log('Generation successful:', generationSuccessful);
    }
  };

  const bothImagesUploaded = humanImage && clothImage;

  return (
    <div className="w-full">
      {/* Images Preview - Compact & Right-Aligned (matching original design) */}
      {(humanImage || clothImage) && (
        <div className="mb-1 flex justify-end">
          <div className="w-1/2 p-1.5 bg-white/40 backdrop-blur-md rounded-md border border-gray-600/30">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-gray-800" style={{ fontSize: '10px' }}>Try-On Images ({(humanImage ? 1 : 0) + (clothImage ? 1 : 0)}/2)</h3>
              <span className="text-xs text-gray-600" style={{ fontSize: '10px' }}>
                {!bothImagesUploaded ? `Upload ${(humanImage || clothImage) ? 1 : 2} more` : 'Ready!'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {/* Human Image */}
              <div className="relative">
                {humanImage ? (
                  <>
                    <img 
                      src={humanImage} 
                      alt="Human Photo" 
                      className="w-full h-8 object-cover rounded-sm border border-gray-300"
                    />
                    <div className="absolute -top-0.5 -right-0.5">
                      <button
                        type="button"
                        onClick={() => removeImage('human')}
                        className="w-3 h-3 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                        style={{ fontSize: '8px' }}
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 text-center leading-tight" style={{ fontSize: '9px' }}>Human Photo</p>
                  </>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-sm h-8 flex items-center justify-center">
                    <span className="text-xs text-gray-500" style={{ fontSize: '9px' }}>Photo</span>
                  </div>
                )}
              </div>

              {/* Cloth Image */}
              <div className="relative">
                {clothImage ? (
                  <>
                    <img 
                      src={clothImage} 
                      alt="Clothing Item" 
                      className="w-full h-8 object-cover rounded-sm border border-gray-300"
                    />
                    <div className="absolute -top-0.5 -right-0.5">
                      <button
                        type="button"
                        onClick={() => removeImage('cloth')}
                        className="w-3 h-3 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                        style={{ fontSize: '8px' }}
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 text-center leading-tight" style={{ fontSize: '9px' }}>Clothing</p>
                  </>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-sm h-8 flex items-center justify-center">
                    <span className="text-xs text-gray-500" style={{ fontSize: '9px' }}>Clothing</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel - Compact Design (matching original) */}
      <div className="relative w-full">
        <div className="w-full p-3 bg-white/40 backdrop-blur-md border border-gray-600/30 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-800">Virtual Try-On</p>
              <p className="text-xs text-gray-600">
                {!humanImage && !clothImage && "Upload 2 images to start"}
                {(humanImage && !clothImage) && "Upload 1 more image"}
                {(!humanImage && clothImage) && "Upload 1 more image"}
                {bothImagesUploaded && !isGenerating && "Ready to generate try-on result!"}
                {isGenerating && "Generating your try-on..."}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Upload Human Image Button */}
              <button
                type="button"
                onClick={() => handleAttachmentClick('human')}
                disabled={isGenerating}
                className={`p-2 rounded-full border transition-all duration-300 hover:scale-110 shadow-sm ${
                  humanImage
                    ? 'bg-green-500 border-green-400 text-white'
                    : 'bg-[#1a1f27] hover:bg-[#2a2f37] border-[#1a1f27] text-white hover:shadow-md'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Upload Human Photo"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Upload Cloth Image Button */}
              <button
                type="button"
                onClick={() => handleAttachmentClick('cloth')}
                disabled={isGenerating}
                className={`p-2 rounded-full border transition-all duration-300 hover:scale-110 shadow-sm ${
                  clothImage
                    ? 'bg-green-500 border-green-400 text-white'
                    : 'bg-[#1a1f27] hover:bg-[#2a2f37] border-[#1a1f27] text-white hover:shadow-md'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Upload Clothing Item"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Generate Try-On Button */}
              <button
                type="button"
                onClick={handleGenerateTryOn}
                disabled={!bothImagesUploaded || isGenerating}
                className={`px-3 py-1.5 rounded-full transition-all duration-300 font-medium text-xs border ${
                  bothImagesUploaded && !isGenerating
                    ? 'bg-[#1a1f27] hover:bg-[#2a2f37] text-white border-black shadow-sm hover:shadow-md'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed border-gray-600'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate Try-On'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageGenerator;
