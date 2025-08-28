'use client';

import { useState } from 'react';
import { AddCompanyDialog } from './AddCompanyDialog';
import { CSVUploadDialog } from './CSVUploadDialog';
import { CRMConnectDialog } from './CRMConnectDialog';
import { Company } from '@/types';

interface CompanyAdditionOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (company?: Company) => void;
}

export function CompanyAdditionOptions({ isOpen, onClose, onSuccess }: CompanyAdditionOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<'manual' | 'csv' | 'crm' | null>(null);

  const handleOptionSelect = (option: 'manual' | 'csv' | 'crm') => {
    setSelectedOption(option);
  };

  const handleClose = () => {
    setSelectedOption(null);
    onClose();
  };

  const handleSuccess = (company?: Company) => {
    setSelectedOption(null);
    onClose();
    if (onSuccess) {
      onSuccess(company);
    }
  };

  if (!isOpen) return null;

  if (selectedOption === 'manual') {
    return (
      <AddCompanyDialog
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );
  }

  if (selectedOption === 'csv') {
    return (
      <CSVUploadDialog
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );
  }

  if (selectedOption === 'crm') {
    return (
      <CRMConnectDialog
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-black mb-6">
            Add Companies To Work
          </h2>
          
          {/* Plus Button */}
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-2xl font-bold">+</span>
            </div>
          </div>

          {/* Option Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOptionSelect('manual')}
              className="w-full px-4 py-3 text-left text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200 rounded-md"
            >
              Manually
            </button>
            <button
              onClick={() => handleOptionSelect('csv')}
              className="w-full px-4 py-3 text-left text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200 rounded-md"
            >
              CSV Upload
            </button>
            <button
              onClick={() => handleOptionSelect('crm')}
              className="w-full px-4 py-3 text-left text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200 rounded-md"
            >
              Connect CRM
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="text-center">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
