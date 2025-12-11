import { useState, useRef, useEffect } from 'react';
import { Paperclip } from 'lucide-react';
import { getUserId } from '@/lib/userIdManager';

interface ImageGeneratorProps {
  onGenerationComplete?: (resultImageUrl: string) => void;
  onError?: (error: string) => void;
  preloadedClothImage?: string | null;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  onGenerationComplete,
  onError,
  preloadedClothImage,
}) => {
  const [humanImage, setHumanImage] = useState<string | null>(null);
  const [clothImage, setClothImage] = useState<string | null>(preloadedClothImage || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<'human' | 'cloth' | null>(null);
  const [userId, setUserId] = useState<string>('');

  const TRY_ON_WEBHOOK_URL = 'https://ritik-n8n-e9673da43cf4.herokuapp.com/webhook/2598d12d-a13f-4759-ae5b-1e0262e33b9c';

  // Initialize userId on component mount
  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

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
    if (!humanImage || !clothImage) {
      onError?.('Please upload both human and cloth images');
      return;
    }

    setIsGenerating(true);

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

      // Send to the specific try-on webhook
      const response = await fetch(TRY_ON_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`);
      }

      const result = await response.json();
      
      // Handle the response from the webhook
      if (result.resultImageUrl || result.image || result.result) {
        const resultUrl = result.resultImageUrl || result.image || result.result;
        onGenerationComplete?.(resultUrl);
        
        // Clear the images after successful generation
        setHumanImage(null);
        setClothImage(null);
      } else {
        throw new Error('No result image received from webhook');
      }
    } catch (error) {
      console.error('Error generating try-on:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to generate try-on. Please try again.');
    } finally {
      setIsGenerating(false);
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
