import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface CrafterContentModel {
  title: string;
  body: string;
}

const FALLBACK_CONTENT: CrafterContentModel = {
  title: 'CrafterCMS Headless Site',
  body: 'Content is currently unavailable.',
};

@Injectable({ providedIn: 'root' })
export class CrafterContentService {
  private readonly http = inject(HttpClient);

  getHomeContent(): Observable<CrafterContentModel> {
    return this.http.get<Partial<CrafterContentModel>>('/api/content').pipe(
      map((content) => ({
        title: content.title?.trim() || FALLBACK_CONTENT.title,
        body: content.body?.trim() || FALLBACK_CONTENT.body,
      })),
    );
  }
}
