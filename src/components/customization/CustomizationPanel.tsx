import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Download, Upload, RotateCcw, Palette, Image, Type, MessageSquare } from 'lucide-react';

interface CustomizationPanelProps {
  onClose: () => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ onClose }) => {
  const { theme, updateTheme, resetTheme, exportTheme, importTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'branding' | 'colors' | 'messages'>('branding');

  const gradientOptions = [
    { name: 'Emerald to Lime', value: 'from-emerald-600 to-lime-500' },
    { name: 'Blue to Purple', value: 'from-blue-600 to-purple-500' },
    { name: 'Pink to Rose', value: 'from-pink-600 to-rose-500' },
    { name: 'Orange to Red', value: 'from-orange-600 to-red-500' },
    { name: 'Indigo to Blue', value: 'from-indigo-600 to-blue-500' },
    { name: 'Teal to Cyan', value: 'from-teal-600 to-cyan-500' },
  ];

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateTheme({ logoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportTheme = () => {
    const themeData = exportTheme();
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatbot-theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const success = importTheme(result);
        if (success) {
          alert('Theme imported successfully!');
        } else {
          alert('Failed to import theme. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'branding', icon: Image, label: 'Branding' },
    { id: 'colors', icon: Palette, label: 'Colors' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-3xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">Customize Your Chatbot</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 p-4 transition-colors ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white`
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'branding' && (
            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-white font-medium mb-3">Logo</label>
                <div className="flex items-center space-x-4">
                  {theme.logoUrl && (
                    <img src={theme.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
                  )}
                  <label className="cursor-pointer bg-white/10 border border-white/20 rounded-xl p-3 hover:bg-white/20 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <span className="text-white">Upload Logo</span>
                  </label>
                  {theme.logoUrl && (
                    <button
                      onClick={() => updateTheme({ logoUrl: '' })}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Upload your logo as PNG, JPG, or SVG. Recommended size: 64x64px
                </p>
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-white font-medium mb-3">Brand Name</label>
                <input
                  type="text"
                  value={theme.brandName}
                  onChange={(e) => updateTheme({ brandName: e.target.value })}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  placeholder="Enter your brand name"
                />
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-6">
              {/* Primary Gradient */}
              <div>
                <label className="block text-white font-medium mb-3">Primary Gradient</label>
                <div className="grid grid-cols-2 gap-3">
                  {gradientOptions.map((gradient) => (
                    <button
                      key={gradient.value}
                      onClick={() => updateTheme({ primaryGradient: gradient.value })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme.primaryGradient === gradient.value
                          ? 'border-white'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${gradient.value} mb-2`}></div>
                      <span className="text-white text-sm">{gradient.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div>
                <label className="block text-white font-medium mb-3">Welcome Message</label>
                <textarea
                  value={theme.welcomeMessage}
                  onChange={(e) => updateTheme({ welcomeMessage: e.target.value })}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none"
                  rows={3}
                  placeholder="Enter your welcome message"
                />
              </div>

              {/* Quick Actions */}
              <div>
                <label className="block text-white font-medium mb-3">Quick Actions</label>
                <div className="space-y-2">
                  {theme.quickActions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={action}
                        onChange={(e) => {
                          const newActions = [...theme.quickActions];
                          newActions[index] = e.target.value;
                          updateTheme({ quickActions: newActions });
                        }}
                        className="flex-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                        placeholder={`Quick action ${index + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newActions = theme.quickActions.filter((_, i) => i !== index);
                          updateTheme({ quickActions: newActions });
                        }}
                        className="p-3 text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {theme.quickActions.length < 6 && (
                    <button
                      onClick={() => {
                        updateTheme({ quickActions: [...theme.quickActions, ''] });
                      }}
                      className="w-full p-3 border-2 border-dashed border-white/30 rounded-xl text-white/70 hover:text-white hover:border-white/50 transition-colors"
                    >
                      + Add Quick Action
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/20 flex justify-between">
          <div className="flex space-x-3">
            <button
              onClick={handleExportTheme}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleImportTheme}
                className="hidden"
              />
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={resetTheme}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-600/30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            
            <button
              onClick={onClose}
              className={`px-6 py-2 bg-gradient-to-r ${theme.primaryGradient} rounded-xl text-white font-medium hover:shadow-lg transition-all`}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationPanel;
