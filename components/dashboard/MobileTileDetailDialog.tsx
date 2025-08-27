'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Edit2, Check, X, Trash2, Send, Square } from 'lucide-react';
import { Tile } from '@/types';
import { useAppState } from '@/hooks/useAppState';
import { toast } from '@/hooks/use-toast';

interface MobileTileDetailDialogProps {
	tile: Tile | null;
	isOpen: boolean;
	onClose: () => void;
}

export function MobileTileDetailDialog({ tile, isOpen, onClose }: MobileTileDetailDialogProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState(tile?.title || '');
	const [editPrompt, setEditPrompt] = useState(tile?.base_prompt || '');
	const [refinementText, setRefinementText] = useState('');
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [streamingContent, setStreamingContent] = useState('');
	const [status, setStatus] = useState<string | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const { updateTile, deleteTile, selectedCompanyId, contextVersion } = useAppState();

	// Reset edit state when tile changes
	useEffect(() => {
		if (tile) {
			setEditTitle(tile.title);
			setEditPrompt(tile.base_prompt);
			setStatus("Ready");
			setStreamingContent('');
		}
	}, [tile]);

	// Auto-clear response when context changes
	useEffect(() => {
		if (tile && tile.last_run_context_version < contextVersion && tile.last_answer) {
			setStatus("Ready");
			setStreamingContent('');
		}
	}, [contextVersion, tile?.last_run_context_version, tile?.last_answer]);

	const handleSaveEdit = async () => {
		if (!tile) return;

		try {
			await updateTile(tile.id, {
				title: editTitle,
				base_prompt: editPrompt
			});
			setIsEditing(false);
			toast({
				title: "Tile updated",
				description: "Your tile has been updated successfully.",
			});
		} catch (error) {
			console.error('Failed to update tile:', error);
			toast({
				title: "Error",
				description: "Failed to update tile. Please try again.",
				variant: "destructive",
			});
		}
	};

	const handleDelete = () => {
		setShowDeleteConfirm(true);
	};

	const handleDeleteConfirm = async () => {
		if (!tile) return;

		try {
			await deleteTile(tile.id);
			setShowDeleteConfirm(false);
			onClose();
			toast({
				title: "Tile deleted",
				description: "Your tile has been deleted successfully.",
			});
		} catch (error) {
			console.error('Failed to delete tile:', error);
			toast({
				title: "Error",
				description: "Failed to delete tile. Please try again.",
				variant: "destructive",
			});
		}
	};

	const handleGenerate = useCallback(async () => {
		if (!tile || !selectedCompanyId) {
			return;
		}

		// Cancel any existing request
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		abortControllerRef.current = new AbortController();
		setStatus("Generating");
		setStreamingContent('');

		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ai/generator`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tileId: tile.id,
					basePrompt: tile.base_prompt,
					userRefinement: refinementText || undefined,
					companyId: selectedCompanyId,
					contextVersion
				}),
				cache: 'no-store',
				signal: abortControllerRef.current.signal
			});

			if (!response.ok) {
				let serverMessage = 'Failed to generate response';
				try {
					const err = await response.json();
					if (err?.error)
						serverMessage = err.error;
				} catch {
					throw new Error(serverMessage);
				}
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No response body');

			const decoder = new TextDecoder();
			let content = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				content += chunk;
				setStreamingContent(content);
			}

			setStatus("Completed");
			setRefinementText('');
		} catch (error: any) {
			if (error.name !== 'AbortError') {
				console.error('Generation error:', error);
				setStatus("Error");
			}
		} finally {
			abortControllerRef.current = null;
		}
	}, [tile?.id, tile?.base_prompt, selectedCompanyId, contextVersion, refinementText]);

	const handleAbort = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			setStreamingContent('');
			setStatus("Ready");
			}
	};

	const handleSendMessage = () => {
		if (refinementText.trim()) {
			handleGenerate();
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const needsUpdate = tile && tile.last_run_context_version < contextVersion;

	if (!tile) return null;

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-md w-[95vw] sm:w-full p-0 max-h-[90vh] flex flex-col">
					<DialogHeader className="p-4 pb-0 flex-shrink-0">
						<div className="flex items-center justify-between">
							<DialogTitle className="text-lg font-semibold">
								{isEditing ? 'Edit Tile' : tile.title}
							</DialogTitle>
						</div>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{/* Status Badges */}
						<div className="flex items-center justify-between">
							<div className="flex gap-2">
								<Badge>
									{status || tile.status}
								</Badge>
								{needsUpdate && (
									<Badge variant="outline" className="text-orange-600 border-orange-200">
										Update Available
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-2">
								{!isEditing && (
									<>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setIsEditing(true)}
											className="h-8 w-8 p-0"
										>
											<Edit2 className="w-4 h-4"/>
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleDelete}
											className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
										>
											<Trash2 className="w-4 h-4"/>
										</Button>
									</>
								)}
								{isEditing && (
									<>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleSaveEdit}
											className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
										>
											<Check className="w-4 h-4"/>
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setIsEditing(false)}
											className="h-8 w-8 p-0"
										>
											<X className="w-4 h-4"/>
										</Button>
									</>
								)}
							</div>
						</div>

						{/* Edit Mode */}
						{isEditing ? (
							<div className="space-y-3">
								<div>
									<label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
									<Input
										value={editTitle}
										onChange={(e) => setEditTitle(e.target.value)}
										placeholder="Enter tile title"
									/>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-700 mb-1 block">Prompt</label>
									<Textarea
										value={editPrompt}
										onChange={(e) => setEditPrompt(e.target.value)}
										placeholder="Enter base prompt"
										rows={4}
									/>
								</div>
							</div>
						) : (
							/* View Mode */
							<div className="space-y-4">
								{/* Base Prompt */}
								<div>
									<h4 className="text-sm font-medium text-gray-700 mb-2">Base Prompt</h4>
									<p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
										{tile.base_prompt}
									</p>
								</div>

								{/* AI Response */}
								{(streamingContent || tile.last_answer) && (
									<div>
										<h4 className="text-sm font-medium text-gray-700 mb-2">AI Response</h4>
										<div className="bg-blue-50 p-3 rounded-lg">
											<p className="text-sm text-gray-700 whitespace-pre-wrap">
												{streamingContent || tile.last_answer}
												{status === 'Generating' && (
													<span className="streaming-cursor"></span>
												)}
											</p>
										</div>
									</div>
								)}

								{/* Action Buttons */}
								{/* <div className="flex gap-2">
									{status === 'Generating' ? (
										<Button 
											onClick={handleAbort}
											variant="destructive" 
											size="sm" 
											className="flex-1 gap-2"
										>
											<Square className="w-4 h-4" />
											Stop
										</Button>
									) : (
										<Button 
											onClick={handleGenerate} 
											size="sm" 
											className="flex-1 gap-2"
											disabled={!selectedCompanyId}
										>
											<Send className="w-4 h-4" />
											{needsUpdate ? 'Update' : 'Generate'}
										</Button>
									)}
								</div> */}
							</div>
						)}
					</div>

					{/* Mobile Reply Input - Fixed at bottom */}
					{!isEditing && (
						<div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
							<div className="flex gap-2">
								<Textarea
									placeholder="Add refinement or follow-up..."
									value={refinementText}
									onChange={(e) => setRefinementText(e.target.value)}
									onKeyPress={handleKeyPress}
									rows={1}
									className="flex-1 text-sm resize-none"
									disabled={status === 'Generating'}
								/>
								<Button
									onClick={handleSendMessage}
									size="sm"
									className="px-3 align-self-center"
									disabled={!refinementText.trim() || status === 'Generating' || !selectedCompanyId}
								>
									<Send className="w-4 h-4" />
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			{showDeleteConfirm && (
				<Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
					<DialogContent className="max-w-sm">
						<DialogHeader>
							<DialogTitle>Delete Tile</DialogTitle>
						</DialogHeader>
						<div className="py-4">
							<p className="text-gray-600">
								Are you sure you want to delete "{tile.title}"? This action cannot be undone.
							</p>
						</div>
						<div className="flex gap-3 justify-end">
							<Button
								variant="outline"
								onClick={() => setShowDeleteConfirm(false)}
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
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
