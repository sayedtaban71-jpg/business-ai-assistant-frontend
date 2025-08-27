'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Mail, Calendar, Building2, Plus } from 'lucide-react';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { AddCompaniesSection } from '@/components/home/AddCompaniesSection';
import {MainDashboard} from '@/components/dashboard/MainDashboard';
import {getCompanies} from "@/service/api";
import {Company, Tile} from '@/types';

export default function DashboardPage() {
	return (
		<ProtectedRoute>
			<DashboardContent />
		</ProtectedRoute>
	);
}

function DashboardContent() {
	const { user, logout, showOnboarding, setShowOnboarding, onboardingData } = useAuth();
	const [companies, setCompanies] = useState<Company[]>([]);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

	useEffect(() => {
		// Load saved companies from localStorage (this could be moved to backend later)
		async function loadData(){
			const [companies] = await Promise.all([
				getCompanies(),
			]);
			setCompanies(companies);
		}
		loadData()
	}, []);
	
	const handleOnboardingComplete = (data: any) => {
		// This is now handled by the hook, but we can add additional logic here if needed
		// console.log('Onboarding completed:', data);
	};

	const handleCompanyAdded = (company: Company) => {
		const updatedCompanies = [...companies, company];
		setCompanies(updatedCompanies);
		localStorage.setItem('userCompanies', JSON.stringify(updatedCompanies));

		// Auto-select the newly added company
		setSelectedCompany(company);
	};

	const handleCompanySelect = (company: Company) => {
		setSelectedCompany(company);
	};

	// If a company is selected, show the company dashboard
	if (companies.length > 0) {
		return (
			<MainDashboard/>
		);
	}

	// Show companies list or add companies section
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b p-4">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-4">
						<h1 className="text-2xl font-bold text-gray-900">Your Companies</h1>
						{onboardingData && (
							<span className="text-sm text-gray-500">
                Selling: {onboardingData.description}
              </span>
						)}
					</div>
					<Button onClick={logout} variant="outline" className="flex items-center gap-2">
						<LogOut className="h-4 w-4" />
						Logout
					</Button>
				</div>
			</div>

			{/* Content */}
			<div className="p-6">
				{/*{companies.length === 0 ? (*/}
				<AddCompaniesSection setCompanies={setCompanies}/>
				{/*) : (*/}
				{/*  <div className="max-w-7xl mx-auto">*/}
				{/*    <div className="flex items-center justify-between mb-6">*/}
				{/*      <h2 className="text-xl font-semibold text-gray-900">*/}
				{/*        Your Prospect Companies ({companies.length})*/}
				{/*      </h2>*/}
				{/*      <Button onClick={() => setShowOnboarding(true)} className="flex items-center gap-2">*/}
				{/*        <Plus className="h-4 w-4" />*/}
				{/*        Add Company*/}
				{/*      </Button>*/}
				{/*    </div>*/}

				{/*    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">*/}
				{/*      {companies.map((company, index) => (*/}
				{/*        <Card */}
				{/*          key={index} */}
				{/*          className="hover:shadow-lg transition-shadow cursor-pointer"*/}
				{/*          onClick={() => handleCompanySelect(company)}*/}
				{/*        >*/}
				{/*          <CardHeader>*/}
				{/*            <div className="flex items-center gap-3">*/}
				{/*              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">*/}
				{/*                <Building2 className="h-5 w-5 text-blue-600" />*/}
				{/*              </div>*/}
				{/*              <div>*/}
				{/*                <CardTitle className="text-lg">{company.name}</CardTitle>*/}
				{/*                {company.url && (*/}
				{/*                  <CardDescription className="text-sm">*/}
				{/*                    {company.url}*/}
				{/*                  </CardDescription>*/}
				{/*                )}*/}
				{/*              </div>*/}
				{/*            </div>*/}
				{/*          </CardHeader>*/}
				{/*          <CardContent>*/}
				{/*            <Button variant="outline" className="w-full">*/}
				{/*              View Dashboard*/}
				{/*            </Button>*/}
				{/*          </CardContent>*/}
				{/*        </Card>*/}
				{/*      ))}*/}
				{/*    </div>*/}
				{/*  </div>*/}
				{/*)}*/}
			</div>

			{/* Onboarding Modal */}
			<OnboardingModal
				isOpen={showOnboarding}
				onComplete={handleOnboardingComplete}
			/>
		</div>
	);
}
