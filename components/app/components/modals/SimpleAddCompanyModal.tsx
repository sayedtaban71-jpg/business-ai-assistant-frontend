'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createCompany } from "@/service/api";
import { Company } from "@/types";

const companySchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companyUrl: z.string().url().optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface SimpleAddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyAdded: (company: Company) => void;
}

export default function SimpleAddCompanyModal({ isOpen, onClose, onCompanyAdded }: SimpleAddCompanyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const onSubmit = async (data: CompanyFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create company with required fields
      const companyData = {
        name: data.companyName,
        url: data.companyUrl || '',
        industry: '',
        product: '',
        icp: '',
        notes: '',
        uploaded_data_json: {}
      };
      
      const newCompany = await createCompany(companyData);
      
      // Reset form
      reset();
      
      // Close modal and notify parent
      onCompanyAdded(newCompany);
      onClose();
      
    } catch (error) {
      console.error('Failed to add company:', error);
      alert('Failed to add company. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Add Company to Work With
          </h2>
          <p className="text-gray-600 text-sm">
            Enter the details of the company you want to work with
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Company Name Field */}
          <div>
            <label htmlFor="companyName" className="block text-black font-bold mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="companyName"
              {...register('companyName')}
              placeholder="Enter company name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
            )}
          </div>
          
          {/* Company URL Field */}
          <div>
            <label htmlFor="companyUrl" className="block text-black font-bold mb-2">
              Website URL (Optional)
            </label>
            <input
              type="url"
              id="companyUrl"
              {...register('companyUrl')}
              placeholder="https://company-website.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.companyUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.companyUrl.message}</p>
            )}
          </div>
          
          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
