import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// 👇 AQUÍ ESTÁ EL CAMBIO: Importamos las interfaces en lugar de escribirlas aquí
import { LinkPreview, MicrolinkResponse } from '../../features/share/Interfaces/Interfaces-Users';

@Injectable({
  providedIn: 'root'
})
export class LinkPreviewService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.microlink.io';

  getMetaData(url: string): Observable<LinkPreview> {
    if (!url) return of({});

    return this.http.get<MicrolinkResponse>(`${this.apiUrl}?url=${encodeURIComponent(url)}`).pipe(
      map(response => {
        if (response.status === 'success' && response.data) {
          return {
            title: response.data.title,
            description: response.data.description,
            image: response.data.image?.url 
          };
        }
        return {};
      }),
      catchError(() => of({})) 
    );
  }
}