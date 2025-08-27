'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { TileCard } from './TileCard';
import { cn } from '@/lib/utils';
import Draggable from 'react-draggable';
import 'react-resizable/css/styles.css';
import { Tile } from '@/types';
import Cookies from "js-cookie";
import { useAuth } from '@/hooks/useAuth';

interface TileSize {
	id: string;
	width: number;
	height: number;
}

export function BoardArea() {
	const { tiles, currentDashboardId, dashboardTileIds, tileSizeById, tilePositionsById, appearanceByDashboard, setSelectedCompany, reorderTilesInCurrentDashboard, setTilePositionForTileId, companies, dashboards } = useAppState();
	const [tileSizes, setTileSizes] = useState<Record<string, TileSize>>({});
	const [dragOverTileId, setDragOverTileId] = useState<string | null>(null);
	const [draggedTileId, setDraggedTileId] = useState<string | null>(null);
	const boardRef = useRef<HTMLDivElement>(null);
	const [isResizing, setIsResizing] = useState<boolean>(false);
	const { user } = useAuth()

	const currentId = currentDashboardId || dashboards[0].id;
	const tileIds = dashboardTileIds[currentId] || tiles.map(t => t.id);
	const bg = appearanceByDashboard[currentId];
	const backgroundStyle: React.CSSProperties = bg
		? bg.backgroundType === 'color'
			? { backgroundColor: bg.value }
			: bg.backgroundType === 'image'
				? { backgroundImage: /^linear-gradient/.test(bg.value) ? bg.value as any : `url(${process.env.NEXT_PUBLIC_BASE_URL+bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
				: bg.backgroundType === 'preset'
					? { background: bg.value, backgroundSize: 'cover', backgroundPosition: 'center' }
					: {}
		: {};

	// Initialize tile sizes
	useEffect(() => {
		const sizes: Record<string, TileSize> = {};
		const userId = user?.id?.toString() || 'default';
		const userTilePositions = tilePositionsById[userId] || {};
		
		tileIds.forEach((id, index) => {
			const savedPosition = userTilePositions[id];
			const size = tileSizeById[id] || 'm';

			if (savedPosition) {
				// Use saved size
				sizes[id] = {
					id,
					width: savedPosition.width,
					height: savedPosition.height
				};
			} else {
				// Default grid layout
				const cols = size === 's' ? 1 : size === 'm' ? 1 : 2;
				const rows = size === 's' ? 1 : size === 'm' ? 1 : 2;

				sizes[id] = {
					id,
					width: (cols * 400 - 24)<300 ? 300 : (cols * 400 - 24), // Account for gap
					height: (rows * 300 - 24)<300 ? 300 : (cols * 300 - 24)
				};
			}
		});
		setTileSizes(prev => {
			// Only update if changed
			if (JSON.stringify(prev) === JSON.stringify(sizes)) return prev;
			return sizes;
		});

	}, [tileIds, tileSizeById, tilePositionsById, user]);

	useEffect(() => {
		try {
			// const last_selected_company_id = localStorage.getItem('User_selected_com');
			const last_selected_company_id = Cookies.get('user_selected_com');

			if (last_selected_company_id && companies.length > 0) {
				const company = companies.find(c => c.id === last_selected_company_id);
				if (company) {
					setSelectedCompany(company);
				} else {
					Cookies.remove("User_SelectedCompany");
				}
			} else if (last_selected_company_id && companies.length === 0) {
				console.log('Cookie exists but companies not loaded yet');
			} else {
				console.log('No cookie found or no companies loaded');
			}
		} catch (error) {
			console.error('Error reading cookie:', error);
		}
	}, [companies, setSelectedCompany]);
	const handleSizeChange = useCallback((tileId: string, size: { width: number; height: number }) => {
		setTileSizes(prev => ({
			...prev,
			[tileId]: { ...prev[tileId], ...size }
		}));

		// Save size to app state (without position)
		const userId = user?.id?.toString() || 'default';
		setTilePositionForTileId(tileId, { x: 0, y: 0, ...size }, userId);
	}, [setTilePositionForTileId, user]);

	const handleDragStart = useCallback((e: React.DragEvent, tileId: string) => {
		if (isResizing) return;
		setDraggedTileId(tileId);
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', tileId);
	}, [isResizing]);

	const handleDragOver = useCallback((e: React.DragEvent, tileId: string) => {
		if (isResizing || !draggedTileId || draggedTileId === tileId) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		setDragOverTileId(tileId);
	}, [isResizing, draggedTileId]);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		setDragOverTileId(null);
	}, []);

	const handleDrop = useCallback((e: React.DragEvent, targetTileId: string) => {
		if (isResizing || !draggedTileId || draggedTileId === targetTileId) return;
		e.preventDefault();
		
		// Reorder tiles
		const currentOrder = [...tileIds];
		const draggedIndex = currentOrder.indexOf(draggedTileId);
		const targetIndex = currentOrder.indexOf(targetTileId);
		
		// Remove dragged tile from current position
		const tmp = currentOrder[draggedIndex]
		currentOrder[draggedIndex] = currentOrder[targetIndex]
		currentOrder[targetIndex] = tmp;
		// 	currentOrder.splice(draggedIndex, 1);
		//
		// // Insert at target position
		// currentOrder.splice(targetIndex, 0, draggedTileId);
		
		// Update order in app state (this will save to localStorage)
		reorderTilesInCurrentDashboard(currentOrder);
		
		// Reset drag state
		setDraggedTileId(null);
		setDragOverTileId(null);
	}, [isResizing, draggedTileId, tileIds, reorderTilesInCurrentDashboard]);

	const handleDragEnd = useCallback(() => {
		setDraggedTileId(null);
		setDragOverTileId(null);
	}, []);
	return (
		<div
			ref={boardRef}
			className="flex-1 p-6 overflow-auto relative"
			style={backgroundStyle}
		>
			<div className="relative min-w-full h-full flex flex-wrap">
				{tileIds.map((id) => {
					const tile = tiles.find(t => t.id === id);
					if (!tile) return null;

					const size = tileSizes[id];
					if (!size) return null;

					const isDragOver = dragOverTileId === id;
					const isDragging = draggedTileId === id;

					return (
						<div
							key={id}
							draggable={!isResizing}
							onDragStart={(e) => handleDragStart(e, id)}
							onDragOver={(e) => handleDragOver(e, id)}
							onDragLeave={handleDragLeave}
							onDrop={(e) => handleDrop(e, id)}
							onDragEnd={handleDragEnd}
							className={cn(
								"mb-4 mr-2 transition-all duration-200",
								isDragOver && "ring-2 ring-blue-500 ring-opacity-50",
								isDragging && "opacity-50"
							)}
						>
							<TileCard
								tile={tile}
								position={{ x: 0, y: 0, width: size.width, height: size.height }}
								setIsResizing={setIsResizing}
								onResize={(newSize) => handleSizeChange(id, newSize)}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}