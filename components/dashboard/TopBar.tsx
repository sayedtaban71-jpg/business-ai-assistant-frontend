'use client';

import { LogOut, MoreHorizontal, LayoutGrid, Plus, Copy, Trash2, Brush, Building2, Save as SaveIcon , Image as ImageIcon, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/hooks/useAppState';
import { UserCompany } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import * as React from 'react';
import {createCompany as createCompanyDB, deleteCompany as deleteCompanyDB, uploadBackgroundImage, createContact as createContactDB, deleteContact as deleteContactDB} from '@/service/api';
import {Company} from "@/types";
import {toast} from "@/hooks/use-toast";
import {useEffect, useState} from "react";
import {AddTileDialog} from "@/components/dashboard/AddTileDialog";
import {BulkUploadDialog} from "@/components/dashboard/BulkUploadDialog";
import {CompanyAdditionOptions} from "@/components/dashboard/CompanyAdditionOptions";
import {NotesTileDialog} from "@/components/dashboard/NotesTileDialog";
import Cookies from 'js-cookie'
import ApiHelper from "@/utils/apiHelper";

interface TopBarProps {
	onboardingData: UserCompany | null,
	logout: ()=> Promise<void>,
	isCompaniesList?: boolean
}

export function TopBar({onboardingData, logout, isCompaniesList = false}: TopBarProps) {
	const { user } = useAuth();
	console.log('TopBar user:', user); // Debug log
	const { currentBoardId,
		contextVersion,
		dashboards,
		currentDashboardId,
		setCurrentDashboard,
		createDashboard,
		renameDashboard,
		deleteDashboard,
		cloneDashboard,
		tiles,

		setSelectedCompany,
		selectedCompanyId,
		companies,
		addCompany,
		removeCompanyById,

		contacts,
		addContact,
		removeContactById,
		setSelectedContact,
		selectedContactId,
		resetTileSizes,

	} = useAppState();
	const [isRenaming, setIsRenaming] = React.useState<string | null>(null);
	const [isAddTileDialogOpen, setIsAddTileDialogOpen] = useState(false);
	const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
	const [isNotesTileDialogOpen, setIsNotesTileDialogOpen] = useState(false);
	const [bulkUploadTab, setBulkUploadTab] = useState<'individual' | 'bulk'>('individual');
	const [isDeletingCompany, setIsDeletingCompany] = useState<boolean>(false);
	const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
	const [renameValue, setRenameValue] = React.useState('');
	const [isCompanyAdditionOptionsOpen, setIsCompanyAdditionOptionsOpen] = useState(false);
	const [isCreatingNewContact, setIsCreatingNewContact] = useState(false);
	const [newContactName, setNewContactName] = useState('');
	const [newContactNote, setNewContactNote] = useState('');
	const [isSavingTemplate, setIsSavingTemplate] = useState(false);
	const [isDeletingContact, setIsDeletingContact] = useState(false);
	const [contactToDelete, setConactToDelete] = useState('');
	const [isCSVTemplateDialogOpen, setIsCSVTemplateDialogOpen] = useState(false);
	const [csvTemplateData, setCSVTemplateData] = useState<{ dashboard: any, tiles: any[] } | null>(null);
	
	const colorOptions = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#fef3c7', '#fee2e2', '#dcfce7', '#dbeafe', '#e9d5ff', '#111827'];
	const presetImageOptions = [
		'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
		'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
		'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
		'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
	];
	useEffect(()=>{
		ApiHelper.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/backgrounds/`)
	},[])
	const fileInputRef = React.useRef<HTMLInputElement | null>(null);
	const csvFileInputRef = React.useRef<HTMLInputElement | null>(null);



	const handleDeleteCompany = (companyId: string) => {
		if (companyId === selectedCompanyId) {
			toast({
				title: "Warning",
				description: "You're deleting the currently selected company. This will clear your current context.",
				variant: "destructive",
			});
		}
		setIsDeletingCompany(true);
		setCompanyToDelete(companyId);
	};

	const handleCompanyAdded = (company?: Company) => {
		if (company && addCompany) {
			addCompany(company);
		}
		// Don't redirect - stay on current page
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleCreateContact();
		}
	};
	const handleDeleteConfirm = async () => {
		if (!companyToDelete) return;

		try {
			// await deleteCompany(companyToDelete);
			await deleteCompanyDB(companyToDelete);

			// Remove from local state
			removeCompanyById(companyToDelete)
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
	const handleAddCompanyDialogOpen = ()=>{
		setIsCompanyAdditionOptionsOpen(true)
	}

	const handleSaveTemplate = () => {
		// Download current dashboard template as CSV
		const currentDashboard = dashboards.find(d => d.id === currentDashboardId);
		if (!currentDashboard) return;

		// Create CSV content
		const csvData = [
			['Dashboard Name', currentDashboard.name],
			['Dashboard ID', currentDashboard.id],
			['Created At', new Date().toISOString()],
			[''],
			['Tiles'],
			['ID', 'Title', 'Base Prompt', 'Example Answer', 'Order', 'Status', 'Created At', 'Updated At']
		];

		// Add tiles data
		tiles.forEach(tile => {
			csvData.push([
				tile.id,
				tile.title || '',
				tile.base_prompt || '',
				tile.ex_answer || '',
				tile.order?.toString() || '0',
				tile.status || 'idle',
				tile.created_at || new Date().toISOString(),
				tile.updated_at || new Date().toISOString()
			]);
		});

		// Convert to CSV string
		const csvContent = csvData.map(row => 
			row.map(cell => `"${cell || ''}"`).join(',')
		).join('\n');

		// Create and download file
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `${currentDashboard.name}_template.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		toast({
			title: "Template Downloaded!",
			description: "Dashboard template has been downloaded as CSV file.",
		});
	}

	const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			if (!text) return;

			try {
				// Parse CSV content
				const lines = text.split('\n');
				const dashboardData: any = {};
				const tilesData: any[] = [];
				let isReadingTiles = false;

				lines.forEach((line, index) => {
					if (index === 0) return; // Skip header
					
					const values = line.split(',').map(v => v.replace(/"/g, '').trim());
					
					if (values.length === 2 && values[0] && values[1]) {
						// Dashboard metadata
						dashboardData[values[0]] = values[1];
					} else if (values.length >= 8 && values[0] === 'ID') {
						// Tiles header
						isReadingTiles = true;
					} else if (isReadingTiles && values.length >= 8) {
						// Tile data
						tilesData.push({
							id: values[0],
							title: values[1],
							base_prompt: values[2],
							ex_answer: values[3],
							order: parseInt(values[4]) || 0,
							status: values[5] || 'idle',
							created_at: values[6],
							updated_at: values[7]
						});
					}
				});

				// Display the parsed data in a dialog
				setCSVTemplateData({ dashboard: dashboardData, tiles: tilesData });
				setIsCSVTemplateDialogOpen(true);

			} catch (error) {
				console.error('Error parsing CSV:', error);
				toast({
					title: "Error",
					description: "Failed to parse CSV file. Please check the file format.",
					variant: "destructive",
				});
			}
		};

		reader.readAsText(file);
		event.target.value = ''; // Reset input
	};
	const handleSaveTemplateConfirm = () =>{
		setIsSavingTemplate(false);
		toast({
			title: "Successfully saved Template!",
			description: "The Template has been saved to your list.",
		});
	}

	const handleOpenCreateContactDialog = () => {
		setIsCreatingNewContact(true)
	}

	const handleCreateContact = async () => {
		const data = {
			name: newContactName.trim(),
			note: newContactNote.trim()
		}
		// TODO: Uncomment and use when backend is ready
		const newContact = await createContactDB(data);
		newContact && addContact(newContact)
		setIsCreatingNewContact(false);
	}
	const openContactDeletDialog = (id:string) => {
		setConactToDelete(id);
		setIsDeletingContact(true);
	}
	const handleDeleteContact = async () => {
		// TODO: Implement contact deletion
		deleteContactDB(contactToDelete)
		setIsDeletingContact(false);
		removeContactById(contactToDelete);
	};

	const handleRefreshDashboard = () => {
		// Reset tile sizes to consistent format instead of full page reload
		const userId = user?.id?.toString() || 'default';
		
		try {
			// Clear saved tile positions from localStorage
			if (typeof window !== 'undefined') {
				const tilePositionsKey = 'tilePositionsById';
				const currentPositions = JSON.parse(localStorage.getItem(tilePositionsKey) || '{}');
				
				// Clear user-specific data
				if (currentPositions[userId]) {
					delete currentPositions[userId];
					localStorage.setItem(tilePositionsKey, JSON.stringify(currentPositions));
				}
			}
			
			// Reset all tile sizes to medium using app state
			resetTileSizes();
			
			// Force a re-render by updating app state
			window.dispatchEvent(new CustomEvent('dashboard-refresh'));
			
			toast({
				title: "Dashboard Refreshed",
				description: "All tiles have been reset to consistent sizing.",
			});
		} catch (error) {
			console.error('Error refreshing dashboard:', error);
			// Fallback to page reload if operations fail
			window.location.reload();
		}
	};
	return (
		<>
			<div className="bg-white border-b border-gray-200 px-6 py-4">
				{/* Top Section: Breadcrumb, Company Title, and Dashboard Controls */}
				<div className="flex items-start justify-between mb-4">
					{/* Left Side: Breadcrumb and Company Title */}
					<div className="flex flex-col space-y-2">
						{/* Breadcrumb Navigation */}
						<div className="flex items-center text-sm text-gray-500">
							<span className="text-gray-600">Companies</span>
							<span className="mx-2">/</span>
							<span className="text-gray-500">{companies?.find(c => c.id === selectedCompanyId)?.name || 'Select Company'}</span>
						</div>
						{/* Company Title */}
						<h1 className="text-3xl font-bold text-gray-900">
							{companies?.find(c => c.id === selectedCompanyId)?.name || 'Select Company'}
						</h1>
					</div>

					{/* Right Side: Dashboard Controls */}
					{!isCompaniesList && (
						<div className="flex items-center gap-3">
							{/* Refresh Button */}
										<Button
											variant="ghost"
											size="sm"
								className="p-2 h-8 w-8"
								onClick={handleRefreshDashboard}
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
										</Button>
							{/* Save Button */}
										<Button
											variant="ghost"
											size="sm"
								className="p-2 h-8 w-8"
								onClick={handleSaveTemplate}
							>
								<SaveIcon className="h-4 w-4" />
							</Button>
							{/* Dashboard Template Dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
									<Button variant="outline" className="gap-2 bg-gray-100 hover:bg-gray-200 border-gray-300 h-10 px-4">
										{dashboards.find(d => d.id === currentDashboardId)?.name || 'Dashboard Template 1'}
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-64">
							<DropdownMenuLabel>Dashboards</DropdownMenuLabel>
							{dashboards.map(d => (
										<DropdownMenuItem key={d.id} onSelect={() => setCurrentDashboard(d.id)} className="flex items-center justify-between">
									<span className="truncate">{d.name}</span>
									<Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
										e.stopPropagation();
										setIsRenaming(d.id);
										setRenameValue(d.name);
									}}>
										<MoreHorizontal className="h-3 w-3"/>
									</Button>
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator/>
							<DropdownMenuItem onSelect={() => createDashboard('Untitled Dashboard')} className="gap-2">
								<Plus className="h-4 w-4"/>
								New Dashboard
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
							{/* More Options Button */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm" className="p-2 h-8 w-8">
										<MoreHorizontal className="h-4 w-4" />
					</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-80 p-3">
									<DropdownMenuLabel>Appearance Settings</DropdownMenuLabel>
									<DropdownMenuSeparator/>
									<DropdownMenuLabel>Background color</DropdownMenuLabel>
									<div className="grid grid-cols-8 gap-2 p-1">
										{colorOptions.map((c) => (
											<button key={c} className="h-6 w-6 rounded border" style={{backgroundColor: c}}
												onClick={() => { if (currentDashboardId) { useAppState.getState().setAppearanceForDashboard(currentDashboardId, { backgroundType: 'color', value: c }); } }}
												aria-label={`Set color ${c}`}
											/>
										))}
									</div>
									<DropdownMenuSeparator/>
									<DropdownMenuLabel>Preset backgrounds</DropdownMenuLabel>
									<div className="grid grid-cols-2 gap-2 p-1">
										{presetImageOptions.map((bg, idx) => (
											<button key={idx} className="h-14 rounded border" style={{background: bg}}
												onClick={() => { if (currentDashboardId) { useAppState.getState().setAppearanceForDashboard(currentDashboardId, { backgroundType: 'image', value: bg }); } }}
												aria-label={`Set preset ${idx + 1}`}
											/>
										))}
									</div>
									<DropdownMenuSeparator/>
									<DropdownMenuItem onSelect={(e) => { e.preventDefault(); fileInputRef.current?.click(); }} className="gap-2">
										<ImageIcon className="h-4 w-4"/> Upload image
										<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (ev) => { const file = ev.target.files?.[0]; if (!file || !currentDashboardId) return; try { const url = await uploadBackgroundImage(file, currentDashboardId); useAppState.getState().setAppearanceForDashboard(currentDashboardId, { backgroundType: 'image', value: url }); } catch (err) { console.error('Upload failed', err); } }}/>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}
				</div>

				{/* Action Buttons Row */}
				<div className="flex items-center">
					{/* Left Actions */}
					<div className="flex items-center gap-3">
						{!isCompaniesList && (
							<>
								{/* Upload Files Button */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="gap-2 bg-gray-100 hover:bg-gray-200 border-gray-300 h-10 px-4">
											<Upload className="h-4 w-4" />
											+ Upload Files
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-64">
										<DropdownMenuLabel>Upload Options</DropdownMenuLabel>
										<DropdownMenuSeparator/>
										<DropdownMenuItem onSelect={(e) => {
											e.preventDefault();
											csvFileInputRef.current?.click();
										}} className="gap-2">
											<Download className="h-4 w-4"/> Upload CSV Template
											<input 
												ref={csvFileInputRef} 
												type="file" 
												accept=".csv" 
												className="hidden"
												onChange={handleCSVUpload}
											/>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
								{/* Bulk Upload Prompts Button */}
								<Button
									onClick={() => {
										setIsBulkUploadDialogOpen(true);
										setBulkUploadTab('bulk');
									}}
									className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-10 px-4"
								>
									<Plus className="h-4 w-4" />
									Bulk Upload Prompts
								</Button>
								{/* Add Notes Tile Button */}
								<Button
									onClick={() => {
										setIsNotesTileDialogOpen(true);
									}}
									className="gap-2 bg-orange-600 hover:bg-orange-700 text-white h-10 px-4"
								>
									<Plus className="h-4 w-4" />
									Add Notes Tile
								</Button>
							</>
						)}
					</div>
				</div>
			</div>

			<Dialog open={!!isRenaming} onOpenChange={(open) => {
				if (!open) setIsRenaming(null);
			}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename dashboard</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="rename">Name</Label>
						<Input id="rename" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}/>
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="outline" onClick={() => setIsRenaming(null)}>Cancel</Button>
							<Button onClick={() => {
								if (isRenaming) {
									renameDashboard(isRenaming, renameValue || 'Untitled');
									setIsRenaming(null);
								}
							}}>Save</Button>
						</div>
						{isRenaming && (
							<div className="flex justify-between pt-2">
								<Button variant="ghost" className="gap-2" onClick={() => {
									cloneDashboard(isRenaming!, `${renameValue || 'Untitled'} Copy`);
									setIsRenaming(null);
								}}>
									<Copy className="h-4 w-4"/> Clone
								</Button>
								<Button variant="destructive" className="gap-2" onClick={() => {
									deleteDashboard(isRenaming!);
									setIsRenaming(null);
								}}>
									<Trash2 className="h-4 w-4"/> Delete
								</Button>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Company Addition Options Modal */}
			<CompanyAdditionOptions
				isOpen={isCompanyAdditionOptionsOpen}
				onClose={() => setIsCompanyAdditionOptionsOpen(false)}
				onSuccess={handleCompanyAdded}
			/>

			{/* Add Tile Dialog */}
			<AddTileDialog
				isOpen={isAddTileDialogOpen}
				onClose={() => setIsAddTileDialogOpen(false)}
				currentTileCount={tiles.length}
			/>

			{/* Bulk Upload Dialog */}
			<BulkUploadDialog
				isOpen={isBulkUploadDialogOpen}
				onClose={() => setIsBulkUploadDialogOpen(false)}
				currentTileCount={tiles.length}
				initialTab={bulkUploadTab}
			/>

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
							onKeyDown={handleKeyPress}
						/>
						</div>
						<div>
							<Label htmlFor="contactNote">Note</Label>
						<Input
								id="contactNote"
							value={newContactNote}
							onChange={(e) => setNewContactNote(e.target.value)}
								placeholder="Enter contact note"
							onKeyPress={handleKeyPress}
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

			{/* Delete Company Confirmation Dialog */}
			<Dialog open={isDeletingCompany} onOpenChange={setIsDeletingCompany}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Company</DialogTitle>
						</DialogHeader>
					<div className="space-y-4">
						<p className="text-gray-600">
							Are you sure you want to delete "{companies?.find(c => c.id === companyToDelete)?.name}"? This action cannot be undone and will also remove all associated tiles.
						</p>
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button variant="outline" onClick={() => setIsDeletingCompany(false)}>
									Cancel
								</Button>
						<Button variant="destructive" onClick={handleDeleteConfirm}>
									Delete
								</Button>
						</div>
					</DialogContent>
				</Dialog>

			{/* Delete Contact Confirmation Dialog */}
			<Dialog open={isDeletingContact} onOpenChange={setIsDeletingContact}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Contact</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-gray-600">
							Are you sure you want to delete this contact? This action cannot be undone.
						</p>
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button variant="outline" onClick={() => setIsDeletingContact(false)}>
								Cancel
							</Button>
						<Button variant="destructive" onClick={handleDeleteContact}>
								Delete
							</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Save Template Confirmation Dialog */}
			<Dialog open={isSavingTemplate} onOpenChange={setIsSavingTemplate}>
					<DialogContent>
						<DialogHeader>
						<DialogTitle>Save Template</DialogTitle>
						</DialogHeader>
					<div className="space-y-4">
						<p className="text-gray-600">
							Are you sure you want to save the current dashboard as a template?
						</p>
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button variant="outline" onClick={() => setIsSavingTemplate(false)}>
									Cancel
								</Button>
						<Button onClick={handleSaveTemplateConfirm}>
							Save Template
								</Button>
						</div>
					</DialogContent>
				</Dialog>

			{/* CSV Template Dialog */}
			<Dialog open={isCSVTemplateDialogOpen} onOpenChange={setIsCSVTemplateDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>CSV Template Preview</DialogTitle>
					</DialogHeader>
					<div className="space-y-6">
						{/* Dashboard Information */}
						<div>
							<h3 className="text-lg font-semibold mb-3">Dashboard Information</h3>
							<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
								{Object.entries(csvTemplateData?.dashboard || {}).map(([key, value]) => (
									<div key={key} className="flex flex-col">
										<span className="text-sm font-medium text-gray-600">{key}</span>
										<span className="text-sm text-gray-900">{value as string}</span>
									</div>
								))}
							</div>
						</div>

						{/* Tiles Information */}
						<div>
							<h3 className="text-lg font-semibold mb-3">Tiles ({csvTemplateData?.tiles?.length || 0})</h3>
							<div className="space-y-3">
								{csvTemplateData?.tiles?.map((tile, index) => (
									<div key={index} className="p-4 border border-gray-200 rounded-lg">
										<div className="grid grid-cols-2 gap-4 mb-3">
											<div>
												<span className="text-sm font-medium text-gray-600">Order:</span>
												<span className="ml-2 text-sm text-gray-900">{tile.order}</span>
											</div>
											<div>
												<span className="text-sm font-medium text-gray-600">Status:</span>
												<span className="ml-2 text-sm text-gray-900">{tile.status}</span>
											</div>
										</div>
										<div className="mb-3">
											<span className="text-sm font-medium text-gray-600">Title:</span>
											<span className="ml-2 text-sm text-gray-900">{tile.title}</span>
										</div>
										<div className="mb-3">
											<span className="text-sm font-medium text-gray-600">Base Prompt:</span>
											<span className="ml-2 text-sm text-gray-900 max-w-full break-words">
												{tile.base_prompt}
											</span>
										</div>
										<div>
											<span className="text-sm font-medium text-gray-600">Example Answer:</span>
											<span className="ml-2 text-sm text-gray-900 max-w-full break-words">
												{tile.ex_answer}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button variant="outline" onClick={() => setIsCSVTemplateDialogOpen(false)}>
							Close
						</Button>
						<Button onClick={() => {
							// TODO: Implement template import functionality
							toast({
								title: "Import Feature",
								description: "Template import functionality will be implemented soon.",
							});
							setIsCSVTemplateDialogOpen(false);
						}}>
							Import Template
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Notes Tile Dialog */}
			<NotesTileDialog
				isOpen={isNotesTileDialogOpen}
				onClose={() => setIsNotesTileDialogOpen(false)}
				currentTileCount={tiles.length}
			/>
		</>
	);
}