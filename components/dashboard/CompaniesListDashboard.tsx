'use client';

import { useMemo, useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus } from 'lucide-react';
import { CompanyAdditionOptions } from '@/components/dashboard/CompanyAdditionOptions';

export function CompaniesListDashboard() {
  const { companies, setSelectedCompany } = useAppState();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'name-asc' | 'name-desc'>('name-asc');
  const [isCompanyAdditionOptionsOpen, setIsCompanyAdditionOptionsOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = (companies || []).filter(c =>
      !query ? true : (c.name?.toLowerCase().includes(query.toLowerCase()) || c.url?.toLowerCase().includes(query.toLowerCase()))
    );
    return list.sort((a, b) => {
      const an = (a.name || '').toLowerCase();
      const bn = (b.name || '').toLowerCase();
      if (sort === 'name-asc') return an.localeCompare(bn);
      return bn.localeCompare(an);
    });
  }, [companies, query, sort]);

  const openAssistantFor = (companyId: string) => {
    const company = companies?.find(c => c.id === companyId) || null;
    if (company && setSelectedCompany) {
      setSelectedCompany(company);
    }
    window.dispatchEvent(new CustomEvent('show-assistant-dashboard'));
  };

  return (
    <div className="h-full overflow-auto">
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Companies</h2>
          <Button className="gap-2" onClick={() => setIsCompanyAdditionOptionsOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Search</span>
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search companies..." className="h-8 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <span>Sort</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 gap-1">
                  {sort === 'name-asc' ? 'Name A → Z' : 'Name Z → A'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                <DropdownMenuItem onSelect={() => setSort('name-asc')}>Name A → Z</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSort('name-desc')}>Name Z → A</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="pr-6">
          <div className="space-y-2">
            {filtered.map(c => (
              <div
                key={c.id}
                className="w-full max-w-sm p-2 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-800"
                onClick={() => openAssistantFor(c.id)}
              >
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <CompanyAdditionOptions
        isOpen={isCompanyAdditionOptionsOpen}
        onClose={() => setIsCompanyAdditionOptionsOpen(false)}
        onSuccess={() => setIsCompanyAdditionOptionsOpen(false)}
      />
    </div>
  );
}


