'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import {createCompany} from "@/service/api";
import {Company} from "@/types";

const companySchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companyUrl: z.string().url().optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function ManualCompanyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
      
      // Here you would typically send the data to your API
      // console.log('Adding company to work with:', data);
      
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
      
      await createCompany(companyData);
      // Reset form
      reset();
      
      // Optionally redirect back to company list
      router.push('/company');
      
    } catch (error) {
      console.error('Failed to add company:', error);
      alert('Failed to add company. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Add Company to Work With
          </h1>
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
              onClick={() => router.push('/company')}
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
