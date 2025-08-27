import React, { useState } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { Save, Upload, Image, Type, Check } from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings } = useInvoice();
  const [formData, setFormData] = useState(settings);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogoTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      logoType: type,
      logoImage: type === 'text' ? '' : prev.logoImage
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          logoImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderLogoPreview = () => {
    if (formData.logoType === 'image' && formData.logoImage) {
      return (
        <img 
          src={formData.logoImage} 
          alt="Logo Preview" 
          className="h-16 object-contain"
        />
      );
    }
    return (
      <div className="text-xl font-bold text-blue-600">
        {formData.logo || 'Your Logo'}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your invoice management preferences</p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <Check className="h-5 w-5 mr-2" />
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Logo Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Image className="h-5 w-5 mr-2" />
            Logo Settings
          </h2>

          {/* Logo Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Logo Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="logoType"
                  value="text"
                  checked={formData.logoType === 'text'}
                  onChange={(e) => handleLogoTypeChange(e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <Type className="h-4 w-4 mr-1" />
                Text Logo
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="logoType"
                  value="image"
                  checked={formData.logoType === 'image'}
                  onChange={(e) => handleLogoTypeChange(e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <Image className="h-4 w-4 mr-1" />
                Image Logo
              </label>
            </div>
          </div>

          {/* Text Logo Input */}
          {formData.logoType === 'text' && (
            <div className="mb-6">
              <label htmlFor="logo-text" className="block text-sm font-medium text-gray-700 mb-2">
                Logo Text
              </label>
              <input
                type="text"
                id="logo-text"
                value={formData.logo}
                onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                placeholder="Enter your company name or logo text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Image Logo Upload */}
          {formData.logoType === 'image' && (
            <div className="mb-6">
              <label htmlFor="logo-image" className="block text-sm font-medium text-gray-700 mb-2">
                Logo Image
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                  <input
                    type="file"
                    id="logo-image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {formData.logoImage && (
                  <span className="text-sm text-green-600">Image uploaded</span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Recommended: PNG or JPG format, max 2MB
              </p>
            </div>
          )}

          {/* Logo Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-center">
              {renderLogoPreview()}
            </div>
          </div>
        </div>

        {/* PDF Export Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">PDF Export Settings</h2>

          <div className="mb-6">
            <label htmlFor="invoices-per-page" className="block text-sm font-medium text-gray-700 mb-2">
              Invoices per PDF Page
            </label>
            <select
              id="invoices-per-page"
              value={formData.invoicesPerPage}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                invoicesPerPage: parseInt(e.target.value) 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={4}>4 invoices per page</option>
              <option value={6}>6 invoices per page</option>
              <option value={8}>8 invoices per page</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Choose how many invoices to display on each A4 page when exporting to PDF
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
