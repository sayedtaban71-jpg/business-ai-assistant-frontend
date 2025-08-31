import {Company, Tile, Contact, Dashboard} from "@/types";
import ApiHelper from "@/utils/apiHelper";
import axios from 'axios';
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


// console.log('API Base URL:', API_BASE_URL);
//Get Companies
export async function getCompanies(): Promise<Company[]> {
	return ApiHelper.get(`${API_BASE_URL}/company/`)
		.then((response: { data: any; status: any; }) => {
			console.log(response.status);
			const res = response.data;
			if (response.status === 200) {
				return res as Company[];
			} else {
				toast({
					title: "Error",
					description: "Server error.",
					variant: "destructive",
				});
				return [] as Company[]
			}
		});
}
// Add Company
export async function createCompany(data: Partial<Company>): Promise<Company | null> {
	try {
		return ApiHelper.post(`${API_BASE_URL}/company/`, data)
			.then((response: { status: any; data: any; }) => {
				if(response.status === 201) {
					toast({
						title: "Success",
						description: "Created successfully",
					})
				}
				return response.data;
			});
	}catch (error){
		console.error(error);
		throw new Error('Failed to create company');
	}
}
//Delete Company
export async function deleteCompany(id: string): Promise<Company | null> {
	try{
		return ApiHelper.delete(`${API_BASE_URL}/company/${id}`)
			.then((response: { status: any; data: any; }) => {
				if(response.status === 201) {
					toast({
						title: "Success",
						description: "Deleted successfully",
					})
				}else {
					toast({
						title: "Error",
						description: "Failed to delete company",
					})
				}
			})
	}catch (error){
		console.error(error);
		throw new Error('Failed to delete company');
	}
}
//Get Tiles
export async function getTiles(dash_id: string | null ): Promise<Tile[]> {
	try{
		return ApiHelper.get(`${API_BASE_URL}/tile/?id=${dash_id}`)
			.then((response: { data: any; status: any; }) => {
				if(response.status === 200) {
					return response.data;
				}else {
					toast({
						title: "Error",
						description: "Server error.",
					})
				}
			})
	}catch (error){
		console.error(error);
		throw new Error('Failed to get tiles');
	}
}
//Create Tile
export async function createTile(data: Partial<Tile>): Promise<Tile | null> {
	try{
		const response = await ApiHelper.post(`${API_BASE_URL}/tile/`, data);
		if(response.status === 201) {
			toast({
				title: "Success",
				description: "Created successfully",
			});
			return response.data;
		}
		return null;
	}catch (error){
		console.error(error);
		throw new Error('Failed to create tile');
	}
}
//Update Tile
export async function updateTile(id: string, data: Partial<Tile>): Promise<Tile | null> {
	try {
		if (Object.keys(data).length === 0) {
			return null;
		}
		const response = await ApiHelper.put(`${API_BASE_URL}/tile/${id}`, data);
		if(response.status == 200){
			// toast({
			// 	title: "Success",
			// 	description: "Updated successfully",
			// })
			return response.data;
		}else {
			toast({
				title: "Error",
				description: "Failed to update tile",
			});
		}
		return null;
	}catch (error){
		console.error(error);
		throw new Error('Failed to update tile');
	}
}
//Delete Tile
export async function deleteTile(id: string): Promise<boolean> {
	try{
		const response = await ApiHelper.delete(`${API_BASE_URL}/tile/${id}`);
		if(response.status === 201) {
			toast({
				title: "Success",
				description: "Deleted successfully",
			});
			return true;
		}else {
			toast({
				title: "Error",
				description: "Server Error!"
			});
		}
		return false;
	}catch (error){
		console.error(error);
		throw new Error('Failed to delete tile');
	}
}

// Upload background image, returns URL from backend
export async function uploadBackgroundImage(file: File, dashboard_id: string): Promise<string> {
    const uploadUrl = `${API_BASE_URL}/upload/background/`;
    const formData = new FormData();
    formData.append('file', file);
	formData.append('dashboard_id', dashboard_id)

    // Prepare auth header (reuse localStorage convention from ApiHelper)
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
    const token = authToken || userToken || '';
    const tokenType = authToken ? 'Bearer' : 'Token';

    const response = await ApiHelper.post(uploadUrl, formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	});

    if (response.status >= 200 && response.status < 300) {
        // Expect backend to return { url: string }
        const data = response.data;
        if (data && typeof data.url === 'string') {
            return data.url;
        }
        // Fallback: try common fields
        if (typeof data === 'string') return data;
        if (data?.location) return data.location;
        if (data?.path) return data.path;
        throw new Error('Upload succeeded but URL missing in response');
    }
    throw new Error('Failed to upload image');
}


export async function createContact(data: {name:string; note:string}): Promise<Contact>{
	try{
		return ApiHelper.post(`${API_BASE_URL}/contact/`,data)
			.then((response: { status: any; data: any; }) => {
				if(response.status === 201) {
					toast({
						title: "Success",
						description: "Created successfully"
					})
					return response.data;
				}
			})
	}catch (error){
		console.error(error);
		throw new Error(`Failed`)
	}
}
export async function getContact(): Promise<Contact[]>{
	try{
		return ApiHelper.get(`${API_BASE_URL}/contact/`)
			.then((response: { status: any; data: any; }) => {
				if(response.status === 200) {
					return response.data;
				}else{
					toast({
						title: "Error",
						description: "Server Error!"
					})
				}
			})
	}catch (error){
		console.error(error);
		throw new Error(`Failed`)
	}
}
export async function getDashboard(): Promise<Dashboard[]>{
	try{
		return ApiHelper.get(`${API_BASE_URL}/dashboard/`)
			.then((response: { status: any; data: any; }) => {
				if(response.status === 200) {
					return response.data;
				}else{
					toast({
						title: "Error",
						description: "Server Error!"
					})
				}
			})
	}catch (error){
		console.error(error);
		throw new Error(`Failed`)
	}
}

export async function addDashboard(name: string): Promise<Dashboard>{
	try{
		return ApiHelper.post(`${API_BASE_URL}/dashboard/`,{
			"name": name
		}).then((response: { status: any; data: any; }) => {
				if(response.status === 201) {
					toast({
						title: "Success",
						description: "Created successfully"
					})
					return response.data;
				}else{
					toast({
						title: "Error",
						description: "Server Error!"
					})
				}
			})
	}catch (error){
		console.error(error);
		throw new Error(`Failed`)
	}
}

export async function updateDashboard(id: string, name: string): Promise<Dashboard>{
	try{
		return ApiHelper.put(`${API_BASE_URL}/dashboard/${id}`,{
			"name": name
		}).then((response: { status: any; data: any; }) => {
			if(response.status === 200) {
				toast({
					title: "Success",
					description: "Updated successfully"
				})
				return response.data;
			}else{
				toast({
					title: "Error",
					description: "Server Error!"
				})
			}
		})
	}catch (error){
		console.error(error);
		throw new Error(`Failed`)
	}
}
export async function deleteDashboard(id: string): Promise<Dashboard>{
	try{
		return ApiHelper.delete(`${API_BASE_URL}/dashboard/${id}`)
			.then((response: { status: any; data: any; }) => {
			if(response.status === 200) {
				toast({
					title: "Success",
					description: "Deleted successfully"
				})
			}else{
				toast({
					title: "Error",
					description: "Server Error!"
				})
			}
		})
	}catch (error){
		console.error(error);
		throw new Error(`Failed`)
	}
}

export async function deleteContact(id: string): Promise<boolean> {
	try{
		return ApiHelper.delete(`${API_BASE_URL}/contact/${id}`)
			.then((response: { status: any; data: any; }) => {
				if(response.status === 200) {
					toast({
						title: "Success",
						description: "Deleted successfully",
					})
					return true
				}else {
					toast({
						title: "Error",
						description: "Server Error!"
					})
				}
			})
	}catch (error){
		console.error(error);
		throw new Error('Failed to delete tile');
	}
}
