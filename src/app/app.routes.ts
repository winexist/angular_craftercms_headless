import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'about-us',
    loadComponent: () => import('./pages/about-us/about-us').then((m) => m.AboutUs),
  },
  {
    path: 'blogs',
    loadComponent: () => import('./pages/blogs/blogs').then((m) => m.Blogs),
  },
  {
    path: 'contact-us',
    loadComponent: () => import('./pages/contact-us/contact-us').then((m) => m.ContactUs),
  },
  {
    path: 'site-details',
    loadComponent: () => import('./pages/site-details/site-details').then((m) => m.SiteDetails),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
