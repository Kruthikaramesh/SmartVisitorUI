import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResult } from '../../shared/models/api-result.model';
import { Visitor, CreateVisitorDto, UpdateVisitorDto } from '../../shared/models/visitor.model';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class VisitorApiService {
  private readonly base = `${environment.apiUrl}/api/visitors`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<ApiResult<Visitor[]>> {
    return this.http.get<ApiResult<Visitor[]>>(this.base);
  }

  getById(id: number): Observable<ApiResult<Visitor>> {
    return this.http.get<ApiResult<Visitor>>(`${this.base}/${id}`);
  }

  create(dto: CreateVisitorDto): Observable<ApiResult<Visitor>> {
    return this.http.post<ApiResult<Visitor>>(this.base, dto);
  }

  update(id: number, dto: UpdateVisitorDto): Observable<ApiResult<Visitor>> {
    return this.http.put<ApiResult<Visitor>>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<ApiResult<string>> {
    return this.http.delete<ApiResult<string>>(`${this.base}/${id}`);
  }
}
