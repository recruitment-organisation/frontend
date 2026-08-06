import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({ selector: 'app-public-footer', standalone: false, templateUrl: './public-footer.html', styleUrl: './public-footer.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class PublicFooterComponent { readonly year = new Date().getFullYear(); }
