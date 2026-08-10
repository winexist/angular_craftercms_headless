import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CrafterContentService } from './crafter-content';

describe('CrafterContentService', () => {
  let service: CrafterContentService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CrafterContentService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch home content from the API endpoint', () => {
    let result: { title: string; body: string } | undefined;

    service.getHomeContent().subscribe((content) => {
      result = content;
    });

    const req = httpTestingController.expectOne('/api/content');
    expect(req.request.method).toBe('GET');
    req.flush({ title: ' Welcome ', body: ' From CrafterCMS ' });

    expect(result).toEqual({ title: 'Welcome', body: 'From CrafterCMS' });
  });

  it('should provide fallback values for missing fields', () => {
    let result: { title: string; body: string } | undefined;

    service.getHomeContent().subscribe((content) => {
      result = content;
    });

    const req = httpTestingController.expectOne('/api/content');
    req.flush({});

    expect(result).toEqual({
      title: 'CrafterCMS Headless Site',
      body: 'Content is currently unavailable.',
    });
  });
});
