'use client';

import { LogOut, MoreHorizontal, LayoutGrid, Plus, Copy, Trash2, Brush, Building2, Save as SaveIcon , Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/hooks/useAppState';
import { UserCompany } from '@/lib/auth';
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
import Cookies from 'js-cookie'
import ApiHelper from "@/utils/apiHelper";

interface TopBarProps {
	onboardingData: UserCompany | null,
	logout: ()=> Promise<void>
}

export function TopBar({onboardingData, logout}: TopBarProps) {
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

	} = useAppState();
	const [isRenaming, setIsRenaming] = React.useState<string | null>(null);
	const [isAddTileDialogOpen, setIsAddTileDialogOpen] = useState(false);
	const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
	const [isDeletingCompany, setIsDeletingCompany] = useState<boolean>(false);
	const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
	const [renameValue, setRenameValue] = React.useState('');
	const [isCreatingNewCompany, setIsCreatingNewCompany] = useState(false);
	const [newCompanyName, setNewCompanyName] = useState('');
	const [newCompanyURL, setNewCompanyURL] = useState('');
	const [isCreatingNewContact, setIsCreatingNewContact] = useState(false);
	const [newContactName, setNewContactName] = useState('');
	const [newContactNote, setNewContactNote] = useState('');
	const [isSavingTemplete, setIsSavingTemplete] = useState(false);
	const [isDeletingContact, setIsDeletingContact] = useState(false);
	const [contactToDelete, setConactToDelete] = useState('');
	
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

	const handleBulkUpload = () => {
		setIsBulkUploadDialogOpen(true);
	};

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

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleCreateCompany();
		}
	};
	const handleCreateCompany = async () => {
		if (!newCompanyName.trim()) {
			return;
		}

		try {
			const data = {
				name: newCompanyName.trim(),
				url: newCompanyURL.trim()
			};
			const newCompany = await createCompanyDB(data);

			if (addCompany && newCompany) {
				addCompany(newCompany)
			}

			// Clear form
			setNewCompanyName('');
			setNewCompanyURL('');
			setIsCreatingNewCompany(false);
		} catch (error) {
			console.error('Failed to create company:', error);
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
	const handleAddCompnayDiaogOpen = ()=>{
		setIsCreatingNewCompany(true)
	}

	const handleSaveTemplete = () =>{
		setIsSavingTemplete(true);
	}
	const handleSaveTempleteConfirm = () =>{
		setIsSavingTemplete(false);
		toast({
			title: "Successed saving Templete!",
			description: "The Templete has been saved on your list.",
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
	return (
		<>
			<div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
				<div className="flex items-center gap-4">
					{/*<h2 className="text-lg font-semibold text-gray-900">{onboardingData && onboardingData.name}</h2>*/}
					<div className="">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="gap-2">
									<Building2 className="h-4 w-4"/>
									{/*<p className="hidden lg:flex">*/}
									{companies?.find(c => c.id === selectedCompanyId)?.name || 'Select the company'}
									{/*</p>*/}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-64">
								<DropdownMenuLabel>Companies</DropdownMenuLabel>
								{companies?.map(c => (
									<DropdownMenuItem key={c.id} onSelect={() => setSelectedCompany(c)}
													  className="flex items-center justify-between">
										<span className="truncate">{c.name}</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteCompany(c.id);
											}}
											className={`ml-2 p-1 h-8 w-8 ${
												selectedCompanyId === c.id
													? 'text-white/80 hover:text-white hover:bg-white/20'
													: 'text-gray-500 hover:text-red-600 hover:bg-red-50'
											}`}
										>
											<Trash2 className="w-4 h-4"/>
										</Button>
									</DropdownMenuItem>
								))}
								<DropdownMenuSeparator/>
								<DropdownMenuItem onSelect={handleAddCompnayDiaogOpen} className="gap-2">
									<Plus className="h-4 w-4"/>
									Add Company
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<div className="">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="gap-2">
									<Building2 className="h-4 w-4"/>
									{contacts?.find(c => c.id === selectedContactId)?.name || 'Select the contact'}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-64">
								<DropdownMenuLabel>Contacts</DropdownMenuLabel>
								{contacts?.map(c => (
									<DropdownMenuItem key={c.id} onSelect={() => setSelectedContact(c)}
													  className="flex items-center justify-between">
										<span className="truncate">{c.name}</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												openContactDeletDialog(c.id);
											}}
											className={`ml-2 p-1 h-8 w-8 ${
												selectedContactId === c.id
													? 'text-white/80 hover:text-white hover:bg-white/20'
													: 'text-gray-500 hover:text-red-600 hover:bg-red-50'
											}`}
										>
											<Trash2 className="w-4 h-4"/>
										</Button>
									</DropdownMenuItem>
								))}
								<DropdownMenuSeparator/>
								<DropdownMenuItem onSelect={handleOpenCreateContactDialog} className="gap-2">
									<Plus className="h-4 w-4"/>
									Add Contact
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="gap-2">
								<Brush className="h-4 w-4"/>
								<p className="hidden lg:flex">Appearance</p>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-80 p-3">
							<DropdownMenuLabel>Background color</DropdownMenuLabel>
							<div className="grid grid-cols-8 gap-2 p-1">
								{colorOptions.map((c) => (
									<button
										key={c}
										className="h-6 w-6 rounded border"
										style={{backgroundColor: c}}
										onClick={() => {
											if (currentDashboardId) {
												useAppState.getState().setAppearanceForDashboard(currentDashboardId, {
													backgroundType: 'color',
													value: c
												});
											}
										}}
										aria-label={`Set color ${c}`}
									/>
								))}
							</div>
							<DropdownMenuSeparator/>
							<DropdownMenuLabel>Preset backgrounds</DropdownMenuLabel>
							<div className="grid grid-cols-2 gap-2 p-1">
								{presetImageOptions.map((bg, idx) => (
									<button
										key={idx}
										className="h-14 rounded border"
										style={{background: bg}}
										onClick={() => {
											if (currentDashboardId) {
												useAppState.getState().setAppearanceForDashboard(currentDashboardId, {
													backgroundType: 'image',
													value: bg
												});
											}
										}}
										aria-label={`Set preset ${idx + 1}`}
									/>
								))}
							</div>
							<DropdownMenuSeparator/>
							<DropdownMenuItem onSelect={(e) => {
								e.preventDefault();
								fileInputRef.current?.click();
							}} className="gap-2">
								<ImageIcon className="h-4 w-4"/> Upload image
								<input ref={fileInputRef} type="file" accept="image/*" className="hidden"
									   onChange={async (ev) => {
										   const file = ev.target.files?.[0];
										   if (!file || !currentDashboardId) return;
										   try {
											   const url = await uploadBackgroundImage(file, currentDashboardId);
											   useAppState.getState().setAppearanceForDashboard(currentDashboardId, {
												   backgroundType: 'image',
												   value: url
											   });
										   } catch (err) {
											   console.error('Upload failed', err);
										   }
									   }}/>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="gap-2">
								<LayoutGrid className="h-4 w-4"/>
								<p className="hidden lg:flex">
									{dashboards.find(d => d.id === currentDashboardId)?.name || 'Default'}
								</p>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-64">
							<DropdownMenuLabel>Dashboards</DropdownMenuLabel>
							{/*<DropdownMenuItem  onSelect={() => setCurrentDashboard('default')}*/}
							{/*				  className="flex items-center justify-between">*/}
							{/*	<span className="truncate">{'Deafult'}</span>*/}
							{/*</DropdownMenuItem>*/}
							{dashboards.map(d => (
								<DropdownMenuItem key={d.id} onSelect={() => setCurrentDashboard(d.id)}
												  className="flex items-center justify-between">
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

					<Button variant="outline" className="gap-2" onClick={handleSaveTemplete}>
						<SaveIcon className="h-4 w-4"/>
						<p className="hidden lg:flex">Templete</p>
					</Button>
					<Button variant="outline" className="gap-2  hidden lg:flex" onClick={handleBulkUpload}>
						<Plus className="h-4 w-4"/>
					</Button>
				</div>

				<AddTileDialog
					isOpen={isAddTileDialogOpen}
					onClose={() => setIsAddTileDialogOpen(false)}
					currentTileCount={tiles.length}
				/>

				<BulkUploadDialog
					isOpen={isBulkUploadDialogOpen}
					onClose={() => setIsBulkUploadDialogOpen(false)}
					currentTileCount={tiles.length}
				/>
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
			{/* Create Company Dialog */}
			<Dialog open={isCreatingNewCompany} onOpenChange={(open) => {
				if (!open) setIsCreatingNewCompany(false);
			}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New Company</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							placeholder="Company Name"
							value={newCompanyName}
							onChange={(e) => setNewCompanyName(e.target.value)}
							onKeyPress={handleKeyPress}
						/>
						<Label htmlFor="url">Name</Label>
						<Input
							id="url"
							placeholder="URL"
							value={newCompanyURL}
							onChange={(e) => setNewCompanyURL(e.target.value)}
							onKeyPress={handleKeyPress}
						/>
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="outline" onClick={() => setIsCreatingNewCompany(false)}>Cancel</Button>
							<Button onClick={handleCreateCompany}>Save</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			<Dialog open={isCreatingNewContact} onOpenChange={(open) => {
				if (!open) setIsCreatingNewContact(false);
			}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New Contact</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							placeholder="Contact Name"
							value={newContactName}
							onChange={(e) => setNewContactName(e.target.value)}
							onKeyPress={handleKeyPress}
						/>
						<Label htmlFor="note">Note</Label>
						<Input
							id="note"
							placeholder="Note"
							value={newContactNote}
							onChange={(e) => setNewContactNote(e.target.value)}
							onKeyPress={handleKeyPress}
						/>
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="outline" onClick={() => setIsCreatingNewContact(false)}>Cancel</Button>
							<Button onClick={handleCreateContact}>Save</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			{/* Delete Company Confirmation Dialog */}
			{companyToDelete && (
				<Dialog open={isDeletingCompany} onOpenChange={(open) => {
					if (!open) setIsDeletingCompany(false);
				}}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Company</DialogTitle>
						</DialogHeader>
						<div className="space-y-2">
							<p className="text-gray-600 mb-6">
								Are you sure you want to delete
								&#34;{companies && companies.find(c => c.id === companyToDelete)?.name}&#34;? This action cannot be
								undone and will also remove all associated tiles.
							</p>
							<div className="flex justify-end gap-2 pt-2">
								<Button
									variant="outline"
									onClick={() => setIsDeletingCompany(false)}
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
					</DialogContent>
				</Dialog>
			)}
			<Dialog open={isDeletingContact} onOpenChange={(open) => {
				if (!open) setIsDeletingContact(false);
			}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Contact</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete
							&#34;{contacts && contacts.find(c => c.id === contactToDelete)?.name}&#34;?
						</p>
						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setIsDeletingContact(false)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleDeleteContact}
							>
								Delete
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			{isSavingTemplete && (
				<Dialog open={isSavingTemplete} onOpenChange={(open) => {
					if (!open) setIsSavingTemplete(false);
				}}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Save Templete</DialogTitle>
						</DialogHeader>
						<div className="space-y-2">
							<p className="text-gray-600 mb-6">
								Are you sure you want to save
								this?
							</p>
							<div className="flex justify-end gap-2 pt-2">
								<Button
									variant="outline"
									onClick={() => setIsSavingTemplete(false)}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={handleSaveTempleteConfirm}
								>
									save
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}

		</>
	);
}