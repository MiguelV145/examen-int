/**
 * Servicio API para disponibilidad de asesorías
 * 
 * Endpoints:
 * - GET /api/availability/me - Mis slots (para programador logueado)
 * - GET /api/availability/programmer/:id - Slots de un programador específico
 * - POST /api/availability - Crear slot
 * - PUT /api/availability/:id - Actualizar slot
 * - DELETE /api/availability/:id - Eliminar slot
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AvailabilitySlot, CreateAvailabilityDto, UpdateAvailabilityDto } from '../../models/availability.models';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/availability`;

  /**
   * Obtener mis slots de disponibilidad (usuario logueado = programador)
   */
  getMySlots(): Observable<AvailabilitySlot[]> {
    return this.http.get<AvailabilitySlot[]>(`${this.baseUrl}/me`);
  }

  /**
   * Obtener slots de disponibilidad de un programador específico
   */
  getSlotsByProgrammer(programmerId: number): Observable<AvailabilitySlot[]> {
    return this.http.get<AvailabilitySlot[]>(`${this.baseUrl}/programmer/${programmerId}`);
  }

  /**
   * Crear un nuevo slot de disponibilidad
   */
  createSlot(dto: CreateAvailabilityDto): Observable<AvailabilitySlot> {
    return this.http.post<AvailabilitySlot>(this.baseUrl, dto);
  }

  /**
   * Actualizar un slot de disponibilidad
   */
  updateSlot(id: number, dto: UpdateAvailabilityDto): Observable<AvailabilitySlot> {
    return this.http.put<AvailabilitySlot>(`${this.baseUrl}/${id}`, dto);
  }

  /**
   * Eliminar un slot de disponibilidad
   */
  deleteSlot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
