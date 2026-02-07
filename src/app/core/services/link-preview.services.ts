import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LinkPreview } from '../../features/share/Interfaces/Interfaces-Users';
import { LinkPreviewService } from './link-preview.service.ts';

@Injectable({
  providedIn: 'root'
})
export class LinkPreviewServices {
  private linkPreviewService = inject(LinkPreviewService);

  getMetaData(url: string): Observable<LinkPreview> {
    return this.linkPreviewService.getMetaData(url);
  }

}
