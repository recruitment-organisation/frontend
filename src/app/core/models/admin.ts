export interface Company { id: number; name: string; slug: string; email?: string; phone?: string; address?: string; website?: string; logoUrl?: string; description?: string; active: boolean; createdAt: string; updatedAt: string; hrCount: number; }
export type CreateCompanyRequest = Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'hrCount'>;
export type UpdateCompanyRequest = CreateCompanyRequest;
export interface HrUser { id: number; keycloakId: string; firstName: string; lastName: string; email: string; phone: string; companyId: number; companyName: string; active: boolean; }
export interface CreateHrRequest { firstName: string; lastName: string; email: string; phone: string; active: boolean; }
export interface CreateHrResponse { keycloakUserId: string; employeeId: number; email: string; temporaryPassword: string; companyId: number; }
export interface AdminDashboardStats { companies: number; activeCompanies: number; hrUsers: number; activeHrUsers: number; }
export interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number; }
