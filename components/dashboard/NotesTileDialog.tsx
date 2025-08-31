'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/hooks/useAppState';
import { Tile } from '@/types';

interface NotesTileDialogProps {
	isOpen: boolean;
	onClose: () => void;
	currentTileCount: number;
}

export function NotesTileDialog({ isOpen, onClose, currentTileCount }: NotesTileDialogProps) {
	const [title, setTitle] = useState('');
	const [notes, setNotes] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const { createTile, selectedCompanyId, currentDashboardId, dashboards, createDashboard } = useAppState();

	// Get a valid dashboard ID - use currentDashboardId if it's not 'default', otherwise use the first available dashboard
	const validDashboardId = currentDashboardId && currentDashboardId !== 'default' 
		? currentDashboardId 
		: dashboards.length > 0 ? dashboards[0].id : null;

	// Debug logging
	useEffect(() => {
		console.log('NotesTileDialog - Available dashboards:', dashboards);
		console.log('NotesTileDialog - Current dashboard ID:', currentDashboardId);
		console.log('NotesTileDialog - Valid dashboard ID:', validDashboardId);
	}, [dashboards, currentDashboardId, validDashboardId]);

	const handleCreate = async () => {
		if (!title.trim() || !notes.trim()) {
			return;
		}

		console.log('Available dashboards:', dashboards);
		console.log('Current dashboard ID:', currentDashboardId);
		console.log('Valid dashboard ID:', validDashboardId);

		let dashboardId = validDashboardId;

		// If no dashboard exists, create a default one
		if (!dashboardId) {
			try {
				console.log('No dashboard available, creating default dashboard...');
				await createDashboard('Default Dashboard');
				// Wait a moment for the state to update
				await new Promise(resolve => setTimeout(resolve, 100));
				// Get the updated dashboards
				const updatedDashboards = useAppState.getState().dashboards;
				dashboardId = updatedDashboards.length > 0 ? updatedDashboards[updatedDashboards.length - 1].id : null;
				console.log('Created dashboard with ID:', dashboardId);
			} catch (error) {
				console.error('Failed to create default dashboard:', error);
				return;
			}
		}

		if (!dashboardId) {
			console.error('No valid dashboard available');
			return;
		}

		setIsCreating(true);
		try {
			const newTile: Partial<Tile> = {
				title: `#${title.trim()}`, // Add # prefix to distinguish notes tiles
				base_prompt: notes.trim(),
				order: currentTileCount,
				board_id: dashboardId,
				company_id: selectedCompanyId ? parseInt(selectedCompanyId) : undefined
			};

			console.log('Creating notes tile for company:', selectedCompanyId, 'with data:', newTile);
			await createTile(newTile);
			
			// Reset form
			setTitle('');
			setNotes('');
			onClose();
		} catch (error) {
			console.error('Error creating notes tile:', error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && e.ctrlKey) {
			handleCreate();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Create Notes Tile</DialogTitle>
				</DialogHeader>
				
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter tile title..."
							onKeyDown={handleKeyPress}
						/>
						<p className="text-sm text-gray-500">
							This will be stored as a notes tile (with # prefix)
						</p>
					</div>
					
					<div className="grid gap-2">
						<Label htmlFor="notes">Notes</Label>
						<Textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Enter your notes..."
							rows={6}
							onKeyDown={handleKeyPress}
						/>
						<p className="text-sm text-gray-500">
							Press Ctrl+Enter to create tile
						</p>
					</div>
				</div>
				
				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button 
						onClick={handleCreate}
						disabled={!title.trim() || !notes.trim() || isCreating}
						className="bg-orange-600 hover:bg-orange-700"
					>
						{isCreating ? 'Creating...' : 'Create Notes Tile'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
