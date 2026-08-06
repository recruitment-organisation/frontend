import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroment/enviroment';
import { Employee } from '../models/hr';

@Injectable({ providedIn: 'root' })
export class EmployeeData {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}employee-service/employee`;

  getById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/get/${id}`);
  }
}
