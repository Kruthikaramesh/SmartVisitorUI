import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  VisitorRequest,
  CreateVisitorRequestDto,
  UpdateRequestStatusDto,
  GenerateQrCodeRequestDto
} from './../../shared/models/visitor-request.model';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class VisitorRequestService {

  private readonly API = `${environment.apiUrl}/api/visitorrequests`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any>(this.API);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API}/${id}`);
  }

  create(dto: CreateVisitorRequestDto): Observable<any> {
    return this.http.post<any>(this.API, dto);
  }

  updateStatus(id: number, dto: UpdateRequestStatusDto): Observable<any> {
    return this.http.put<any>(`${this.API}/${id}/status`, dto);
  }

  generateQR(id: number, dto: GenerateQrCodeRequestDto): Observable<any> {
    return this.http.post<any>(`${this.API}/${id}/qr/generate`, dto);
  }
}
