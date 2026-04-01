import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface NavItem {
  label: string;
  icon: SafeHtml;
  route?: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;

  expandedItems = new Set<string>();
  navItems: NavItem[] = [];

  constructor(private sanitizer: DomSanitizer) { }

  private svg(path: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">${path}</svg>`
    );
  }

  ngOnInit() {
    this.navItems = [
      {
        label: 'Dashboard',
        route: '/dashboard',
        icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h7v7H3V3zM14 3h7v5h-7V3zM14 12h7v9h-7v-9zM3 14h7v7H3v-7z"/>`)
      },
      {
        label: 'Users',
        route: '/users',
        icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 14a4 4 0 10-8 0M12 12a4 4 0 100-8 4 4 0 000 8zM20 20a4 4 0 00-3-3.87M4 20a4 4 0 013-3.87"/>`)
      },
      {
        label: 'Designations',
        route: '/designations',
        icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2a7 7 0 017 7v4h3a1 1 0 011 1v5a1 1 0 01-1 1h-6v-4H8v4H2a1 1 0 01-1-1v-5a1 1 0 011-1h3V9a7 7 0 017-7z"/>`)
      },
      {
        label: 'Visitors',
        route: '/visitors',
        icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z"/>`)
      },
      {
        label: 'Visitors Request',
        route: '/visitorsrequest',
        icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3h6a2 2 0 012 2v14a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>`)
      }
      
    ];
  }

  toggle(label: string) {
    this.expandedItems.has(label)
      ? this.expandedItems.delete(label)
      : this.expandedItems.add(label);
  }

  isExpanded(label: string) { return this.expandedItems.has(label); }
}
