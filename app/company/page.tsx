'use client';

import {useEffect, useState} from 'react';
import {getCompanies, getContact, getDashboard} from '@/service/api';
import { Company } from '@/types';
import { MainDashboard } from '@/components/dashboard/MainDashboard';
import {ProtectedRoute} from "@/components/auth/ProtectedRoute";
import {AddCompanyDialog} from '@/components/dashboard/AddCompanyDialog';
import {CompanyAdditionOptions} from '@/components/dashboard/CompanyAdditionOptions';
import {useAuth} from "@/hooks/useAuth";
import {useAppState} from "@/hooks/useAppState";
import {OnboardingModal} from "@/components/onboarding/OnboardingModal";
import Cookies from 'js-cookie'


export default function CompanyPage() {
	return (
		<ProtectedRoute>
			<CompanyContent />
		</ProtectedRoute>
	);
}
function CompanyContent() {
	const {companies, setCompanies, addCompany, setContacts, selectedCompany, setSelectedCompany, setDashboards, setCurrentDashboard} = useAppState();
	const { showOnboarding, saveOnboardingData } = useAuth();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
	const [isManualModalOpen, setIsManualModalOpen] = useState(false);
	// const [companies, setCompanies] = useState<Company[]>([]);

	useEffect(() => {
		// Load saved companies from localStorage (this could be moved to backend later)
		async function loadData(){
			const [companies_list, contacts_list, dashboard_list] = await Promise.all([
				getCompanies(),
				getContact(),
				getDashboard()
			]);
			setCompanies(companies_list);
			setContacts(contacts_list);
			setDashboards(dashboard_list);
			setCurrentDashboard(dashboard_list[0].id)
		}
		loadData();
		// console.log(Cookies.get("User_SelectedCompany"))

	}, []);
	useEffect(() => {
		if(selectedCompany && selectedCompany['id']){
			Cookies.set("user_selected_com", selectedCompany['id']);
			localStorage.setItem('User_selected_com', selectedCompany['id']);
		}

	}, [selectedCompany]);

	const toggleDropdown = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	const handleManualClick = () => {
		setIsManualModalOpen(true);
		setIsDropdownOpen(false);
	};

	const handleCompanyAdded = (newCompany: Company) => {
		addCompany(newCompany)
	};

	return (
		<>
			{companies.length > 0 ? (
				<>
					<MainDashboard/>

					{/* Floating Action Button for adding companies when MainDashboard is shown */}
					{/*<button*/}
					{/*	onClick={() => setIsModalOpen(true)}*/}
					{/*	className="fixed bottom-6 right-6 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 shadow-lg z-40"*/}
					{/*	title="Add Company"*/}
					{/*>*/}
					{/*	<span className="text-white text-2xl font-bold">+</span>*/}
					{/*</button>*/}
				</>
			) : (
				<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
					<div className="p-8 max-w-md w-full text-center">
						{/* Title */}
						<h1 className="text-2xl font-semibold text-black mb-6">
							Add Companies To Work
						</h1>

						{/* Plus Button */}
						<div className="relative">
							<button
								onClick={toggleDropdown}
								className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 mx-auto mb-4"
							>
								<span className="text-white text-2xl font-bold">+</span>
							</button>

							{/* Dropdown Menu */}
							{isDropdownOpen && (
								<div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white
                 shadow-lg z-10">
									<div>
										<button
											onClick={() => setIsOptionsModalOpen(true)}
											className="w-full px-4 py-3 text-left text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
										>
											Add Company
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			<OnboardingModal isOpen={showOnboarding} onComplete={saveOnboardingData}/>

			{/* Company Addition Options Modal */}
			<CompanyAdditionOptions
				isOpen={isOptionsModalOpen}
				onClose={() => setIsOptionsModalOpen(false)}
			/>

			{/* Manual Add Company Modal */}
			<AddCompanyDialog
				isOpen={isManualModalOpen}
				onClose={() => setIsManualModalOpen(false)}
			/>
		</>
	);
}
