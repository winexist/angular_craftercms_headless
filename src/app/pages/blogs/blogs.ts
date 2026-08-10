import { Component } from '@angular/core';

type BlogPost = {
  title: string;
  summary: string;
  category: string;
  date: string;
};

@Component({
  selector: 'app-blogs',
  imports: [],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css',
})
export class Blogs {
  protected readonly posts: BlogPost[] = [
    {
      title: 'Designing for clarity in content-heavy websites',
      summary:
        'A practical framework for structuring content sections so readers can scan quickly.',
      category: 'UX Writing',
      date: 'Aug 02, 2026',
    },
    {
      title: 'Why SSR still matters for SEO-first experiences',
      summary:
        'A concise breakdown of rendering strategies and when SSR gives a meaningful advantage.',
      category: 'Engineering',
      date: 'Jul 21, 2026',
    },
    {
      title: 'From static pages to API-driven publishing',
      summary:
        'How to prepare route structure and components today for easy CMS integration tomorrow.',
      category: 'Architecture',
      date: 'Jul 08, 2026',
    },
  ];
}
