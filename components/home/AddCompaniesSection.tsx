'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, Upload, Database } from 'lucide-react';
import { AddCompanyModal } from './AddCompanyModal';
import {createCompany} from "@/service/api";
import {Company} from "@/types";

interface AddCompaniesSectionProps {
	setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
}

export function AddCompaniesSection({setCompanies}: AddCompaniesSectionProps) {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);

	return (
		<div className="w-full max-w-4xl mx-auto p-6">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Add Companies You Would Like to Work On
				</h1>
				<p className="text-gray-600">
					Start building your prospect list to generate targeted AI insights
				</p>
			</div>

			<div className="flex justify-center">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
							<Plus className="h-8 w-8 text-blue-600" />
						</div>
						<CardTitle className="text-xl">Get Started</CardTitle>
						<CardDescription>
							Add your first company to begin generating AI-powered insights
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Button
							onClick={() => setIsAddModalOpen(true)}
							className="w-full"
							size="lg"
						>
							<Plus className="h-4 w-4 mr-2" />
							Add Your First Company
						</Button>

						<div className="text-center text-sm text-gray-500">
							<p>Coming soon:</p>
							<div className="flex justify-center gap-4 mt-2">
								<div className="flex items-center gap-1">
									<Upload className="h-3 w-3" />
									<span>CSV Upload</span>
								</div>
								<div className="flex items-center gap-1">
									<Database className="h-3 w-3" />
									<span>CRM Integration</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<AddCompanyModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onCompanyAdded={async (company) => {
					const new_row = await createCompany(company);
					if (setCompanies && new_row) {
						setCompanies(prev=>[...prev, new_row]);
					}
					// console.log('Company added:', company);
					setIsAddModalOpen(false);
					// Here you would typically redirect to the company dashboard
				}}
			/>
		</div>
	);
}
