'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { createCompany } from '@/service/api';
import { Company } from '@/types';
import { useAppState } from '@/hooks/useAppState';
import Papa from 'papaparse';

interface CSVUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CSVCompanyData {
  companyName: string;
  companyUrl: string;
  industry?: string;
  product?: string;
  icp?: string;
  notes?: string;
}

export function CSVUploadDialog({ isOpen, onClose, onSuccess }: CSVUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCompanies, setUploadedCompanies] = useState<CSVCompanyData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addCompany } = useAppState();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsUploading(false);
        
        if (results.errors.length > 0) {
          toast({
            title: "CSV parsing error",
            description: "Please check your CSV format",
            variant: "destructive",
          });
          return;
        }

        const companies = results.data.map((row: any) => ({
          companyName: row.companyName || row['Company Name'] || row['company_name'] || row.name || '',
          companyUrl: row.companyUrl || row['Company URL'] || row['company_url'] || row.url || row.website || '',
          industry: row.industry || row.Industry || '',
          product: row.product || row.Product || '',
          icp: row.icp || row.ICP || row['Ideal Customer Profile'] || '',
          notes: row.notes || row.Notes || row.description || '',
        })).filter(company => company.companyName.trim() !== '');

        if (companies.length === 0) {
          toast({
            title: "No valid companies found",
            description: "Please ensure your CSV has company names",
            variant: "destructive",
          });
          return;
        }

        setUploadedCompanies(companies);
        toast({
          title: "CSV uploaded successfully",
          description: `Found ${companies.length} companies`,
        });
      },
      error: (error) => {
        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    });
  };

  const handleProcessCompanies = async () => {
    if (uploadedCompanies.length === 0) return;

    setIsProcessing(true);
    
    try {
      for (const companyData of uploadedCompanies) {
        const companyPayload = {
          name: companyData.companyName,
          url: companyData.companyUrl,
          industry: companyData.industry || '',
          product: companyData.product || '',
          icp: companyData.icp || '',
          notes: companyData.notes || '',
          uploaded_data_json: {
            source: 'csv_upload',
            original_data: companyData
          }
        };

        const newCompany = await createCompany(companyPayload);
        if (newCompany) {
          addCompany(newCompany);
        }
      }

      toast({
        title: "Companies added successfully",
        description: `Added ${uploadedCompanies.length} companies`,
      });

      // Pass the first company as a representative (or you could pass an array if needed)
      if (uploadedCompanies.length > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to add companies:', error);
      toast({
        title: "Error adding companies",
        description: "Some companies may not have been added",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setUploadedCompanies([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = "companyName,companyUrl,industry,product,icp,notes\nExample Corp,https://example.com,Technology,SaaS Software,Small businesses,Great company";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'company_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-4 p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-lg font-semibold">Upload Companies via CSV</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csvFile" className="text-sm font-medium">
                Select CSV File
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUploading}
              />
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Expected columns:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">companyName, companyUrl, industry, product, icp, notes</code>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              className="text-sm"
            >
              Download Template
            </Button>
          </div>

          {/* Uploaded Companies Preview */}
          {uploadedCompanies.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Preview ({uploadedCompanies.length} companies)</h3>
              <div className="max-h-60 overflow-y-auto border rounded-md p-3 bg-gray-50">
                {uploadedCompanies.slice(0, 5).map((company, index) => (
                  <div key={index} className="text-sm py-1 border-b border-gray-200 last:border-b-0">
                    <div className="font-medium">{company.companyName}</div>
                    <div className="text-gray-600">{company.companyUrl || 'No URL'}</div>
                  </div>
                ))}
                {uploadedCompanies.length > 5 && (
                  <div className="text-sm text-gray-500 py-1">
                    ... and {uploadedCompanies.length - 5} more companies
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleProcessCompanies}
              disabled={uploadedCompanies.length === 0 || isProcessing}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isProcessing ? 'Processing...' : `Add ${uploadedCompanies.length} Companies`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
