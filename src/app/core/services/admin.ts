import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroment/enviroment';
import { AdminDashboardStats, Company, CreateCompanyRequest, CreateHrRequest, CreateHrResponse, HrUser, PageResponse, UpdateCompanyRequest } from '../models/admin';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly employeesUrl = `${environment.apiUrl}employee-service/admin`;
  private readonly authUrl = `${environment.apiUrl}auth-service/auth/admin`;
  constructor(private readonly http: HttpClient) {}
  getDashboard(): Observable<AdminDashboardStats> { return this.http.get<AdminDashboardStats>(`${this.employeesUrl}/dashboard`); }
  getCompanies(page = 0, size = 12): Observable<PageResponse<Company>> { return this.http.get<PageResponse<Company>>(`${this.employeesUrl}/companies`, { params: new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc') }); }
  getCompany(id: number): Observable<Company> { return this.http.get<Company>(`${this.employeesUrl}/companies/${id}`); }
  createCompany(request: CreateCompanyRequest): Observable<Company> { return this.http.post<Company>(`${this.employeesUrl}/companies`, request); }
  updateCompany(id: number, request: UpdateCompanyRequest): Observable<Company> { return this.http.put<Company>(`${this.employeesUrl}/companies/${id}`, request); }
  setCompanyStatus(id: number, active: boolean): Observable<Company> { return this.http.patch<Company>(`${this.employeesUrl}/companies/${id}/status`, { active }); }
  getHrUsers(companyId: number, page = 0, size = 20): Observable<PageResponse<HrUser>> { return this.http.get<PageResponse<HrUser>>(`${this.employeesUrl}/companies/${companyId}/hr`, { params: { page, size } }); }
  createHr(companyId: number, request: CreateHrRequest): Observable<CreateHrResponse> { return this.http.post<CreateHrResponse>(`${this.authUrl}/companies/${companyId}/hr`, request); }
  setHrStatus(id: number, active: boolean): Observable<void> { return this.http.patch<void>(`${this.authUrl}/hr/${id}/status`, { active }); }
}
