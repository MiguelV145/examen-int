/**
 * Servicio API para reportes y descargas
 * 
 * Endpoints:
 * - GET /api/reports/asesorias-summary - Resumen de asesorías por estado
 * - GET /api/reports/asesorias-by-programmer - Asesorías por programador
 * - GET /api/reports/asesorias-by-date - Asesorías por fecha
 * - GET /api/reports/projects-by-user - Proyectos por usuario
 * - GET /api/reports/dashboard - Dashboard completo (admin)
 * - GET /api/reports/download/asesorias-pdf - Descargar PDF de asesorías
 * - GET /api/reports/download/asesorias-xlsx - Descargar XLSX de asesorías
 * - GET /api/reports/download/projects-pdf - Descargar PDF de proyectos
 * - GET /api/reports/download/projects-xlsx - Descargar XLSX de proyectos
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  AdminDashboardData,
  AsesoriasSummaryReport,
  AsesoriasByProgrammerReport,
  AsesoriasByDateReport,
  ProjectsByUserReport,
  ReportFilters
} from '../../models/reports.models';

@Injectable({
  providedIn: 'root'
})
export class ReportsApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/reports`;

  /**
   * Obtener resumen de asesorías por estado
   */
  getAsesoriasSummary(filters?: ReportFilters): Observable<AsesoriasSummaryReport[]> {
    let params = this.buildFilters(filters);
    return this.http.get<AsesoriasSummaryReport[]>(`${this.baseUrl}/asesorias-summary`, { params });
  }

  /**
   * Obtener asesorías agrupadas por programador
   */
  getAsesoriasByProgrammer(filters?: ReportFilters): Observable<AsesoriasByProgrammerReport[]> {
    let params = this.buildFilters(filters);
    return this.http.get<AsesoriasByProgrammerReport[]>(`${this.baseUrl}/asesorias-by-programmer`, { params });
  }

  /**
   * Obtener asesorías agrupadas por fecha
   */
  getAsesoriasByDate(filters?: ReportFilters): Observable<AsesoriasByDateReport[]> {
    let params = this.buildFilters(filters);
    return this.http.get<AsesoriasByDateReport[]>(`${this.baseUrl}/asesorias-by-date`, { params });
  }

  /**
   * Obtener proyectos agrupados por usuario
   */
  getProjectsByUser(filters?: ReportFilters): Observable<ProjectsByUserReport[]> {
    let params = this.buildFilters(filters);
    return this.http.get<ProjectsByUserReport[]>(`${this.baseUrl}/projects-by-user`, { params });
  }

  /**
   * Obtener dashboard completo (admin)
   */
  getAdminDashboard(filters?: ReportFilters): Observable<AdminDashboardData> {
    let params = this.buildFilters(filters);
    return this.http.get<AdminDashboardData>(`${this.baseUrl}/dashboard`, { params });
  }

  /**
   * Descargar asesorías como PDF
   */
  downloadAsesoriasPdf(filters?: ReportFilters): Observable<Blob> {
    let params = this.buildFilters(filters);
    return this.http.get(`${this.baseUrl}/download/asesorias-pdf`, { 
      params,
      responseType: 'blob' 
    });
  }

  /**
   * Descargar asesorías como XLSX
   */
  downloadAsesoriasXlsx(filters?: ReportFilters): Observable<Blob> {
    let params = this.buildFilters(filters);
    return this.http.get(`${this.baseUrl}/download/asesorias-xlsx`, { 
      params,
      responseType: 'blob' 
    });
  }

  /**
   * Descargar proyectos como PDF
   */
  downloadProjectsPdf(filters?: ReportFilters): Observable<Blob> {
    let params = this.buildFilters(filters);
    return this.http.get(`${this.baseUrl}/download/projects-pdf`, { 
      params,
      responseType: 'blob' 
    });
  }

  /**
   * Descargar proyectos como XLSX
   */
  downloadProjectsXlsx(filters?: ReportFilters): Observable<Blob> {
    let params = this.buildFilters(filters);
    return this.http.get(`${this.baseUrl}/download/projects-xlsx`, { 
      params,
      responseType: 'blob' 
    });
  }

  /**
   * Helper: Construir parámetros de filtro
   */
  private buildFilters(filters?: ReportFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) return params;

    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.programmerId) params = params.set('programmerId', filters.programmerId.toString());
    if (filters.status) params = params.set('status', filters.status);
    if (filters.userId) params = params.set('userId', filters.userId.toString());

    return params;
  }

  /**
   * Helper: Descargar blob como archivo
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
