import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * DTOs para Portafolios
 */
export interface Portfolio {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  demoUrl?: string;
  repositoryUrl?: string;
  technologies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioListResponse {
  content: Portfolio[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

@Injectable({
  providedIn: 'root',
})
export class PortfolioApiService {
  private http = inject(HttpClient);

  /**
   * Obtiene un portafolio por ID (público)
   * GET /api/portfolios/{id}
   */
  getPortfolioById(id: number): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${environment.apiUrl}/portfolios/${id}`);
  }

  /**
   * Obtiene una lista paginada de portafolios (público)
   * GET /api/portfolios?page=0&size=10
   */
  getPortfolios(page: number = 0, size: number = 10): Observable<PortfolioListResponse> {
    return this.http.get<PortfolioListResponse>(
      `${environment.apiUrl}/portfolios?page=${page}&size=${size}`
    );
  }

  /**
   * Crea un nuevo portafolio (requiere autenticación y rol PROGRAMADOR/ADMIN)
   * POST /api/portfolios
   */
  createPortfolio(portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>): Observable<Portfolio> {
    return this.http.post<Portfolio>(`${environment.apiUrl}/portfolios`, portfolio);
  }

  /**
   * Actualiza un portafolio (requiere ser el propietario o admin)
   * PUT /api/portfolios/{id}
   */
  updatePortfolio(id: number, portfolio: Partial<Portfolio>): Observable<Portfolio> {
    return this.http.put<Portfolio>(`${environment.apiUrl}/portfolios/${id}`, portfolio);
  }

  /**
   * Elimina un portafolio (requiere ser el propietario o admin)
   * DELETE /api/portfolios/{id}
   */
  deletePortfolio(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/portfolios/${id}`);
  }
}
