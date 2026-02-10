/**
 * Servicio API para asesorías
 * 
 * Endpoints:
 * - POST /api/asesorias - Reservar nueva asesoría (client)
 * - GET /api/asesorias/mis-asesorias - Mis asesorías (usuario logueado)
 * - GET /api/asesorias/recibidas - Asesorías recibidas por programador
 * - GET /api/asesorias/:id - Obtener detalle de asesoría
 * - PUT /api/asesorias/:id/status - Actualizar estado
 * - DELETE /api/asesorias/:id - Cancelar/Eliminar asesoría
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  Asesoria, 
  CreateAsesoriaDto, 
  UpdateAsesoriaStatusDto,
  AsesoriaResponse
} from '../../models/asesorias.models';

@Injectable({
  providedIn: 'root'
})
export class AsesoriasApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/asesorias`;

  /**
   * Reservar una nueva asesoría
   */
  createAsesoria(dto: CreateAsesoriaDto): Observable<AsesoriaResponse> {
    return this.http.post<AsesoriaResponse>(this.baseUrl, dto);
  }

  /**
   * Obtener mis asesorías (del usuario logueado - puede ser client o programmer)
   */
  getMisAsesorias(role?: string): Observable<AsesoriaResponse[]> {
    let params = new HttpParams();
    if (role) {
      params = params.set('role', role);
    }
    return this.http.get<AsesoriaResponse[]>(`${this.baseUrl}/mis-asesorias`, { params });
  }

  /**
   * Obtener asesorías como client (reservadas por mí)
   */
  getMisAsesoriasAsClient(): Observable<AsesoriaResponse[]> {
    return this.http.get<AsesoriaResponse[]>(`${this.baseUrl}/mis-asesorias?role=client`);
  }

  /**
   * Obtener asesorías recibidas como programador
   */
  getAsesoriasRecibidas(): Observable<AsesoriaResponse[]> {
    return this.http.get<AsesoriaResponse[]>(`${this.baseUrl}/recibidas`);
  }

  /**
   * Obtener detalle de una asesoría específica
   */
  getAsesoriaById(id: number): Observable<AsesoriaResponse> {
    return this.http.get<AsesoriaResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Actualizar estado de una asesoría
   */
  updateAsesoriaStatus(id: number, dto: UpdateAsesoriaStatusDto): Observable<AsesoriaResponse> {
    return this.http.put<AsesoriaResponse>(`${this.baseUrl}/${id}/status`, dto);
  }

  /**
   * Cancelar/Eliminar una asesoría
   */
  cancelAsesoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtener lista de programadores disponibles
   */
  getProgrammersAvailable(modality?: string): Observable<any[]> {
    let params = new HttpParams();
    if (modality) {
      params = params.set('modality', modality);
    }
    return this.http.get<any[]>(`${this.baseUrl}/programmers`, { params });
  }
}
