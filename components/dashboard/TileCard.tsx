'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Square, Edit2, Check, X, Trash2, RotateCcw, MessageSquare } from 'lucide-react';
import {Company, Tile} from '@/types';
import { useAppState } from '@/hooks/useAppState';
import { toast } from '@/hooks/use-toast';
// @ts-ignore
import {ResizableBox} from "react-resizable";
import 'react-resizable/css/styles.css';

interface TileCardProps {
	tile: Tile;
	position?: { x: number; y: number; width: number; height: number };
	onPositionChange?: (position: { x: number; y: number; width: number; height: number }) => void;
	onResize?: (size: { width: number; height: number }) => void;
	onDrag?: (position: { x: number; y: number }) => void;
	isMobile?: boolean;
	onMobileClick?: (tile: Tile) => void;
	setIsResizing: React.Dispatch<React.SetStateAction<boolean>>;
}

export function TileCard({ tile, position, onPositionChange, onResize, onDrag, isMobile = false, onMobileClick, setIsResizing }: TileCardProps) {
	const [refinementText, setRefinementText] = useState('');
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState(tile.title);
	const [editPrompt, setEditPrompt] = useState(tile.base_prompt);
	const [streamingContent, setStreamingContent] = useState('');
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isFlipped, setIsFlipped] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);
	const [status, setStatus] = useState<string | null>(null);
	const [content, setContent] = useState<string | null>(null)

	const {
		selectedCompanyId,
		selectedCompany,
		contextVersion,
		updateTile,
		deleteTile,
		currentDashboardId
	} = useAppState();

	// Auto-clear response when context changes
	useEffect(() => {
		if (tile.last_run_context_version < contextVersion && tile.last_answer) {
			// Clear the previous response when context changes
			// updateTile(tile.id, {
			// 	last_answer: '',
			// 	status: 'idle'
			// }).catch(error => {
			// 	console.error('Failed to clear tile response:', error);
			// });
			if(!selectedCompanyId){
				setStatus("Ready");
				setStreamingContent('');
			}

		}
	}, [contextVersion, tile.last_run_context_version, tile.last_answer, tile.id, updateTile]);

	useEffect(() => {
		handleGenerate();
	}, [selectedCompanyId]);

	useEffect(() => {
		// updateTile(tile.id, {
		// 	last_answer: '',
		// 	status: 'idle'
		// }).catch(error => {
		// 	console.error('Failed to clear tile response:', error);
		// });

		if(!selectedCompanyId){
			setStatus("Ready");
			setStreamingContent('');
		}
	}, []);

	const handleGenerate = useCallback(async () => {
		if (!selectedCompanyId) {
			return;
		}
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		abortControllerRef.current = new AbortController();

		setStatus("Generating");
		setStreamingContent('');
		console.log(tile.last_answer);
		try {
			const response = await fetch('/api/ai/respond', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tileId: tile.id,
					basePrompt: tile.base_prompt,
					exAnswer: tile.ex_answer,
					lastAnswer: tile.last_answer || undefined,
					userRefinement: refinementText || undefined,
					company: selectedCompany,
					contextVersion
				}),
				cache: 'no-store',
				signal: abortControllerRef.current.signal
			});
			// const response = await ApiHelper.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ai/generator`,data)
			if (!response.ok) {
				let serverMessage = 'Failed to generate response';
				try {
					const err = await response.json();
					if (err?.error) serverMessage = err.error;
				} catch {}
				throw new Error(serverMessage);
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


			await updateTile(tile.id, {
				status: 'completed',
				last_answer: content,
				last_run_context_version: contextVersion
			});


			// const data = await response.json();
			setStatus("Completed")
			if (localStorage.getItem("last_answer")) {
				let data_string: string | null = localStorage.getItem("last_answer");
				if (data_string) {
					let data = JSON.parse(data_string);
					data[tile.id] = content
					localStorage.setItem('last_answer', JSON.stringify(data));
				}
			} else {
				let ddd = {
					[tile.id] : content
				}
				localStorage.setItem("last_answer",JSON.stringify(ddd));
			}
			setRefinementText('');
		} catch (error: any) {
			if (error.name !== 'AbortError') {
				console.error('Generation error:', error);
				updateTile(tile.id, { status: 'error' }).catch(updateError => {
					console.error('Failed to update tile status to error:', updateError);
				});
			}
		} finally {
			// Clear the controller reference after completion/abort/error
			abortControllerRef.current = null;
		}
	}, [tile.id, tile.base_prompt, selectedCompanyId, contextVersion, refinementText, updateTile]);

	const handleAbort = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			updateTile(tile.id, { status: 'idle' }).catch(error => {
				console.error('Failed to update tile status to idle:', error);
			});
			setStreamingContent('');
		}
	};

	const handleSaveEdit = async () => {
		try {
			await updateTile(tile.id, {
				title: editTitle,
				base_prompt: editPrompt
			});
			setIsEditing(false);
		} catch (error) {
			console.error('Failed to save tile changes:', error);
			// You could add a toast notification here to inform the user
		}
	};

	const handleDelete = () => {
		setShowDeleteConfirm(true);
	};

	const handleDeleteConfirm = async () => {
		try {
			await deleteTile(tile.id);
			setShowDeleteConfirm(false);
			toast({
				title: `Tile "${tile.title}" deleted.`,
				description: 'Your tile has been deleted.',
			});
		} catch (error) {
			console.error('Failed to delete tile:', error);
			toast({
				title: 'Delete Failed',
				description: 'Failed to delete the tile. Please try again.',
				variant: 'destructive',
			});
		}
	};

	const currentContent = streamingContent ? streamingContent : tile.last_answer;
	const needsUpdate = tile.last_run_context_version < contextVersion;


	// Mobile tile card render
	if (isMobile) {
		return (
				<Card
					className="border-0 shadow-lg transition-all duration-200
					hover:shadow-xl active:scale-95 cursor-pointer h-max max-h-full flex"
					onClick={() => onMobileClick?.(tile)}
				>
					<div className="p-3 w-screen-75 flex flex-col">
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<h3 className="font-medium text-sm">{tile.title}</h3>
							</div>
						</div>
						<div className="ml-auto">
							<p className="text-sm mb-3 leading-relaxed bg-gray-300 px-3 rounded-md">{tile.base_prompt}</p>
						</div>

						{status === 'Generating' && (
							<div className="ml-auto mt-2 flex items-center gap-2">
								<div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
								<div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"
									 style={{animationDelay: '0.2s'}}></div>
								<div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"
									 style={{animationDelay: '0.4s'}}></div>
							</div>
						)}
						{streamingContent && (
							<div className="bg-white/10 rounded-lg p-3 border-l-2 border-white/20 flex-1 h-2/4 overflow-auto">
								<p className="text-xs leading-relaxed whitespace-break-spaces">
									{streamingContent}
								</p>
							</div>
						)}
					</div>
				</Card>
		);
	}

	// Desktop tile card render
	return (
		<>
			<ResizableBox
				width={position?.width || 300}
				height={position?.height < 300 ? 300 : position?.height}
				minConstraints={[300, 300]}
				onResizeStart={() => setIsResizing(true)}
				onResizeStop={() => setIsResizing(false)}
				onResize={(event, { size }) => {
					if (onResize) {
						onResize({ width: size.width, height: size.height });
					}
				}}
			>
				<div className="relative h-full w-full perspective-1000">
					<div
						className={`relative h-full w-full transition-transform duration-500 transform-style-preserve-3d ${
							isFlipped ? 'rotate-y-180' : ''
						}`}
					>
						{/* Front side - Q&A View */}
						<div className="absolute inset-0 backface-hidden">
							<Card
								className="h-full flex flex-col min-h-[300px] tile-card-content w-full shadow-lg hover:shadow-xl transition-shadow duration-200">
								<CardHeader className="pb-3 flex-shrink-0 tile-drag-handle cursor-move">
									<div className="w-full">
										<div className="flex justify-between">
											<h3 className="font-semibold text-gray-900">{tile.title}</h3>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setIsFlipped(true)}
												title="Open Chat"
											>
												<MessageSquare className="w-4 h-4"/>
											</Button>
										</div>

									</div>
									<div className="w-full flex">
										<p className="ml-auto text-sm bg-gray-200 text-gray-600 px-2 rounded-md mt-1 line-clamp-2">{tile.base_prompt}</p>
									</div>
									<div className="w-full flex">
										{status == "Generating" && (
											<div className="mt-2 flex items-center gap-2 ml-auto">
												<div
													className="w-2 h-2 bg-gray-500/60 rounded-full animate-pulse"></div>
												<div className="w-2 h-2 bg-gray-500/60 rounded-full animate-pulse"
													 style={{animationDelay: '0.2s'}}></div>
												<div className="w-2 h-2 bg-gray-500/60 rounded-full animate-pulse"
													 style={{animationDelay: '0.4s'}}></div>
											</div>
										)}
									</div>
									{/*<div className="flex gap-2 mt-2">*/}
									{/*	<Badge>*/}
									{/*		{status}*/}
									{/*	</Badge>*/}
									{/*</div>*/}
								</CardHeader>

								<CardContent className="flex-1 overflow-auto min-h-0">
									<div className="prose prose-sm max-w-none h-full">
										{streamingContent ? (
											<div className="space-y-4">
												{/*<div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">*/}
												{/*	<h4 className="font-medium text-blue-900 mb-2">Question:</h4>*/}
												{/*	<p className="text-sm text-blue-800">{tile.base_prompt}</p>*/}
												{/*</div>*/}
												<div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
													<h4 className="font-medium text-green-900 mb-2">Answer:</h4>
													<div
														className="whitespace-pre-wrap text-sm text-green-800 h-full overflow-auto">
														{streamingContent}
														{status === 'Generating' && (
															<span className="streaming-cursor"></span>
														)}
													</div>
												</div>
											</div>
										) : (
											<div className="">
												<p className="text-gray-500 text-sm italic text-center">
													No response generated yet.<br/>
													Open chat to generate a response.
												</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Back side - Chat Interface */}
						<div className="absolute inset-0 backface-hidden rotate-y-180">
							<Card
								className="h-full flex flex-col min-h-[300px] tile-card-content w-full shadow-lg hover:shadow-xl transition-shadow duration-200">
								<CardHeader className="pb-3 flex-shrink-0 tile-drag-handle cursor-move">
									{isEditing ? (
										<div className="space-y-2">
											<div className="flex gap-2">
												<Input
													value={editTitle}
													onChange={(e) => setEditTitle(e.target.value)}
													className="flex-1"
												/>
												<Button size="sm" onClick={handleSaveEdit}>
													<Check className="w-4 h-4"/>
												</Button>
												<Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
													<X className="w-4 h-4"/>
												</Button>
											</div>
											<Textarea
												value={editPrompt}
												onChange={(e) => setEditPrompt(e.target.value)}
												className="text-sm"
												rows={3}
											/>
										</div>
									) : (
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<h3 className="font-semibold text-gray-900">{tile.title}</h3>
												<p className="text-sm text-gray-600 mt-1 line-clamp-2 right-0">{tile.base_prompt}</p>
											</div>
											<div className="flex gap-1">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setIsEditing(true)}
												>
													<Edit2 className="w-4 h-4"/>
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setIsFlipped(false)}
													title="Back to Q&A"
												>
													<RotateCcw className="w-4 h-4"/>
												</Button>
												<Button variant="ghost" size="sm" onClick={handleDelete}>
													<Trash2 className="w-4 h-4"/>
												</Button>
											</div>
										</div>
									)}

									<div className="flex gap-2 mt-2">
										<Badge>
											{status}
										</Badge>
									</div>
								</CardHeader>

								<CardContent className="flex-1 overflow-auto min-h-0">
									<div className="prose prose-sm max-w-none h-full">
										{streamingContent ? (
											<div
												className="whitespace-pre-wrap text-sm text-gray-700 h-full overflow-auto">
												{streamingContent}
												{status === 'Generating' && (
													<span className="streaming-cursor"></span>
												)}
											</div>
										) : (
											<p className="text-gray-500 text-sm italic">
												Click generate to see AI response
											</p>
										)}
									</div>
								</CardContent>

								<CardFooter className="pt-3 flex-shrink-0">
									<div className="flex gap-2 w-full">
										<Textarea
											placeholder="Add refinement or follow-up..."
											value={refinementText}
											onChange={(e) => setRefinementText(e.target.value)}
											rows={1}
											className="flex-1 text-sm resize-none"
										/>
										<div className="flex gap-2">
											{tile.status === 'loading' ? (
												<Button onClick={handleAbort} variant="destructive" size="sm"
														className="gap-2 self-center">
													<Square className="w-4 h-4"/>
												</Button>
											) : (
												<Button
													onClick={handleGenerate}
													size="sm"
													className="px-3 align-self-center"
													disabled={!refinementText.trim() || status === 'Generating'}>
													<Send className="w-4 h-4"/>
												</Button>
											)}
										</div>
									</div>
								</CardFooter>
							</Card>
						</div>
					</div>
				</div>
			</ResizableBox>

			{/* Delete Confirmation Dialog */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm mx-4">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Delete Tile
						</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete &#34;{tile.title}&#34;? This action cannot be undone.
						</p>
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
					</div>
				</div>
			)}
		</>
	);
}