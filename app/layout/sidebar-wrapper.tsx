'use client';

import { usePathname } from 'next/navigation';
import { SideBarLayout } from './side_bar';

export function SidebarWrapper() {
  const pathname = usePathname();
  
  // Don't show sidebar on login page
  if (pathname === '/login') {
    return null;
  }
  
  return <SideBarLayout />;
}
