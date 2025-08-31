'use client';

import { Building2, Settings, Plus, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { AIContactInfo, Company } from "@/types";
import { ContactInfoDialog } from "@/components/dashboard/ContactInfoDialog";
import {createCompany as createCompanyDB, deleteCompany as deleteCompanyDB, createContact as createContactDB, deleteContact as deleteContactDB} from "@/service/api";

interface SidebarProps {
	companies: Company[] | undefined;
	setCompanies?: React.Dispatch<React.SetStateAction<Company[]>>;
}

export function Sidebar({companies, setCompanies} : SidebarProps) {
	const {
		// companies,
		selectedCompanyId,
		setSelectedCompany,
		// createCompany,
		// deleteCompany
	} = useAppState();

	const [newCompanyName, setNewCompanyName] = useState('');
	const [newCompanyURL, setNewCompanyURL] = useState('');
	const [newCompanyIndustry, setNewCompanyIndustry] = useState('');
	const [newCompanyProduct, setNewCompanyProduct] = useState('');
	const [newCompanyIcp, setNewCompanyIcp] = useState('');
	const [isCreatingCompany, setIsCreatingCompany] = useState(false);
	const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
	
	// Contact state
	const [newContactName, setNewContactName] = useState('');
	const [newContactNote, setNewContactNote] = useState('');
	const [isCreatingContact, setIsCreatingContact] = useState(false);
	const [contactToDelete, setContactToDelete] = useState<string | null>(null);
	const [aiContacts, setAiContacts] = useState<AIContactInfo[]>([]);
	const [isLoadingAIContacts, setIsLoadingAIContacts] = useState(false);
	const [selectedAIContact, setSelectedAIContact] = useState<AIContactInfo | null>(null);
	const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
	let selectedCompany = null;
	if(companies){
		selectedCompany = companies.find(c => c.id === selectedCompanyId);
	}

	// Fetch AI contacts when selected company changes
	useEffect(() => {
		const fetchAIContacts = async () => {
			if (!selectedCompany) {
				setAiContacts([]);
				return;
			}
			try {
				setIsLoadingAIContacts(true);
				const res = await fetch('/api/ai/contacts', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ companyName: selectedCompany.name, companyUrl: selectedCompany.url, count: 5 })
				});
				if (!res.ok) throw new Error(`AI contacts failed: ${res.status}`);
				const data = await res.json();
				setAiContacts(Array.isArray(data.contacts) ? data.contacts as AIContactInfo[] : []);
			} catch (err) {
				console.error(err);
				setAiContacts([]);
			} finally {
				setIsLoadingAIContacts(false);
			}
		};
		fetchAIContacts();
	}, [selectedCompanyId]);

	const handleCreateCompany = async () => {
		// if (!newCompanyName.trim() || !newCompanyIndustry.trim() || !newCompanyProduct.trim() || !newCompanyIcp.trim()) {
		//   return;
		// }

		if (!newCompanyName.trim()) {
			return;
		}

		try {
			const data = {
				name: newCompanyName.trim(),
				industry: newCompanyIndustry.trim(),
				product: newCompanyProduct.trim(),
				icp: newCompanyIcp.trim(),
				notes: '',
				url: newCompanyURL.trim()
			};
			const newCompany = await createCompanyDB(data);

			if (setCompanies && newCompany) {
				setCompanies(prev=>[...prev, newCompany]);
			}

			// Clear form
			setNewCompanyName('');
			setNewCompanyURL('');
			setNewCompanyIndustry('');
			setNewCompanyProduct('');
			setNewCompanyIcp('');
			setIsCreatingCompany(false);
		} catch (error) {
			console.error('Failed to create company:', error);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleCreateCompany();
		}
	};

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
			setIsCreatingContact(false);
			
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

	const handleContactKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleCreateContact();
		}
	};

	const handleDeleteContact = (contactId: string) => {
		setContactToDelete(contactId);
	};

	const handleDeleteContactConfirm = async () => {
		if (!contactToDelete) return;

		try {
			await deleteContactDB(contactToDelete);
			setContactToDelete(null);
			toast({
				title: "Contact deleted successfully",
				description: "The contact has been removed from your list.",
			});
		} catch (error) {
			console.error('Failed to delete contact:', error);
			toast({
				title: "Delete Failed",
				description: "Failed to delete the contact. Please try again.",
				variant: "destructive",
			});
		}
	};

	const handleDeleteCompany = (companyId: string) => {
		// Prevent deleting the last company
		// if (companies && companies.length <= 1) {
		// 	toast({
		// 		title: "Cannot Delete Company",
		// 		description: "You must have at least one company. Create a new one before deleting this one.",
		// 		variant: "destructive",
		// 	});
		// 	return;
		// }

		// If deleting the currently selected company, show a warning
		if (companyId === selectedCompanyId) {
			toast({
				title: "Warning",
				description: "You're deleting the currently selected company. This will clear your current context.",
				variant: "destructive",
			});
		}

		setCompanyToDelete(companyId);
	};

	const handleDeleteConfirm = async () => {
		if (!companyToDelete) return;

		try {
			// await deleteCompany(companyToDelete);
			await deleteCompanyDB(companyToDelete);

			// Remove from local state

			setCompanies && setCompanies(prevCompanies =>
				prevCompanies.filter(company => company.id !== companyToDelete)
			);
			setCompanyToDelete(null);
			toast({
				title: "Company deleted successfully",
				description: "The company has been removed from your list.",
			});
		} catch (error) {
			console.error('Failed to delete company:', error);
			toast({
				title: "Delete Failed",
				description: "Failed to delete the company. Please try again.",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="w-80 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
			<div className="p-6 border-b border-gray-200">
				<h1 className="text-xl font-bold text-gray-900">Sales AI Assistant</h1>
				<p className="text-sm text-gray-600 mt-1">Manage your sales prompts</p>
			</div>

			<div className="flex-1 p-6 space-y-4">
				{/* Company Creation */}
				<Card className="p-4">
					<div className="flex items-center gap-2 mb-3">
						<Building2 className="w-4 h-4 text-primary" />
						<h3 className="font-semibold text-gray-900">Company</h3>
					</div>

					{!isCreatingCompany ? (
						<Button
							onClick={() => setIsCreatingCompany(true)}
							variant="outline"
							className="w-full gap-2"
						>
							<Plus className="w-4 h-4" />
							Add New Company
						</Button>
					) : (
						<div className="space-y-3">
							<Input
								placeholder="Company Name"
								value={newCompanyName}
								onChange={(e) => setNewCompanyName(e.target.value)}
								onKeyPress={handleKeyPress}
							/>
							<Input
								placeholder="URL"
								value={newCompanyURL}
								onChange={(e) => setNewCompanyURL(e.target.value)}
								onKeyPress={handleKeyPress}
							/>
							{/*<Input*/}
							{/*  placeholder="Product/Service"*/}
							{/*  value={newCompanyProduct}*/}
							{/*  onChange={(e) => setNewCompanyProduct(e.target.value)}*/}
							{/*  onKeyPress={handleKeyPress}*/}
							{/*/>*/}
							{/*<Input*/}
							{/*  placeholder="Ideal Customer Profile"*/}
							{/*  value={newCompanyIcp}*/}
							{/*  onChange={(e) => setNewCompanyIcp(e.target.value)}*/}
							{/*  onKeyPress={handleKeyPress}*/}
							{/*/>*/}
							<div className="flex gap-2">
								<Button onClick={handleCreateCompany} size="sm" className="flex-1">
									OK
								</Button>
								<Button
									onClick={() => setIsCreatingCompany(false)}
									variant="ghost"
									size="sm"
								>
									Cancel
								</Button>
							</div>
						</div>
					)}
				</Card>

				{/* Company List */}
				<Card className="p-4">
					<h3 className="font-semibold text-gray-900 mb-3">Companies</h3>
					<div className="space-y-2">
						{companies && companies.map((company) => (
							<div
								key={company.id}
								className={`p-3 rounded-lg transition-colors ${
									selectedCompanyId === company.id
										? 'bg-primary text-white'
										: 'bg-gray-50 hover:bg-gray-100'
								}`}
							>
								<div className="flex items-center justify-between">
									<div
										className="flex-1 cursor-pointer"
										onClick={() => setSelectedCompany(company)}
									>
										<p className={`font-medium ${selectedCompanyId === company.id ? 'text-white' : 'text-gray-900'}`}>
											{company.name}
										</p>
										<p className={`text-sm ${selectedCompanyId === company.id ? 'text-white/80' : 'text-gray-600'}`}>
											{company.industry}
										</p>
										<p className={`text-sm ${selectedCompanyId === company.id ? 'text-white/80' : 'text-gray-600'}`}>
											{company.product}
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteCompany(company.id);
										}}
										className={`ml-2 p-1 h-8 w-8 ${
											selectedCompanyId === company.id
												? 'text-white/80 hover:text-white hover:bg-white/20'
												: 'text-gray-500 hover:text-red-600 hover:bg-red-50'
										}`}
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				</Card>

				{/* AI Suggested Contacts */}
				<Card className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-semibold text-gray-900">Contacts</h3>
						{isLoadingAIContacts && <span className="text-xs text-gray-500">Loading…</span>}
					</div>
					<div className="space-y-2">
						{aiContacts.map((c, idx) => (
							<div key={`${c.name}-${idx}`} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
								 onClick={() => { setSelectedAIContact(c); setIsContactDialogOpen(true); }}>
								<p className="font-medium text-gray-900">{c.name}</p>
								{c.title && <p className="text-sm text-gray-600">{c.title}</p>}
							</div>
						))}
						{(!aiContacts || aiContacts.length === 0) && !isLoadingAIContacts && (
							<p className="text-xs text-gray-500">No contacts yet.</p>
						)}
					</div>
				</Card>

				{/* Contact Creation */}
				<Card className="p-4">
					<div className="flex items-center gap-2 mb-3">
						<User className="w-4 h-4 text-primary" />
						<h3 className="font-semibold text-gray-900">Add Contact</h3>
					</div>

					{!isCreatingContact ? (
						<Button
							onClick={() => setIsCreatingContact(true)}
							variant="outline"
							className="w-full gap-2"
						>
							<Plus className="w-4 h-4" />
							Add New Contact
						</Button>
					) : (
						<div className="space-y-3">
							<Input
								placeholder="Contact Name"
								value={newContactName}
								onChange={(e) => setNewContactName(e.target.value)}
								onKeyPress={handleContactKeyPress}
							/>
							<Input
								placeholder="Note"
								value={newContactNote}
								onChange={(e) => setNewContactNote(e.target.value)}
								onKeyPress={handleContactKeyPress}
							/>
							<div className="flex gap-2">
								<Button onClick={handleCreateContact} size="sm" className="flex-1">
									OK
								</Button>
								<Button
									onClick={() => setIsCreatingContact(false)}
									variant="ghost"
									size="sm"
								>
									Cancel
								</Button>
							</div>
						</div>
					)}
				</Card>

				{/* Context Indicator */}
				{selectedCompany && (
					<div className="context-pill">
						<span className="w-2 h-2 bg-green-500 rounded-full"></span>
						Company Context Active
					</div>
				)}
			</div>

			<div className="p-6 border-t border-gray-200">
				<button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
					<Settings className="w-4 h-4" />
					Settings
				</button>
			</div>

			{/* Delete Company Confirmation Dialog */}
			{companyToDelete && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm mx-4">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Delete Company
						</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete "{companies && companies.find(c => c.id === companyToDelete)?.name}"? This action cannot be undone and will also remove all associated tiles.
						</p>
						<div className="flex gap-3 justify-end">
							<Button
								variant="outline"
								onClick={() => setCompanyToDelete(null)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleDeleteConfirm}
							>
								Delete
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Contact Confirmation Dialog */}
			{contactToDelete && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm mx-4">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Delete Contact
						</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete this contact? This action cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<Button
								variant="outline"
								onClick={() => setContactToDelete(null)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleDeleteContactConfirm}
							>
								Delete
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Contact Info Dialog */}
			<ContactInfoDialog
				isOpen={isContactDialogOpen}
				onOpenChange={setIsContactDialogOpen}
				contact={selectedAIContact}
			/>
		</div>
	);
}