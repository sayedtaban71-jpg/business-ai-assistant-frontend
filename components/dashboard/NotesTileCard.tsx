'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { Tile } from '@/types';
import { useAppState } from '@/hooks/useAppState';

interface NotesTileCardProps {
	tile: Tile;
	onUpdate?: (updatedTile: Partial<Tile>) => void;
	position?: { x: number; y: number; width: number; height: number };
	setIsResizing?: (isResizing: boolean) => void;
	onResize?: (newSize: { width: number; height: number }) => void;
}

export function NotesTileCard({ tile, onUpdate, position }: NotesTileCardProps) {
	// Safety check: only handle tiles that are actually notes tiles
	if (!tile.title.startsWith('#')) {
		console.warn('NotesTileCard received a tile that is not a notes tile:', tile.title);
		return null;
	}

	const [isEditing, setIsEditing] = useState(false);
	const [editedNotes, setEditedNotes] = useState(tile.base_prompt);
	const [editedTitle, setEditedTitle] = useState(tile.title.startsWith('#') ? tile.title.substring(1) : tile.title);
	const [isFlipped, setIsFlipped] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const titleInputRef = useRef<HTMLInputElement>(null);
	const { updateTile, deleteTile } = useAppState();

	// Use position for sizing if provided, otherwise use default
	const cardStyle = position ? {
		width: `${position.width}px`,
		height: `${position.height}px`
	} : {};

	useEffect(() => {
		if (isEditing && titleInputRef.current) {
			titleInputRef.current.focus();
			titleInputRef.current.setSelectionRange(editedTitle.length, editedTitle.length);
		}
	}, [isEditing, editedTitle.length]);

	// Update edited values when tile changes
	useEffect(() => {
		setEditedTitle(tile.title.startsWith('#') ? tile.title.substring(1) : tile.title);
		setEditedNotes(tile.base_prompt);
	}, [tile.title, tile.base_prompt]);

	const handleSave = async () => {
		const hasTitleChanged = editedTitle.trim() !== (tile.title.startsWith('#') ? tile.title.substring(1) : tile.title);
		const hasNotesChanged = editedNotes.trim() !== tile.base_prompt;
		
		if (hasTitleChanged || hasNotesChanged) {
			try {
				const updates: Partial<Tile> = {};
				
				if (hasTitleChanged) {
					updates.title = `#${editedTitle.trim()}`; // Preserve # prefix
				}
				
				if (hasNotesChanged) {
					updates.base_prompt = editedNotes.trim();
				}
				
				await updateTile(tile.id, updates);
				if (onUpdate) {
					onUpdate(updates);
				}
			} catch (error) {
				console.error('Error updating notes tile:', error);
			}
		}
		setIsEditing(false);
		// Return to front part after saving
		setIsFlipped(false);
	};

	const handleCancel = () => {
		setEditedTitle(tile.title.startsWith('#') ? tile.title.substring(1) : tile.title);
		setEditedNotes(tile.base_prompt);
		setIsEditing(false);
		// Return to front part after canceling
		setIsFlipped(false);
	};

	const handleDelete = async () => {
		try {
			await deleteTile(tile.id);
			// Return to front part after deleting (though tile will be removed)
			setIsFlipped(false);
		} catch (error) {
			console.error('Error deleting notes tile:', error);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && e.ctrlKey) {
			handleSave();
		} else if (e.key === 'Escape') {
			handleCancel();
		}
	};

	return (
		<div className="relative group perspective-1000" style={cardStyle}>
			<div 
				className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
					isFlipped ? 'rotate-y-180' : ''
				}`}
			>
				{/* Front Side - Display Notes */}
				<div className="absolute inset-0 w-full h-full backface-hidden">
					<div className="h-full cursor-pointer hover:shadow-lg transition-shadow overflow-hidden rounded-lg border border-orange-600 bg-white" onClick={() => setIsFlipped(true)}>
						{/* Dark Orange Header */}
						<div className="bg-orange-600 px-4 py-3">
							<h3 className="text-lg font-semibold text-white truncate">
								{tile.title.startsWith('#') ? tile.title.substring(1) : tile.title}
							</h3>
						</div>
						
						{/* White Content Area */}
						<div className="px-4 py-4">
							<div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
								{tile.base_prompt}
							</div>
						</div>
					</div>
				</div>

				{/* Back Side - Edit Notes */}
				<div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
					<div className="h-full rounded-lg border-2 border-orange-500 bg-white flex flex-col shadow-lg overflow-hidden">
						{/* Dark Orange Header - Fixed with Proper Rounded Corners */}
						<div className="bg-orange-600 px-4 py-3 flex items-center justify-between flex-shrink-0 rounded-t-lg">
							<h3 className="text-lg font-semibold text-white">
								Edit Notes
							</h3>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsFlipped(false)}
								className="h-8 w-8 p-0 text-white hover:bg-orange-700 rounded-full"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
						
						{/* Scrollable Content Area */}
						<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
							<div>
								<label className="text-sm font-medium text-gray-700 mb-2 block">
									Title
								</label>
								<input
									ref={titleInputRef}
									type="text"
									value={editedTitle}
									onChange={(e) => setEditedTitle(e.target.value)}
									placeholder="Enter tile title..."
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
								/>
							</div>
							
							<div>
								<label className="text-sm font-medium text-gray-700 mb-2 block">
									Notes
								</label>
								<Textarea
									ref={textareaRef}
									value={editedNotes}
									onChange={(e) => setEditedNotes(e.target.value)}
									placeholder="Enter your notes..."
									rows={10}
									className="resize-none border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
									onKeyDown={handleKeyDown}
								/>
								<p className="text-xs text-gray-500 mt-1">
									Press Ctrl+Enter to save, Esc to cancel
								</p>
							</div>
							
							{/* Bottom spacing for scroll */}
							<div className="pb-2"></div>
						</div>
						
						{/* Fixed Footer with Action Buttons */}
						<div className="px-4 py-3 border-t-2 border-orange-200 bg-orange-50 flex-shrink-0 rounded-b-lg">
							<div className="flex gap-3">
								<Button
									variant="outline"
									size="sm"
									onClick={handleCancel}
									className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
								>
									Cancel
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleDelete}
									className="px-4 border-red-300 text-red-700 hover:bg-red-50"
								>
									Delete
								</Button>
								<Button
									size="sm"
									onClick={handleSave}
									className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
								>
									<Save className="w-4 h-4 mr-1" />
									Save
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
