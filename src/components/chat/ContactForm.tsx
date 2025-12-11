import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface ContactFormProps {
  onGoHome: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onGoHome }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    message: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    mobile: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      mobile: ''
    };

    let isValid = true;

    // Validate Name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Validate Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email';
      isValid = false;
    }

    // Validate Mobile
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Google Apps Script Web App URL - Must end with /exec
      // Format: https://script.google.com/macros/s/AKfycbz.../exec
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYMqBTIADLi-RLzSocmJklNDUZEV8rkLYb_aemdQeBW1DC-5MBtfrGiLmfNmGP8-IY/exec';

      // Use URL encoded payload + no-cors to avoid preflight/CORS issues
      const payload = new URLSearchParams();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('mobile', formData.mobile);
      payload.append('message', formData.message);

      const now = new Date();
      const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }).format(now);
      const formattedTime = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(now);
      payload.append('timestamp', `${formattedDate} , ${formattedTime}`);

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: payload,
      });

      console.log('Form submitted (fire-and-forget):', formData);
      
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({ name: '', email: '', mobile: '', message: '' });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

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
          Contact Form
        </h2>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 rounded-b-[inherit]">
        <div className="max-w-md mx-auto">
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              Thank you! Your form has been submitted successfully.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 bg-transparent border-0 border-b focus:outline-none transition-colors font-[340] text-[0.95rem] ${
                  errors.name 
                    ? 'border-red-400 focus:border-red-500' 
                    : 'border-gray-600 focus:border-gray-900'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 bg-transparent border-0 border-b focus:outline-none transition-colors font-[340] text-[0.95rem] ${
                  errors.email 
                    ? 'border-red-400 focus:border-red-500' 
                    : 'border-gray-600 focus:border-gray-900'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Mobile Number Field */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 bg-transparent border-0 border-b focus:outline-none transition-colors font-[340] text-[0.95rem] ${
                  errors.mobile 
                    ? 'border-red-400 focus:border-red-500' 
                    : 'border-gray-600 focus:border-gray-900'
                }`}
              />
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>
              )}
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-gray-600 focus:outline-none focus:border-gray-900 transition-colors resize-none overflow-hidden font-[340] text-[0.95rem]"
                style={{ minHeight: '2.3rem' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gray-700 to-black hover:from-gray-800 hover:to-gray-900 hover:shadow-lg transform hover:scale-[1.02]'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>

            <p className="text-center text-[0.95rem] text-gray-600 font-[340]">
              After sending your message, we will get back to you within 24 hours.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
