import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LinkPreviewService {
  private http = inject(HttpClient);
  // Usamos la API gratuita de microlink.io
  private apiUrl = 'https://api.microlink.io';

  getMetaData(url: string): Observable<{ title?: string, description?: string, image?: string }> {
    if (!url) return of({});

    // Hacemos la petición a la API
    return this.http.get<any>(`${this.apiUrl}?url=${encodeURIComponent(url)}`).pipe(
      map(response => {
        if (response.status === 'success' && response.data) {
          return {
            title: response.data.title,
            description: response.data.description,
            // Aquí capturamos la imagen del SEO
            image: response.data.image?.url 
          };
        }
        return {};
      }),
      // Si falla la API, no rompemos la app, solo devolvemos vacío
      catchError(() => of({})) 
    );
  }
}