'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Plus, X, Check } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { toast } from '@/hooks/use-toast';

interface BulkUploadDialogProps {
	isOpen: boolean;
	onClose: () => void;
	currentTileCount: number;
}

interface PromptItem {
	id: string;
	title: string;
	prompt: string;
}

export function BulkUploadDialog({ isOpen, onClose, currentTileCount }: BulkUploadDialogProps) {
	const [activeTab, setActiveTab] = useState('individual');
	const [prompts, setPrompts] = useState<PromptItem[]>([]);
	const [bulkText, setBulkText] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newTitle, setNewTitle] = useState('');
	const [newPrompt, setNewPrompt] = useState('');

	const { createTile, currentDashboardId } = useAppState();

	const addPrompt = () => {
		if (!newTitle.trim() || !newPrompt.trim()) return;

		const newPromptItem: PromptItem = {
			id: Date.now().toString(),
			title: newTitle.trim(),
			prompt: newPrompt.trim(),
		};

		setPrompts([...prompts, newPromptItem]);
		setNewTitle('');
		setNewPrompt('');
	};

	const removePrompt = (id: string) => {
		setPrompts(prompts.filter(p => p.id !== id));
	};

	const parseBulkText = () => {
		if (!bulkText.trim()) return;

		const lines = bulkText.trim().split('\n');
		const newPrompts: PromptItem[] = [];
		
		// Check if we have numbered or bulleted questions
		const hasNumberedQuestions = lines.some(line => /^(\d+[.)]|\-|•|\*)\s/.test(line.trim()));

		if (hasNumberedQuestions) {
			// Handle numbered/bulleted questions
			lines.forEach((line, index) => {
				const trimmedLine = line.trim();
				if (!trimmedLine) return;

				if (/^(\d+[.)]|\-|•|\*)\s/.test(trimmedLine)) {
					// Extract the question content (remove the number/bullet)
					const questionContent = trimmedLine.replace(/^(\d+[.)]|\-|•|\*)\s/, '');
					if (questionContent.trim()) {
						newPrompts.push({
							id: Date.now().toString() + Math.random(),
							title: `Question ${index + 1}`,
							prompt: questionContent.trim(),
						});
					}
				}
			});
		} else {
			// Handle structured format (Title/Prompt) or simple lines
			const groups = bulkText.trim().split('\n\n');
			let promptCount = 0;
			
			groups.forEach((group, index) => {
				const groupLines = group.split('\n');
				let currentTitle = '';
				let currentPrompt = '';
				
				groupLines.forEach(line => {
					const trimmedLine = line.trim();
					if (trimmedLine.startsWith('Title:') || trimmedLine.startsWith('T:')) {
						currentTitle = trimmedLine.replace(/^(Title:|T:)\s*/, '');
					} else if (trimmedLine.startsWith('Prompt:') || trimmedLine.startsWith('P:')) {
						currentPrompt = trimmedLine.replace(/^(Prompt:|P:)\s*/, '');
					} else if (trimmedLine) {
						currentPrompt += (currentPrompt ? '\n' : '') + trimmedLine;
					}
				});
				
				if (currentPrompt.trim()) {
					newPrompts.push({
						id: Date.now().toString() + Math.random(),
						title: currentTitle || `Question ${promptCount + 1}`,
						prompt: currentPrompt.trim(),
					});
					promptCount++;
				}
			});
		}

		// If no structured format was found, treat each non-empty line as a separate prompt
		if (newPrompts.length === 0) {
			lines.forEach((line, index) => {
				const trimmedLine = line.trim();
				if (trimmedLine && !trimmedLine.startsWith('Title:') && !trimmedLine.startsWith('Prompt:') && !trimmedLine.startsWith('T:') && !trimmedLine.startsWith('P:')) {
					newPrompts.push({
						id: Date.now().toString() + Math.random(),
						title: `Question ${index + 1}`,
						prompt: trimmedLine,
					});
				}
			});
		}

		if (newPrompts.length > 0) {
			setPrompts([...prompts, ...newPrompts]);
			setBulkText('');
			toast({
				title: "Text parsed successfully",
				description: `Found ${newPrompts.length} prompt(s) to create.`,
			});
		} else {
			toast({
				title: "No prompts found",
				description: "Please check your text format and try again.",
				variant: "destructive",
			});
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (prompts.length === 0) {
			toast({
				title: "No prompts to create",
				description: "Please add at least one prompt before creating tiles.",
				variant: "destructive",
			});
			return;
		}
		if(!currentDashboardId)
			return;

		setIsSubmitting(true);

		try {
			let successCount = 0;
			let errorCount = 0;

			for (let i = 0; i < prompts.length; i++) {
				try {
					await createTile({
						title: prompts[i].title,
						base_prompt: prompts[i].prompt,
						order: currentTileCount + i,
						board_id: currentDashboardId
					});
					successCount++;
				} catch (error) {
					console.error(`Failed to create tile ${i + 1}:`, error);
					errorCount++;
				}
			}

			if (successCount > 0) {
				toast({
					title: "Tiles created successfully",
					description: `Created ${successCount} tiles${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`,
				});
			}

			if (errorCount === 0) {
				// Reset form and close dialog only if all tiles were created successfully
				setPrompts([]);
				setBulkText('');
				setNewTitle('');
				setNewPrompt('');
				onClose();
			}
		} catch (error) {
			console.error('Failed to create tiles:', error);
			toast({
				title: "Error creating tiles",
				description: "An error occurred while creating the tiles. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isSubmitting) {
			setPrompts([]);
			setBulkText('');
			setNewTitle('');
			setNewPrompt('');
			onClose();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Bulk Upload Prompts</DialogTitle>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="individual">Individual Prompts</TabsTrigger>
						<TabsTrigger value="bulk">Bulk Text</TabsTrigger>
					</TabsList>

					<TabsContent value="individual" className="space-y-4">
						<div className="space-y-4">
							<div className="flex gap-2">
								<div className="flex-1 space-y-2">
									<Label htmlFor="new-title">Title</Label>
									<Input
										id="new-title"
										value={newTitle}
										onChange={(e) => setNewTitle(e.target.value)}
										placeholder="Enter tile title..."
										disabled={isSubmitting}
									/>
								</div>
								<div className="flex-1 space-y-2">
									<Label htmlFor="new-prompt">Prompt</Label>
									<Textarea
										id="new-prompt"
										value={newPrompt}
										onChange={(e) => setNewPrompt(e.target.value)}
										placeholder="Enter your AI prompt..."
										rows={3}
										disabled={isSubmitting}
									/>
								</div>
								<div className="flex items-end">
									<Button
										type="button"
										onClick={addPrompt}
										disabled={!newTitle.trim() || !newPrompt.trim() || isSubmitting}
										size="sm"
									>
										<Plus className="w-4 h-4" />
									</Button>
								</div>
							</div>

							{prompts.length > 0 && (
								<div className="space-y-2">
									<Label>Prompts to Create ({prompts.length})</Label>
									<div className="space-y-2 max-h-60 overflow-y-auto">
										{prompts.map((prompt) => (
											<div key={prompt.id} className="flex items-start gap-2 p-3 border rounded-lg">
												<div className="flex-1">
													<div className="font-medium text-sm">{prompt.title}</div>
													<div className="text-sm text-gray-600 mt-1 line-clamp-2">{prompt.prompt}</div>
												</div>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => removePrompt(prompt.id)}
													disabled={isSubmitting}
												>
													<X className="w-4 h-4" />
												</Button>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</TabsContent>

					<TabsContent value="bulk" className="space-y-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="bulk-text">Bulk Text</Label>
								<Textarea
									id="bulk-text"
									value={bulkText}
									onChange={(e) => setBulkText(e.target.value)}
									placeholder={`Enter multiple prompts in any of these formats:

Format 1 - Numbered Questions:
1. What is the company's revenue model?
2. Who are their main competitors?
3. What is their target market?

Format 2 - Bullet Points:
- Question about revenue model
- Question about competitors
- Question about target market

Format 3 - Structured (Title/Prompt):
Title: Revenue Analysis
Prompt: Analyze the company's revenue streams and pricing strategy

Title: Revenue Analysis
Prompt: Analyze the company's revenue streams and pricing strategy
`}
									rows={8}
									disabled={isSubmitting}
								/>
							</div>

							<div className="flex gap-2">
								<Button
									type="button"
									onClick={parseBulkText}
									disabled={!bulkText.trim() || isSubmitting}
									variant="outline"
								>
									<FileText className="w-4 h-4 mr-2" />
									Parse Text
								</Button>
								<Button
									type="button"
									onClick={() => setBulkText('')}
									disabled={!bulkText.trim() || isSubmitting}
									variant="outline"
								>
									Clear
								</Button>
							</div>

							{prompts.length > 0 && (
								<div className="space-y-2">
									<Label>Parsed Prompts ({prompts.length})</Label>
									<div className="space-y-2 max-h-60 overflow-y-auto">
										{prompts.map((prompt) => (
											<div key={prompt.id} className="flex items-start gap-2 p-3 border rounded-lg">
												<div className="flex-1">
													<div className="font-medium text-sm">{prompt.title}</div>
													<div className="text-sm text-gray-600 mt-1 line-clamp-2">{prompt.prompt}</div>
												</div>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => removePrompt(prompt.id)}
													disabled={isSubmitting}
												>
													<X className="w-4 h-4" />
												</Button>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						onClick={handleSubmit}
						disabled={isSubmitting || prompts.length === 0}
					>
						{isSubmitting ? 'Creating...' : `Create ${prompts.length} Tile${prompts.length !== 1 ? 's' : ''}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
