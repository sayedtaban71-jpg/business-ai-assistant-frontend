import { ReactNode, useState, useEffect, useRef } from "react";
import '@/app/globals.css';
import {useAuth} from "@/hooks/useAuth";
import { useAppState } from "@/hooks/useAppState";
import { CompanyAdditionOptions } from "@/components/dashboard/CompanyAdditionOptions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createContact as createContactDB } from "@/service/api";
import { toast } from "@/hooks/use-toast";
import { Company, AIContactInfo } from "@/types";
import { ContactInfoDialog } from "@/components/dashboard/ContactInfoDialog";

export function SideBarLayout() {
	const {logout, user} = useAuth()
	const { 
		companies, 
		tiles,
		dashboards,
		setCurrentDashboard,
		selectedCompanyId,
		currentDashboardId,
		selectedCompany, 
		setSelectedCompany,
		selectedTemplateId,
		setSelectedTemplate,
		contacts,
		selectedContact,
		addCompany
	} = useAppState();

	// Ensure we have safe defaults for potentially null values
	const safeSelectedCompany = selectedCompany || null;
	const safeSelectedContact = selectedContact || null;
	const safeCompanies = companies || [];
	const safeContacts = contacts || [];
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [showWideMenu, setShowWideMenu] = useState(false);
	const [isCompanyAdditionOptionsOpen, setIsCompanyAdditionOptionsOpen] = useState(false);
	const [isCreatingNewContact, setIsCreatingNewContact] = useState(false);
	const [newContactName, setNewContactName] = useState('');
	const [newContactNote, setNewContactNote] = useState('');
	const menuRef = useRef<HTMLDivElement>(null);
	const sidebarRef = useRef<HTMLDivElement>(null);
	const [aiContacts, setAiContacts] = useState<AIContactInfo[]>([]);
	const [isLoadingAIContacts, setIsLoadingAIContacts] = useState(false);
	const [selectedAIContact, setSelectedAIContact] = useState<AIContactInfo | null>(null);
	const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

	const handleCompanyAdded = (company?: Company) => {
		if (company && addCompany) {
			addCompany(company);
		}
		// Don't redirect - stay on current page
	};

	// Additional safety check for when companies or contacts might be undefined
	if (!safeCompanies || !safeContacts) {
		console.warn('Companies or contacts are undefined, using empty arrays as fallback');
	}

	// Ensure all required functions exist
	if (!setSelectedCompany) {
		console.error('setSelectedCompany is undefined');
	}

	const handleCreateContact = async () => {
		if (!newContactName.trim()) {
			return;
		}

		try {
			const data = {
				name: newContactName.trim(),
				note: newContactNote.trim()
			};
			const newContact = await createContactDB(data);
			
			if (newContact) {
				// Add to local state if needed
				// You might need to implement addContact in useAppState
			}

			// Clear form
			setNewContactName('');
			setNewContactNote('');
			setIsCreatingNewContact(false);
			
			toast({
				title: "Contact created successfully",
				description: "The contact has been added to your list.",
			});
		} catch (error) {
			console.error('Failed to create contact:', error);
			toast({
				title: "Create Failed",
				description: "Failed to create the contact. Please try again.",
				variant: "destructive",
			});
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleCreateContact();
		}
	};

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowUserMenu(false);
			}
		};

		if (showUserMenu) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showUserMenu]);

	// Sidebar width now changes ONLY via the hamburger button

	// Fetch AI-generated contacts when company changes
	useEffect(() => {
		const fetchAIContacts = async () => {
			const activeCompany = selectedCompany || (companies?.find(c => c.id === selectedCompanyId) ?? null);
			if (!activeCompany) {
				setAiContacts([]);
				return;
			}
			try {
				setIsLoadingAIContacts(true);
				const res = await fetch('/api/ai/contacts', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						companyName: activeCompany.name,
						companyUrl: activeCompany.url,
						count: 5
					})
				});
				if (!res.ok) throw new Error(`AI contacts failed: ${res.status}`);
				const data = await res.json();
				setAiContacts(Array.isArray(data?.contacts) ? (data.contacts as AIContactInfo[]) : []);
			} catch (err) {
				console.error(err);
				setAiContacts([]);
			} finally {
				setIsLoadingAIContacts(false);
			}
		};

		fetchAIContacts();
	}, [selectedCompanyId, selectedCompany?.name, selectedCompany?.url, companies?.length]);

	useEffect(() => {
		if (showWideMenu) {
			document.body.classList.add('sidebar-wide');
		} else {
			document.body.classList.remove('sidebar-wide');
		}
		return () => {
			document.body.classList.remove('sidebar-wide');
		};
	}, [showWideMenu]);

	return (
		<>
		<div ref={sidebarRef}
			 className={`fixed z-50 ${showWideMenu ? 'w-64' : 'w-16'} transition-all duration-300 shadow-gray-500 
			 drop-shadow-xl top-0 h-full bg-white border-l border-gray-200 flex flex-col hidden lg:flex`}
			 style={{ width: showWideMenu ? '16rem' : '4rem' }}>
			
			{/* When closed: Just hamburger menu centered at top */}
			{!showWideMenu && (
				<div className="flex flex-col w-full items-center pt-6">
					{/* Centered Hamburger Menu Icon */}
					<div className="flex flex-col space-y-1 cursor-pointer" onClick={() => setShowWideMenu(prev => !prev)}
						 aria-label="Toggle menu" role="button" tabIndex={0}>
						<div className="w-5 h-0.5 bg-gray-600"></div>
						<div className="w-5 h-0.5 bg-gray-600"></div>
						<div className="w-5 h-0.5 bg-gray-600"></div>
					</div>
				</div>
			)}

			{/* When open: Full sidebar content */}
			{showWideMenu && (
				<>
			{/* Top Section */}
			<div className="flex flex-col w-full items-center">
						<div className="flex flex-col w-full items-center space-y-2">
							<div className="flex w-full items-center justify-between px-2">
								{/* Username with dropdown */}
								<div className="flex items-center gap-2" ref={menuRef}>
									<button
										className="text-lg font-bold flex items-center gap-1"
										onClick={() => setShowUserMenu(prev => !prev)}
									>
										{user?.email || user?.id || 'User'}
										<svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
									</button>
									{showUserMenu && (
										<div className="absolute mt-10 left-4 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
											<button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Profile</button>
											<button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Settings</button>
											<button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Logout</button>
										</div>
									)}
					</div>

					{/* Hamburger Menu Icon */}
					<div className="flex flex-col space-y-1 cursor-pointer" onClick={() => setShowWideMenu(prev => !prev)}
						 aria-label="Toggle menu" role="button" tabIndex={0}>
						<div className="w-5 h-0.5 bg-gray-600"></div>
						<div className="w-5 h-0.5 bg-gray-600"></div>
						<div className="w-5 h-0.5 bg-gray-600"></div>
					</div>
				</div>
			</div>
					</div>

					<div className="flex-1 flex-col overflow-auto w-full">
				<div className="flex-1">
					{/* Company List Section */}
							<div className="flex flex-col w-full pl-10 items-start space-y-4 mt-8">
						<div className="flex items-center space-x-2">
							<div className="w-6 h-6 cursor-pointer">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-600">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
										  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
								</svg>
							</div>
									<button
										className="text-lg font-bold"
										onClick={() => window.dispatchEvent(new CustomEvent('show-companies-list'))}
									>
								Companies
									</button>
									<button
										onClick={() => setIsCompanyAdditionOptionsOpen(true)}
										className="ml-2 p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
										title="Add Company"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
										</svg>
									</button>
						</div>

						{/* Companies List */}
							<div className="w-full px-2 space-y-2">
									{safeCompanies.map((company) => (
									<div
										key={company.id}
											onClick={() => {
												if (setSelectedCompany) {
													setSelectedCompany(company);
													// Dispatch event to show company dashboard
													window.dispatchEvent(new CustomEvent('show-assistant-dashboard'));
												}
											}}
										className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
												safeSelectedCompany?.id === company.id
												? 'bg-blue-100 text-blue-700'
												: 'hover:bg-gray-100 text-gray-700'
										}`}
									>
										<div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
										<p className="text-sm font-medium truncate">{company.name}</p>
									</div>
								))}
									{safeCompanies.length === 0 && (
									<p className="text-xs text-gray-500 text-center px-2">No companies</p>
								)}
							</div>
					</div>

							{/* Suggested Contacts Section */}
							<div className="flex flex-col w-full pl-10 items-start space-y-4 mt-8">
							<div className="w-full px-2 space-y-2">
									<div className="flex items-center justify-between">
										<p className="text-sm font-semibold text-gray-800">Contacts</p>
										{isLoadingAIContacts && <span className="text-xs text-gray-500">Loading…</span>}
									</div>
									{aiContacts.map((c, idx) => (
										<div
											key={`${c.name}-${idx}`}
											onClick={() => { setSelectedAIContact(c); setIsContactDialogOpen(true); }}
											className="flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 text-gray-700"
										>
											<div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
											<p className="text-sm font-medium truncate">{c.name}</p>
									</div>
								))}
									{!isLoadingAIContacts && aiContacts.length === 0 && (
										<p className="text-xs text-gray-500 text-center px-2">No contacts</p>
								)}
							</div>
					</div>

					{/* Spacer to push bottom icons down */}
					<div className="flex-1"></div>
				</div>
			</div>
				</>
			)}
					</div>

		{/* Create Contact Dialog */}
		<Dialog open={isCreatingNewContact} onOpenChange={setIsCreatingNewContact}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Contact</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label htmlFor="contactName">Contact Name</Label>
						<Input
							id="contactName"
							value={newContactName}
							onChange={(e) => setNewContactName(e.target.value)}
							placeholder="Enter contact name"
							onKeyDown={handleKeyDown}
						/>
				</div>
					<div>
						<Label htmlFor="contactNote">Note</Label>
						<Input
							id="contactNote"
							value={newContactName}
							onChange={(e) => setNewContactNote(e.target.value)}
							placeholder="Enter contact note"
							onKeyDown={handleKeyDown}
						/>
				</div>
			</div>
				<div className="flex justify-end gap-2 pt-4">
					<Button variant="outline" onClick={() => setIsCreatingNewContact(false)}>
						Cancel
					</Button>
					<Button onClick={handleCreateContact}>
						Create Contact
					</Button>
		</div>
			</DialogContent>
		</Dialog>

		{/* Contact Info Dialog for AI-suggested contacts */}
		<ContactInfoDialog
			isOpen={isContactDialogOpen}
			onOpenChange={setIsContactDialogOpen}
			contact={selectedAIContact}
		/>

		{/* Company Addition Options Modal */}
		<CompanyAdditionOptions
			isOpen={isCompanyAdditionOptionsOpen}
			onClose={() => setIsCompanyAdditionOptionsOpen(false)}
			onSuccess={handleCompanyAdded}
		/>
	</>
	);
}