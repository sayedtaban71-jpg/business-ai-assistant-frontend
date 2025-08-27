'use client';

import { create } from 'zustand';
import {AppState, Company, Tile, Board, Contact, Dashboard} from '@/types';
import { getCompanies, getBoards, getTiles } from '@/lib/database';
import {
	createCompany as createCompanyDB,
	deleteCompany as deleteCompanyDB,
	createTile as createTileDB,
	updateTile as updateTileDB,
	deleteTile as deleteTileDB,
	addDashboard as createDashboardDB, updateDashboard, deleteDashboard
} from '@/service/api';

interface AppStateStore extends AppState {
	// createCompany: (company: Partial<Company>) => Promise<void>;
	addCompany: (company: Company) => void;
	setCompanies: (companies: Company[]) => void;
	removeCompanyById: (id: string) => void;
	setSelectedCompany: (company: Company | null) => void;
	// deleteCompany: (companyId: string) => Promise<void>;

	createTile: (tileData: Partial<Tile>) => Promise<void>;
	setTiles: (tiles: Tile[]) => void;
	updateTile: (tileId: string, updates: Partial<Tile>) => Promise<void>;
	deleteTile: (tileId: string) => Promise<void>;

	setDashboards: (dashboards: Dashboard[]) => void;
	setCurrentBoard: (boardId: string | null) => void;

	setBoards: (boards: Board[]) => void;

	addContact: (contact: Contact) => void;
	setContacts: (contacts: Contact[]) => void;
	setSelectedContact: (contacts: Contact | null) => void;
	removeContactById: (id: string) => void;

	setSelectedTemplate: (template: Tile | null) => void;
	selectedTemplateId: string | null;
	selectedTemplate: Tile | null;

	incrementContextVersion: () => void;

	createDashboard: (name: string) => void;
	renameDashboard: (id: string, name: string) => void;
	deleteDashboard: (id: string) => void;
	cloneDashboard: (id: string, newName?: string) => Promise<string>;
	// dashboards: { id: string; name: string }[];
	currentDashboardId: string | null;
	setCurrentDashboard: (dashboardId: string | null) => void;


	appearanceByDashboard: Record<string, { backgroundType: 'color' | 'image' | 'preset'; value: string }>;
	setAppearanceForDashboard: (dashboardId: string, appearance: { backgroundType: 'color' | 'image' | 'preset'; value: string }) => void;
	// Dashboard -> tile mapping and ordering
	dashboardTileIds: Record<string, string[]>;
	addTileToCurrentDashboard: (tileId: string) => void;
	reorderTilesInCurrentDashboard: (tileIdsInOrder: string[]) => void;
	removeTileFromAllDashboards: (tileId: string) => void;
	// Tile sizes
	tileSizeById: Record<string, 's' | 'm' | 'l'>;
	setTileSizeForTileId: (tileId: string, size: 's' | 'm' | 'l') => void;
	// Tile positions
	tilePositionsById: Record<string, Record<string, { x: number; y: number; width: number; height: number }>>;
	setTilePositionForTileId: (tileId: string, position: { x: number; y: number; width: number; height: number }, userId: string) => void;
	// Company context data
	companyContextByCompanyId: Record<string, {
		notes: string;
		pastedText: string;
		attachments: {
			id: string;
			name: string;
			type: string;
			dataUrl: string
		}[] }>;
	saveCompanyContext: (
		companyId: string,
		context: Partial<{
			notes: string;
			pastedText: string;
			attachments:
				{
					id: string;
					name: string;
					type: string;
					dataUrl: string
				}[]
		}>) => void;
	// Template management
}

export const useAppState = create<AppStateStore>((set, get) => ({
	companies: [],
	contacts: [],
	tiles: [],
	boards: [],
	dashboards: [],

	selectedCompanyId: '',
	selectedCompany: null as Company | null,
	selectedContact: null as Contact | null,
	selectedContactId: '',
	currentBoardId: '',
	contextVersion: 1,

	//Company
	setSelectedCompany: (company) => {
		company && set({
			selectedCompanyId: company.id,
			selectedCompany: company
		});
		get().incrementContextVersion();
	},
	setCompanies: (companies) => set({ companies }),
	removeCompanyById: (id) =>
		set((state) => ({
			companies: state.companies.filter(company => company.id !== id),
		})),
	addCompany: (newCompany: Company) =>
		set((state) => ({
			companies: [...state.companies, newCompany], // append new company
		})),

	//Contact
	addContact: (newContact: Contact) =>
		set((state)=> ({
			contacts: [...state.contacts, newContact],
		})),
	setContacts: (contacts)=>set({contacts}),
	setSelectedContact: (contact:any) => {
		contact && set({
		selectedContact: contact,
		selectedContactId: contact.id,
		});
	},
	removeContactById: (id: string) =>set((state)=> ({
		contacts: state.contacts.filter(contact=>contact.id !== id),
	})),

	// Dashboards state persisted in localStorage
	currentDashboardId: (() => {
		if (typeof window === 'undefined') return 'default';
		try {
			const v = localStorage.getItem('currentDashboardId');
			return v || 'default';
		} catch {}
		return 'default';
	})(),
	appearanceByDashboard: (() => {
		if (typeof window === 'undefined') return {} as Record<string, { backgroundType: 'color' | 'image' | 'preset'; value: string }>;
		try {
			const raw = localStorage.getItem('appearanceByDashboard');
			if (raw) return JSON.parse(raw);
		} catch {}
		return {} as Record<string, { backgroundType: 'color' | 'image' | 'preset'; value: string }>;
	})(),
	dashboardTileIds: (() => {
		if (typeof window === 'undefined') return {} as Record<string, string[]>;
		try {
			const raw = localStorage.getItem('dashboardTileIds');
			if (raw) return JSON.parse(raw);
		} catch {}
		return {} as Record<string, string[]>;
	})(),

	tileSizeById: (() => {
		if (typeof window === 'undefined') return {} as Record<string, 's' | 'm' | 'l'>;
		try {
			const raw = localStorage.getItem('tileSizeById');
			if (raw) return JSON.parse(raw);
		} catch {}
		return {} as Record<string, 's' | 'm' | 'l'>;
	})(),
	tilePositionsById: (() => {
		if (typeof window === 'undefined') return {} as Record<string, Record<string, { x: number; y: number; width: number; height: number }>>;
		try {
			const raw = localStorage.getItem('tilePositionsById');
			if (raw) return JSON.parse(raw);
		} catch {}
		return {} as Record<string, Record<string, { x: number; y: number; width: number; height: number }>>;
	})(),
	companyContextByCompanyId: (() => {
		if (typeof window === 'undefined') return {} as Record<string, { notes: string; pastedText: string; attachments: { id: string; name: string; type: string; dataUrl: string }[] }>;
		try {
			const raw = localStorage.getItem('companyContextByCompanyId');
			if (raw) return JSON.parse(raw);
		} catch {}
		return {} as Record<string, { notes: string; pastedText: string; attachments: { id: string; name: string; type: string; dataUrl: string }[] }>;
	})(),
	selectedTemplateId: null,
	selectedTemplate: null,
	setSelectedTemplate: (template) => set({ selectedTemplateId: template?.id || null, selectedTemplate: template || null }),


	incrementContextVersion: () => {
		set((state) => ({ contextVersion: state.contextVersion + 1 }));
	},

	setTiles: (tiles) => set({ tiles }),
	updateTile: async (tileId, updates) => {
		try {
			// Update the database first
			let updatedTile;
			if( updates && updates.base_prompt){
				updatedTile = await updateTileDB(tileId, updates);
				console.log("Tile-DB-Update");
			}


			// If database update was successful, update local state
			// if (updatedTile) {
				set((state) => ({
					tiles: state.tiles.map((tile) =>
						tile.id === tileId ? { ...tile, ...updates } : tile
					),
				}));
			// }
		} catch (error) {
			console.error('Failed to update tile in database:', error);
			throw error;
		}
	},
	setBoards: (boards) => set({ boards }),
	setCurrentBoard: (boardId) => set({ currentBoardId: boardId }),

	setDashboards: (dashboards) => {
		set({ dashboards });
	},
	createDashboard: async (name) => {
		const new_dashboard = await createDashboardDB(name);
		set((state) => ({dashboards: [...state.dashboards, new_dashboard] }));
	},
	setCurrentDashboard: (dashboardId) => {
		set({ currentDashboardId: dashboardId });
		if (typeof window !== 'undefined' && dashboardId) {
			localStorage.setItem('currentDashboardId', dashboardId);
		}
	},
	renameDashboard: async (id, name) => {
		const dashboards = get().dashboards.map(d => d.id === id ? { ...d, name } : d);
		const new_dashboard = await updateDashboard(id, name);
		set((state) => ({dashboards: [...state.dashboards, new_dashboard] }));
		get().setDashboards(dashboards);
	},
	deleteDashboard: async (id) => {
		const dashboards = get().dashboards.filter(d => d.id !== id);
		await deleteDashboard(id)
		get().setDashboards(dashboards);
		if (get().currentDashboardId === id) {
			const fallback = dashboards[0]?.id || 'default';
			get().setCurrentDashboard(fallback);
		}
		// Remove appearance and tile mapping for this dashboard
		const appearance = { ...get().appearanceByDashboard };
		delete appearance[id];
		set({ appearanceByDashboard: appearance });
		const mapping = { ...get().dashboardTileIds };
		delete mapping[id];
		set({ dashboardTileIds: mapping });
		if (typeof window !== 'undefined') {
			localStorage.setItem('appearanceByDashboard', JSON.stringify(appearance));
			localStorage.setItem('dashboardTileIds', JSON.stringify(mapping));
		}
	},
	cloneDashboard: async (id, newName) => {
		const source = get().dashboards.find(d => d.id === id);
		const name = newName || (source ? `${source.name} Copy` : 'New Dashboard');
		await get().createDashboard(name);
		const newId = get().dashboards[get().dashboards.length - 1]?.id || 'default';
		
		// Clone appearance
		const appearance = { ...get().appearanceByDashboard };
		if (appearance[id]) {
			appearance[newId] = { ...appearance[id] };
			set({ appearanceByDashboard: appearance });
			if (typeof window !== 'undefined') {
				localStorage.setItem('appearanceByDashboard', JSON.stringify(appearance));
			}
		}
		// Clone tile mapping
		const mapping = { ...get().dashboardTileIds };
		if (mapping[id]) {
			mapping[newId] = [...mapping[id]];
			set({ dashboardTileIds: mapping });
			if (typeof window !== 'undefined') {
				localStorage.setItem('dashboardTileIds', JSON.stringify(mapping));
			}
		}
		return newId;
	},
	setAppearanceForDashboard: (dashboardId, appearance) => {
		const updated = { ...get().appearanceByDashboard, [dashboardId]: appearance };
		set({ appearanceByDashboard: updated });
		if (typeof window !== 'undefined') {
			localStorage.setItem('appearanceByDashboard', JSON.stringify(updated));
		}
	},
	addTileToCurrentDashboard: (tileId) => {
		const current = get().currentDashboardId || 'default';
		const mapping = { ...get().dashboardTileIds };
		const list = mapping[current] ? [...mapping[current]] : [];
		if (!list.includes(tileId)) list.push(tileId);
		mapping[current] = list;
		set({ dashboardTileIds: mapping });
		if (typeof window !== 'undefined') {
			localStorage.setItem('dashboardTileIds', JSON.stringify(mapping));
		}
	},
	reorderTilesInCurrentDashboard: (tileIdsInOrder) => {
		const current = get().currentDashboardId || 'default';
		const mapping = { ...get().dashboardTileIds, [current]: [...tileIdsInOrder] };
		set({ dashboardTileIds: mapping });
		if (typeof window !== 'undefined') {
			localStorage.setItem('dashboardTileIds', JSON.stringify(mapping));
		}
	},
	removeTileFromAllDashboards: (tileId) => {
		const mapping = { ...get().dashboardTileIds };
		Object.keys(mapping).forEach(key => {
			mapping[key] = mapping[key].filter(id => id !== tileId);
		});
		set({ dashboardTileIds: mapping });
		if (typeof window !== 'undefined') {
			localStorage.setItem('dashboardTileIds', JSON.stringify(mapping));
		}
	},

	setTileSizeForTileId: (tileId, size) => {
		const updated = { ...get().tileSizeById, [tileId]: size };
		set({ tileSizeById: updated });
		if (typeof window !== 'undefined') {
			localStorage.setItem('tileSizeById', JSON.stringify(updated));
		}
	},

	setTilePositionForTileId: (tileId, position, userId) => {
		const currentUserPositions = get().tilePositionsById[userId] || {};
		const updatedUserPositions = { ...currentUserPositions, [tileId]: position };
		const updated = { ...get().tilePositionsById, [userId]: updatedUserPositions };
		set({ tilePositionsById: updated });
		if (typeof window !== 'undefined') {
			localStorage.setItem('tilePositionsById', JSON.stringify(updated));
		}
	},

	saveCompanyContext: (companyId, context) => {
		const existing = get().companyContextByCompanyId[companyId] || { notes: '', pastedText: '', attachments: [] };
		const updatedEntry = {
			...existing,
			...context,
			attachments: context.attachments !== undefined ? context.attachments : existing.attachments
		};
		const updated = { ...get().companyContextByCompanyId, [companyId]: updatedEntry };
		set({ companyContextByCompanyId: updated });
		if (typeof window !== 'undefined') {
			localStorage.setItem('companyContextByCompanyId', JSON.stringify(updated));
		}
	},

	// createCompany: async (companyData) => {
	// 	try {
	// 		const newCompany = await createCompanyDB({
	// 			...companyData,
	// 			user_id: 'user-1' // Hardcoded for now
	// 		});
	// 		if (newCompany) {
	// 			set((state) => ({ companies: [...state.companies, newCompany] }));
	// 		}
	// 	} catch (error) {
	// 		console.error('Failed to create company:', error);
	// 		throw error;
	// 	}
	// },

	createTile: async (tileData) => {
		try {
			const newTile = await createTileDB(tileData);
			if (newTile) {
				set((state) => ({ tiles: [...state.tiles, newTile] }));
				get().addTileToCurrentDashboard(newTile.id);
			}
		} catch (error) {
			console.error('Failed to create tile:', error);
			throw error;
		}
	},

	deleteTile: async (tileId) => {
		try {
			// Delete from database first
			await deleteTileDB(tileId);

			// Remove from local state
			set((state) => ({
				tiles: state.tiles.filter((tile) => tile.id !== tileId)
			}));
			get().removeTileFromAllDashboards(tileId);
		} catch (error) {
			console.error('Failed to delete tile:', error);
			throw error;
		}
	},

	// deleteCompany: async (companyId) => {
	// 	try {
	// 		// Delete from database first
	// 		await deleteCompanyDB(companyId);
	//
	// 		// Remove from local state
	// 		set((state) => ({
	// 			companies: state.companies.filter((company) => company.id !== companyId),
	// 			// If the deleted company was selected, clear the selection
	// 			selectedCompanyId: state.selectedCompanyId === companyId ? '' : state.selectedCompanyId
	// 		}));
	// 	} catch (error) {
	// 		console.error('Failed to delete company:', error);
	// 		throw error;
	// 	}
	// },
}));