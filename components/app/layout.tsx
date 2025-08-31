import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SidebarWrapper } from './layout/sidebar-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Sales AI Assistant',
	description: 'AI-powered sales prompt management system',
};

export default function RootLayout({
									   children,
								   }: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
		</head>
		<body className={inter.className}>
		<AuthProvider>
			{/*<div className="w-full flex">*/}
				{/*<div className="flex w-16">*/}
					<SidebarWrapper/>
				{/*</div>*/}
				{/*<div className="flex-1">*/}
					{children}
				{/*</div>*/}
			{/*</div>*/}
			<Toaster />
		</AuthProvider>
		</body>
		</html>
	);
}