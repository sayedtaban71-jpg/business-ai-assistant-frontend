'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { createCompany } from '@/lib/database';
import * as z from "zod";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Company} from "@/types";
import {createCompany as createCompanyDB} from "@/service/api";
import {useAppState} from "@/hooks/useAppState";

const companySchema = z.object({
	companyName: z.string().min(2, 'Company name must be at least 2 characters'),
	companyUrl: z.string().url().optional().or(z.literal('')),
});

interface AddCompanyDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

type CompanyFormData = z.infer<typeof companySchema>;

export function AddCompanyDialog({ isOpen, onClose, onSuccess }: AddCompanyDialogProps) {
	const [companyName, setCompanyName] = useState('');
	const [companyUrl, setCompanyUrl] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const {addCompany} = useAppState();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<CompanyFormData>({
		resolver: zodResolver(companySchema),
	});

	const onSubmit = async (data: CompanyFormData) => {
		try {
			setIsSubmitting(true);

			// Here you would typically send the data to your API
			// console.log('Adding company to work with:', data);

			// Create company with required fields
			const companyData = {
				name: data.companyName,
				url: data.companyUrl || ''
			};

			const new_company = await createCompanyDB(companyData);
			if(new_company){
				addCompany(new_company);
			}
			// Reset form
			reset();

			// Close dialog and call onSuccess with the new company
			onClose();
			if (onSuccess) {
				onSuccess(new_company);
			}

		} catch (error) {
			console.error('Failed to add company:', error);
			alert('Failed to add company. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isLoading) {
			setCompanyName('');
			setCompanyUrl("");
			onClose();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-md mx-4 p-0">
				<DialogHeader className="p-4 pb-0">
					<DialogTitle className="text-lg font-semibold">Add New Company</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
					<div className="space-y-2">
						<Label htmlFor="companyName" className="text-sm font-medium">
							Company Name *
						</Label>
						<Input
							id="companyName"
							{...register('companyName')}
							placeholder="Enter company name"
							disabled={isLoading}
							required
						/>
						{errors.companyName && (
							<p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="url" className="text-sm font-medium">
							Industry
						</Label>
						<Input
							id="url"
							{...register('companyUrl')}
							placeholder="https://company.com"
							disabled={isLoading}
						/>
						{errors.companyUrl && (
							<p className="text-red-500 text-sm mt-1">{errors.companyUrl.message}</p>
						)}
					</div>

					{/*<div className="space-y-2">*/}
					{/*  <Label htmlFor="industry" className="text-sm font-medium">*/}
					{/*    Industry*/}
					{/*  </Label>*/}
					{/*  <Input*/}
					{/*    id="industry"*/}
					{/*    value={industry}*/}
					{/*    onChange={(e) => setIndustry(e.target.value)}*/}
					{/*    placeholder="e.g., Technology, Healthcare"*/}
					{/*    disabled={isLoading}*/}
					{/*  />*/}
					{/*</div>*/}

					{/*<div className="space-y-2">*/}
					{/*  <Label htmlFor="product" className="text-sm font-medium">*/}
					{/*    Product/Service*/}
					{/*  </Label>*/}
					{/*  <Input*/}
					{/*    id="product"*/}
					{/*    value={product}*/}
					{/*    onChange={(e) => setProduct(e.target.value)}*/}
					{/*    placeholder="What does the company sell?"*/}
					{/*    disabled={isLoading}*/}
					{/*  />*/}
					{/*</div>*/}

					{/*<div className="space-y-2">*/}
					{/*  <Label htmlFor="icp" className="text-sm font-medium">*/}
					{/*    Ideal Customer Profile*/}
					{/*  </Label>*/}
					{/*  <Input*/}
					{/*    id="icp"*/}
					{/*    value={icp}*/}
					{/*    onChange={(e) => setIcp(e.target.value)}*/}
					{/*    placeholder="Target customer description"*/}
					{/*    disabled={isLoading}*/}
					{/*  />*/}
					{/*</div>*/}

					{/*<div className="space-y-2">*/}
					{/*  <Label htmlFor="notes" className="text-sm font-medium">*/}
					{/*    Notes*/}
					{/*  </Label>*/}
					{/*  <Textarea*/}
					{/*    id="notes"*/}
					{/*    value={notes}*/}
					{/*    onChange={(e) => setNotes(e.target.value)}*/}
					{/*    placeholder="Additional notes about the company"*/}
					{/*    rows={3}*/}
					{/*    disabled={isLoading}*/}
					{/*  />*/}
					{/*</div>*/}

					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isLoading}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
						>
							{isLoading ? 'Adding...' : 'Add Company'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
