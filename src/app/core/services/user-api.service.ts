import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserDto, UpdateUserDto } from '../../shared/models/user.model';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly base = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) { }

  // Returns Ok(result) → full result wrapper
  getAll(): Observable<any> {
    return this.http.get<any>(this.base);
  }

  // Returns Ok(result.Data) → direct object
  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  // Returns Created(url, designation.Data) → direct object
  create(dto: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.base, dto);
  }

  // Returns Ok(new { message }) → { message: string }
  update(id: number, dto: UpdateUserDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${id}`, dto);
  }

  // DELETE /api/users/{id}?deletedBy={deletedBy}
  // Returns Ok(new { message }) → { message: string }
  delete(id: number, deletedBy: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}?deletedBy=${deletedBy}`);
  }
}
