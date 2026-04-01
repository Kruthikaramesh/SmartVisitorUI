import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Designation, CreateDesignationDto, UpdateDesignationDto } from '../../shared/models/designation.model';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class DesignationApiService {
  private readonly base = `${environment.apiUrl}/api/designations`;

  constructor(private http: HttpClient) { }

  // Returns Ok(result) → full result wrapper
  getAll(): Observable<any> {
    return this.http.get<any>(this.base);
  }

  // Returns Ok(result.Data) → direct object
  getById(id: number): Observable<Designation> {
    return this.http.get<Designation>(`${this.base}/${id}`);
  }

  // Returns Created(url, designation.Data) → direct object
  create(dto: CreateDesignationDto): Observable<Designation> {
    return this.http.post<Designation>(this.base, dto);
  }

  // Returns Ok(new { message })
  update(id: number, dto: UpdateDesignationDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${id}`, dto);
  }

  // DELETE /api/designations/{id}?updatedBy={updatedBy}
  delete(id: number, updatedBy: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}?updatedBy=${updatedBy}`);
  }
}
