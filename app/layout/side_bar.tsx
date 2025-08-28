import { ReactNode, useState, useEffect, useRef } from "react";
import '@/app/globals.css';
import {useAuth} from "@/hooks/useAuth";
import { useAppState } from "@/hooks/useAppState";

export function SideBarLayout() {
	const {logout} = useAuth()
	const { 
		companies, 
		tiles,
		dashboards,
		setCurrentDashboard,
		selectedCompanyId,
		currentDashboardId,
		selectedCompany, 
		setSelectedCompany,
		selectedTemplateId,
		setSelectedTemplate,
		contacts,
		selectedContact
	} = useAppState();
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [showWideMenu, setShowWideMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const sidebarRef = useRef<HTMLDivElement>(null);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowUserMenu(false);
			}
		};

		if (showUserMenu) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showUserMenu]);

	// Collapse wide menu when clicking outside of the sidebar
	useEffect(() => {
		const handleOutsideSidebarClick = (event: MouseEvent) => {
			if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
				setShowWideMenu(false);
			}
		};

		if (showWideMenu) {
			document.addEventListener('mousedown', handleOutsideSidebarClick);
		}

		return () => {
			document.removeEventListener('mousedown', handleOutsideSidebarClick);
		};
	}, [showWideMenu]);

	return (
		<div ref={sidebarRef}
			 className={`fixed z-50 ${showWideMenu ? 'w-64 items-start' : 'w-16 items-center'} transition-all duration-300 shadow-gray-500 
			 drop-shadow-xl top-0 h-full bg-white border-l border-gray-200 flex flex-col py-6 hidden lg:flex`}>
			{/* Top Section */}
			<div className="flex flex-col w-full items-center">
				<div className="flex flex-col w-full items-center  space-y-2">
					{/* Blue Circle Icon */}
					<div className="flex space-x-2">
						<div className="w-8 h-8 bg-blue-500 rounded-full"></div>
						<p className={`text-lg font-bold animate-pulse ${showWideMenu ? 'block' : 'hidden'}`}>
							AI Business Assistant
						</p>
					</div>


					{/* Hamburger Menu Icon */}
					<div className="flex flex-col space-y-1 cursor-pointer" onClick={() => setShowWideMenu(prev => !prev)}
						 aria-label="Toggle menu" role="button" tabIndex={0}>
						<div className="w-5 h-0.5 bg-gray-600"></div>
						<div className="w-5 h-0.5 bg-gray-600"></div>
						<div className="w-5 h-0.5 bg-gray-600"></div>
					</div>
				</div>
			</div>
			<div className={`flex-1 flex-col overflow-auto w-full `}>
				<div className="flex-1">
					{/* Company List Section */}
					<div className={`flex flex-col w-full ${showWideMenu ? 'pl-10 items-start' : 'items-center'} space-y-4 mt-8`}>
						<div className="flex items-center space-x-2">
							<div className="w-6 h-6 cursor-pointer">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-600">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
										  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
								</svg>
							</div>
							<p className={`text-lg font-bold ${showWideMenu ? 'block' : 'hidden'}`}>
								Companies
							</p>
						</div>

						{/* Companies List */}
						{showWideMenu && (
							<div className="w-full px-2 space-y-2">
								{companies.map((company) => (
									<div
										key={company.id}
										onClick={() => setSelectedCompany(company)}
										className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
											selectedCompanyId === company.id
												? 'bg-blue-100 text-blue-700'
												: 'hover:bg-gray-100 text-gray-700'
										}`}
									>
										<div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
										<p className="text-sm font-medium truncate">{company.name}</p>
									</div>
								))}
								{companies.length === 0 && (
									<p className="text-xs text-gray-500 text-center px-2">No companies</p>
								)}
							</div>
						)}
					</div>

					{/* Template List Section */}
					<div className={`flex flex-col ${showWideMenu ? 'pl-10 items-start' : 'items-center'} space-y-4 mt-4`}>
						<div className="flex items-center space-x-2">
							<div className="w-6 h-6 cursor-pointer">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-600">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
										  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
								</svg>
							</div>
							<p className={`text-lg font-bold ${showWideMenu ? 'block' : 'hidden'}`}>
								Templates
							</p>
						</div>

						{/* Templates List */}
						{showWideMenu && (
							<div className="w-full px-2 space-y-2">
								{dashboards.map((dashboard) => (
									<div
										key={dashboard.id}
										onClick={() => setCurrentDashboard(dashboard.id)}
										className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
											currentDashboardId === dashboard.id
												? 'bg-green-100 text-green-700'
												: 'hover:bg-gray-100 text-gray-700'
										}`}
									>
										<div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
										<p className="text-sm font-medium truncate">{dashboard.name || 'Untitled Template'}</p>
									</div>
								))}
								{tiles.length === 0 && (
									<p className="text-xs text-gray-500 text-center px-2">No templates</p>
								)}
							</div>
						)}
					</div>
					{/* Contact List Section */}
					<div className={`flex flex-col ${showWideMenu ? 'pl-10 items-start' : 'items-center'} space-y-4 mt-8`}>
						<div className="flex items-center space-x-2">
							<div className="w-6 h-6 cursor-pointer">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-600">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
										  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
								</svg>
							</div>
							<p className={`text-lg font-bold ${showWideMenu ? 'block' : 'hidden'}`}>
								Contacts
							</p>
						</div>

						{/* Companies List */}
						{showWideMenu && (
							<div className="w-full px-2 space-y-2">
								{contacts.map((contact) => (
									<div
										key={contact.id}
										// onClick={() => setSelectedCompany(company)}
										className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
											selectedCompany.id === contact.id
												? 'bg-blue-100 text-blue-700'
												: 'hover:bg-gray-100 text-gray-700'
										}`}
									>
										<div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
										<p className="text-sm font-medium truncate">{contact.name}</p>
									</div>
								))}
								{contacts.length === 0 && (
									<p className="text-xs text-gray-500 text-center px-2">No Contacts</p>
								)}
							</div>
						)}
					</div>

					{/* Spacer to push bottom icons down */}
					<div className="flex-1"></div>
				</div>
			</div>
			<div className={`flex flex-col w-full items-start space-y-2 ${showWideMenu ? 'pl-10 items-start' : 'items-center'}`}>
				<div className="flex items-center space-x-2">
					<div className="w-6 h-6 cursor-pointer ">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-600">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
								  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
								  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
						</svg>
					</div>

					<p className={`text-lg font-bold ${showWideMenu ? 'block' : 'hidden'}`}>
						Settings
					</p>
				</div>

				{/* Person Icon with light blue background */}
				<div className="relative" ref={menuRef}>
					<div>
						<div className="flex items-center space-x-2 cursor-pointer"
							 onClick={() => setShowUserMenu(!showUserMenu)}>
							<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
									 className="w-5 h-5 text-gray-600">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
										  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
								</svg>
							</div>
							<p className={`text-lg font-bold ${showWideMenu ? 'block' : 'hidden'}`}>
								Profile
							</p>
						</div>

					</div>

					{/* User Menu Popup */}
					{showUserMenu && (
						<div
							className="absolute bottom-0 left-full mr-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
							<div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
								User Menu
							</div>
							<button
								onClick={logout}
								className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
							>
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
										  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
								</svg>
								<span>Logout</span>
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}