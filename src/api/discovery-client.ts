import { api } from './client';
export async function getDiscoveryCategories(){return api<any>('/v1/discovery/categories');}
export async function getDiscoveryPreferences(){return api<any>('/v1/discovery/preferences');}
export async function updateDiscoveryPreferences(input:any){return api<any>('/v1/discovery/preferences',{method:'PUT',body:JSON.stringify(input)});}
