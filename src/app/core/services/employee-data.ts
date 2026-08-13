import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroment/enviroment';
import { Employee, EmployeeRole, PageResponse } from '../models/hr';

@Injectable({ providedIn: 'root' })
export class EmployeeData {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}employee-service/employee`;
  private readonly rolesUrl = `${environment.apiUrl}employee-service/employee-role`;

  getById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/get/${id}`);
  }

  getRoles(page = 0, size = 100): Observable<PageResponse<EmployeeRole>> {
    return this.http.get<PageResponse<EmployeeRole>>(`${this.rolesUrl}/getall`, {
      params: { page, size }
    });
  }

  createRole(role: Pick<EmployeeRole, 'name' | 'description'>): Observable<EmployeeRole> {
    return this.http.post<EmployeeRole>(`${this.rolesUrl}/create`, role);
  }
}
