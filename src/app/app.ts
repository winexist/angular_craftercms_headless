import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CrafterContentService } from './services/crafter-content';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly crafterContentService = inject(CrafterContentService);
  protected readonly content = toSignal(
    this.crafterContentService.getHomeContent().pipe(
      catchError(() =>
        of({
          title: 'CrafterCMS Headless Site',
          body: 'Content is currently unavailable.',
        }),
      ),
    ),
    {
      initialValue: {
        title: 'Loading content...',
        body: 'Please wait while content is loading.',
      },
    },
  );
}
