'use client';

import {useEffect, useState} from 'react';
import {Plus, ChevronUp, ChevronDown, Building2, Edit2, Trash2, Upload} from 'lucide-react';
import {Sidebar} from './Sidebar';
import {BoardArea} from './BoardArea';
import {TopBar} from './TopBar';
import {AddTileDialog} from './AddTileDialog';
import {BulkUploadDialog} from './BulkUploadDialog';
import {MobileTileDetailDialog} from './MobileTileDetailDialog';
import {TileCard} from './TileCard';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {useAppState} from '@/hooks/useAppState';
// import { getBoards, getTiles, initializeDatabase } from '@/lib/database';
import {getCompanies, createCompany, getTiles} from '@/service/api'
import {toast} from '@/hooks/use-toast';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Company, Tile} from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useWindowSize } from '@/hooks/useWindowSize';
import * as React from "react";
import {createBrotliDecompress} from "node:zlib";
import { CompaniesListDashboard } from './CompaniesListDashboard';

export function MainDashboard() {
	const {
		setBoards,
		setTiles,
		currentBoardId,
		tiles,
		selectedCompanyId,
		setSelectedCompany,
		currentDashboardId,
		appearanceByDashboard,
		companies,
		dashboards,
		setCompanies,
		reorderTilesInCurrentDashboard
	} = useAppState();
	const { onboardingData, logout } = useAuth()
	const { width: windowWidth, height: windowHeight } = useWindowSize();
	const [isAddTileDialogOpen, setIsAddTileDialogOpen] = useState(false);
	const [isMobileUI, setIsMobileUI] = useState(false);
	const [selectedMobileTile, setSelectedMobileTile] = useState<Tile | null>(null);
	const [isMobileDetailDialogOpen, setIsMobileDetailDialogOpen] = useState(false);
	const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
	const [isAddTileDialogOpenMobile, setIsAddTileDialogOpenMobile] = useState(false);
	const [isBulkUploadDialogOpenMobile, setIsBulkUploadDialogOpenMobile] = useState(false);
	const [companyFormData, setCompanyFormData] = useState({
		name: '',
		industry: '',
		product: '',
		icp: '',
		notes: '',
		url: ''
	});
	const [isAddingCompany, setIsAddingCompany] = useState(false);
	const [showDeleteCompanyConfirm, setShowDeleteCompanyConfirm] = useState<string | null>(null);
	const [showCompaniesList, setShowCompaniesList] = useState(false);

	useEffect(() => {
		async function loadData() {
			try {
				const tiles = await getTiles(currentDashboardId);
				setTiles(tiles);
				const tileIds = tiles.map(t => t.id);
				reorderTilesInCurrentDashboard(tileIds)
			} catch (error) {
				console.error('Failed to load data:', error);
			}
		}

		loadData();
	}, [currentDashboardId, setCompanies, setBoards, setTiles]);

	useEffect(() => {
		if (windowWidth < 1024) {
			setIsMobileUI(true);
		} else {
			setIsMobileUI(false);
		}
	}, [windowWidth]);

	useEffect(() => {
		const open = () => setShowCompaniesList(true);
		const close = () => setShowCompaniesList(false);
		window.addEventListener('show-companies-list', open as any);
		window.addEventListener('show-assistant-dashboard', close as any);
		return () => {
			window.removeEventListener('show-companies-list', open as any);
			window.removeEventListener('show-assistant-dashboard', close as any);
		};
	}, []);

	const handleCreateTile = () => {
		// if (!currentBoardId) return;
		setIsAddTileDialogOpen(true);
	};

	const handleBulkUpload = () => {
		setIsBulkUploadDialogOpenMobile(true);
	};

	const handleMobileTileClick = (tile: Tile) => {
		setSelectedMobileTile(tile);
		setIsMobileDetailDialogOpen(true);
	};

	const handleMobileDetailDialogClose = () => {
		setIsMobileDetailDialogOpen(false);
		setSelectedMobileTile(null);
	};

	const handleAddCompany = () => {
		setIsAddCompanyDialogOpen(true);
	};

	const handleAddCompanySubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!companyFormData.name.trim()) {
			toast({
				title: "Error",
				description: "Company name is required.",
				variant: "destructive",
			});
			return;
		}

		setIsAddingCompany(true);

		try {
			const newCompany = {
				user_id: 'user-1',
				name: companyFormData.name.trim(),
				industry: companyFormData.industry.trim(),
				product: companyFormData.product.trim(),
				icp: companyFormData.icp.trim(),
				notes: companyFormData.notes.trim(),
				url: companyFormData.url.trim(),
				uploaded_data_json: {}
			};

			await createCompany(newCompany);

			// Refresh companies list
			const updatedCompanies = await getCompanies();
			if (setCompanies) {
				setCompanies(updatedCompanies);
			}

			toast({
				title: "Succttess",
				description: "Company added successfully!",
			});

			// Reset form and close dialog
			setCompanyFormData({
				name: '',
				industry: '',
				product: '',
				icp: '',
				notes: '',
				url: ''
			});
			setIsAddCompanyDialogOpen(false);
		} catch (error) {
			console.error('Failed to create company:', error);
			toast({
				title: "Error",
				description: "Failed to add company. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsAddingCompany(false);
		}
	};

	const handleAddCompanyClose = () => {
		if (!isAddingCompany) {
			setCompanyFormData({
				name: '',
				industry: '',
				product: '',
				icp: '',
				notes: '',
				url: ''
			});
			setIsAddCompanyDialogOpen(false);
		}
	};

	const handleDeleteCompany = async (companyId: string) => {
		try {
			// Import the deleteCompany function from the API service
			const { deleteCompany } = await import('@/service/api');
			await deleteCompany(companyId);
			
			// Refresh companies list
			const updatedCompanies = await getCompanies();
			if (setCompanies) {
				setCompanies(updatedCompanies);
			}

			// If the deleted company was selected, clear the selection
			if (selectedCompanyId === companyId) {
				setSelectedCompany(null);
			}

			toast({
				title: "Success",
				description: "Company deleted successfully!",
			});

			setShowDeleteCompanyConfirm(null);
		} catch (error) {
			console.error('Failed to delete company:', error);
			toast({
				title: "Error",
				description: "Failed to delete company. Please try again.",
				variant: "destructive",
			});
		}
	};

	const selectedCompany = companies ? companies.find(c => c.id === selectedCompanyId) : null;
	
	// Get background styling for mobile
	const currentId = currentDashboardId || dashboards[0]?.id;
	const bg = appearanceByDashboard[currentId];
	const backgroundStyle: React.CSSProperties = bg
		? bg.backgroundType === 'color'
			? { backgroundColor: bg.value }
			: bg.backgroundType === 'image'
				? { backgroundImage: /^linear-gradient/.test(bg.value) ? bg.value as any : `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
				: bg.backgroundType === 'preset'
					? { background: bg.value, backgroundSize: 'cover', backgroundPosition: 'center' }
					: {}
		: {};
	
	return (
		<div className="main-dashboard">
			{/* Desktop Layout */}
			{!isMobileUI && (
				<div className="flex h-screen bg-gray-50 relative">
					{/* TopBar - Full Screen Width */}
					<div className="absolute top-0 left-0 right-0 z-10">
											<TopBar
						onboardingData={onboardingData}
						logout={logout}
							isCompaniesList={showCompaniesList}
						/>
					</div>
					
					{/* Main Content Area - Below TopBar */}
					<div className="flex-1 flex flex-col pt-20 w-full"> {/* pt-20 to move dashboard down more, w-full for full width */}
						{showCompaniesList ? <CompaniesListDashboard/> : <BoardArea/>}
					</div>
					<AddTileDialog
						isOpen={isAddTileDialogOpen}
						onClose={() => setIsAddTileDialogOpen(false)}
						currentTileCount={tiles.length}
					/>
				</div>
			)}

			{/* Mobile Layout */}
			{isMobileUI && (
				<div className="lg:hidden h-screen flex flex-col" style={backgroundStyle}>
					{/* Mobile Header with TopBar - Full Screen Width */}
					<div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
						<TopBar onboardingData={onboardingData} logout={logout} />
					</div>

					{/* Mobile Tiles Area (SMS-like) - Below TopBar */}
					<div className="overflow-auto p-4 space-x-3 flex flex-1 pt-20"> {/* pt-20 to move content down more */}
						{tiles.length === 0 ? (
							<div className="text-center py-12 px-4">
								<div
									className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
									<Plus className="w-10 h-10 text-blue-500"/>
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">No tiles yet</h3>
								<p className="text-gray-500 mb-6 max-w-sm mx-auto">
									Create your first tile to get started with AI-powered sales insights and strategies
								</p>
								<Button
									onClick={handleCreateTile}
									className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
								>
									<Plus className="w-4 h-4 mr-2"/>
									Create First Tile
								</Button>
							</div>
						) : (
							tiles.map((tile) => (
								<TileCard
									key={tile.id}
									tile={tile}
									isMobile={true}
									onMobileClick={handleMobileTileClick}
									setIsResizing={() => {}}
								/>
							))
						)}
					</div>

					{/* Mobile Bottom Company Bar */}
					<div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg mt-auto">
						<div className="p-2 bg-white/95 backdrop-blur-sm flex justify-center">
							<Button variant="outline" className="gap-2" onClick={handleBulkUpload}>
								<Plus className="h-4 w-4"/>
							</Button>
						</div>
					</div>

					{/* Add Tile Dialog */}
					<AddTileDialog
						isOpen={isAddTileDialogOpen}
						onClose={() => setIsAddTileDialogOpen(false)}
						currentTileCount={tiles.length}
					/>

					{/* Mobile Tile Detail Dialog */}
					<MobileTileDetailDialog
						tile={selectedMobileTile}
						isOpen={isMobileDetailDialogOpen}
						onClose={handleMobileDetailDialogClose}
					/>

					{/* Add Company Dialog */}
					<Dialog open={isAddCompanyDialogOpen} onOpenChange={handleAddCompanyClose}>
						<DialogContent className="max-w-md mx-4 p-0">
							<DialogHeader className="p-4 pb-0">
								<DialogTitle className="text-lg font-semibold">Add New Company</DialogTitle>
							</DialogHeader>

							<form onSubmit={handleAddCompanySubmit} className="p-4 space-y-4">
								<div className="space-y-2">
									<Label htmlFor="companyName" className="text-sm font-medium">
										Company Name *
									</Label>
									<Input
										id="companyName"
										value={companyFormData.name}
										onChange={(e) => setCompanyFormData(prev => ({...prev, name: e.target.value}))}
										placeholder="Enter company name"
										disabled={isAddingCompany}
										required
									/>
								</div>

								<div className="space-y-2">
								<Label htmlFor="url" className="text-sm font-medium">
									URL
								</Label>
								<Input
									id="url"
									value={companyFormData.url}
									onChange={(e) => setCompanyFormData(prev => ({ ...prev, url: e.target.value }))}
									placeholder="e.g., https://example.com"
									disabled={isAddingCompany}
								/>
								</div>

								<div className="flex gap-3 pt-2">
									<Button
										type="button"
										variant="outline"
										onClick={handleAddCompanyClose}
										disabled={isAddingCompany}
										className="flex-1"
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={isAddingCompany || !companyFormData.name.trim()}
										className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
									>
										{isAddingCompany ? 'Adding...' : 'Add Company'}
									</Button>
								</div>
							</form>
						</DialogContent>
					</Dialog>

					{/* Add Tile Dialog for Mobile */}
					<AddTileDialog
						isOpen={isAddTileDialogOpenMobile}
						onClose={() => setIsAddTileDialogOpenMobile(false)}
						currentTileCount={tiles.length}
					/>

					{/* Bulk Upload Dialog for Mobile */}
					<BulkUploadDialog
						isOpen={isBulkUploadDialogOpenMobile}
						onClose={() => setIsBulkUploadDialogOpenMobile(false)}
						currentTileCount={tiles.length}
					/>

					{/* Delete Company Confirmation Dialog */}
					<Dialog open={!!showDeleteCompanyConfirm} onOpenChange={() => setShowDeleteCompanyConfirm(null)}>
						<DialogContent className="max-w-sm">
							<DialogHeader>
								<DialogTitle>Delete Company</DialogTitle>
							</DialogHeader>
							<div className="py-4">
								<p className="text-gray-600">
									Are you sure you want to delete this company? This action cannot be undone and will also delete all associated tiles.
								</p>
							</div>
							<div className="flex gap-3 justify-end">
								<Button
									variant="outline"
									onClick={() => setShowDeleteCompanyConfirm(null)}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={() => showDeleteCompanyConfirm && handleDeleteCompany(showDeleteCompanyConfirm)}
								>
									Delete
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					<MobileTileDetailDialog
						tile={selectedMobileTile}
						isOpen={isMobileDetailDialogOpen}
						onClose={handleMobileDetailDialogClose}
					/>
				</div>
			)}
		</div>
	);
}
