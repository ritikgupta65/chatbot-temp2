import { ArrowLeft, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';

interface OfferPageProps {
  onGoHome: () => void;
}

interface Offer {
  row_number: number;
  offerId: string;
  Offer_heading: string;
  Offer_text: string;
  Offer_start_date: string;
  Offer_end_date: string;
}

const OfferPage: React.FC<OfferPageProps> = ({ onGoHome }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const OFFERS_WEBHOOK_URL = '/api/offers';

  // Fetch offers from webhook
  const fetchOffers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching offers from webhook...');
      console.log('Request URL:', OFFERS_WEBHOOK_URL);
      
      const response = await fetch(OFFERS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_offers',
          timestamp: new Date().toISOString()
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch offers: ${response.status}`);
      }

      const data = await response.json();
      console.log('Offers fetched:', data);
      
      // Handle both array response and object with offers array
      const offersData = Array.isArray(data) ? data : data.offers || [];
      console.log('Processed offers:', offersData);
      setOffers(offersData);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setError('Failed to load offers. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate milliseconds until next 7PM
  const getMillisecondsUntil7PM = () => {
    const now = new Date();
    const next7PM = new Date();
    
    next7PM.setHours(19, 0, 0, 0); // Set to 7:00 PM today
    
    // If it's already past 7PM today, schedule for tomorrow
    if (now >= next7PM) {
      next7PM.setDate(next7PM.getDate() + 1);
    }
    
    return next7PM.getTime() - now.getTime();
  };

  // Schedule daily fetch at 7PM
  const scheduleDailyFetch = () => {
    const msUntil7PM = getMillisecondsUntil7PM();
    
    console.log(`Next offer fetch scheduled in ${Math.round(msUntil7PM / 1000 / 60)} minutes`);
    
    // Schedule first fetch at 7PM
    const timeoutId = setTimeout(() => {
      fetchOffers();
      
      // Then schedule daily fetches (every 24 hours)
      const intervalId = setInterval(() => {
        fetchOffers();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      // Store interval ID for cleanup
      return () => clearInterval(intervalId);
    }, msUntil7PM);
    
    return () => clearTimeout(timeoutId);
  };

  // Load offers on component mount and schedule daily updates
  useEffect(() => {
    // Fetch offers immediately on mount
    fetchOffers();
    
    // Schedule daily fetch at 7PM
    const cleanup = scheduleDailyFetch();
    
    return cleanup;
  }, []);

  // Load cached offers from localStorage on mount
  useEffect(() => {
    try {
      const cachedOffers = localStorage.getItem('cached_offers');
      const cachedTimestamp = localStorage.getItem('cached_offers_timestamp');
      
      if (cachedOffers && cachedTimestamp) {
        const cacheAge = Date.now() - parseInt(cachedTimestamp);
        // Use cache if less than 24 hours old
        if (cacheAge < 24 * 60 * 60 * 1000) {
          setOffers(JSON.parse(cachedOffers));
          console.log('Loaded offers from cache');
        }
      }
    } catch (error) {
      console.error('Error loading cached offers:', error);
    }
  }, []);

  // Save offers to localStorage when updated
  useEffect(() => {
    if (offers.length > 0) {
      try {
        localStorage.setItem('cached_offers', JSON.stringify(offers));
        localStorage.setItem('cached_offers_timestamp', Date.now().toString());
      } catch (error) {
        console.error('Error caching offers:', error);
      }
    }
  }, [offers]);

  return (
    <div className="h-full flex flex-col rounded-[inherit] bg-slate-100/80 text-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 border-b border-slate-300/60 rounded-t-[inherit]">
        <button
          onClick={onGoHome}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <h2 className="font-bold text-gray-800 tracking-wide" style={{ fontWeight: 400, fontSize: '17px' }}>
          Offers
        </h2>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Body - Scrollable Offer Cards */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 rounded-b-[inherit]">
        <div className="space-y-4 max-w-2xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Loading offers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={fetchOffers}
                className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : offers.length > 0 ? (
            offers.map((offer) => (
              <div
                key={offer.offerId}
                className="w-full bg-white/60 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/50 p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-start space-x-3">
                  {/* Offer Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-gray-700 to-black rounded-full flex items-center justify-center">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Offer Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-800 mb-2">
                      {offer.Offer_heading}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {offer.Offer_text}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-sm">No offers available at the moment.</p>
              <p className="text-gray-500 text-xs mt-2">Check back later for exciting deals!</p>
            </div>
          )}

          {/* Refresh Offers Button */}
          <div className="flex justify-center pt-6 pb-2">
            <button
              onClick={fetchOffers}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                isLoading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gray-700 to-black text-white hover:from-gray-800 hover:to-gray-900 hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
            >
              <svg
                className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isLoading ? 'Refreshing...' : 'Refresh Offers'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferPage;
