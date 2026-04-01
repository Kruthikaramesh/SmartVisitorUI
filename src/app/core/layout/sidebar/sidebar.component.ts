import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface NavItem {
  label: string;
  icon: SafeHtml;
  route?: string;
  children?: NavItem[];
  roles?: string[]; // Array of roles that can see this menu item
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
  userRole: string | null = '';
  userFullName: string = ''; // User's full name from localStorage

  constructor(private sanitizer: DomSanitizer) {
    this.userRole = localStorage.getItem('role');
    this.userFullName = localStorage.getItem('fullName') || 'User';
  }

  private svg(path: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">${path}</svg>`
    );
  }

  private normalizeRole(role: string | null | undefined): string {
    const value = (role || '').trim().toLowerCase();
    if (value === 'employee' || value === 'user' || value === 'receptionist') return 'Employee';
    if (value === 'security' || value === 'security guard') return 'Security Guard';
    if (value === 'admin') return 'Admin';
    return role || '';
  }

  canViewMenuItem(roles?: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    const normalizedUserRole = this.normalizeRole(this.userRole);
    const normalizedRoles = roles.map(r => this.normalizeRole(r));
    return normalizedRoles.includes(normalizedUserRole);
  }

  ngOnInit() {
    this.navItems = [
      {
        label: 'Dashboards',
        icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h7v7H3V3zM14 3h7v5h-7V3zM14 12h7v9h-7v-9zM3 14h7v7H3v-7z"/>`),
        children: [
          {
            label: 'Admin Dashboard',
            route: '/dashboard/admin',
            icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>`),
            roles: ['Admin']
          },
          {
            label: 'User Dashboard',
            route: '/dashboard/user',
            icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 14a4 4 0 10-8 0M12 12a4 4 0 100-8 4 4 0 000 8zM20 20a4 4 0 00-3-3.87M4 20a4 4 0 013-3.87"/>`),
            roles: ['Employee']
          },
          {
            label: 'Security Dashboard',
            route: '/dashboard/security',
            icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>`),
            roles: ['Security Guard']
          }
        ]
      },
      {
        label: 'Management',
        icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>`),
        children: [
          {
            label: 'Users',
            route: '/users',
            icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 14a4 4 0 10-8 0M12 12a4 4 0 100-8 4 4 0 000 8zM20 20a4 4 0 00-3-3.87M4 20a4 4 0 013-3.87"/>`),
            roles: ['Admin']
          },
          {
            label: 'Designations',
            route: '/designations',
            icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2a7 7 0 017 7v4h3a1 1 0 011 1v5a1 1 0 01-1 1h-6v-4H8v4H2a1 1 0 01-1-1v-5a1 1 0 011-1h3V9a7 7 0 017-7z"/>`),
            roles: ['Admin']
          },
          {
            label: 'Visitors',
            route: '/visitors',
            icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z"/>`),
            roles: ['Admin', 'Employee']
          },
          {
            label: 'Visitor Requests',
            route: '/visitorsrequest',
            icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m7 8a9 9 0 11-18 0 9 9 0 0118 0z"/>`),
            roles: ['Admin', 'Employee']
          }
        ]
      },
      {
        label: 'Security',
        route: '/verification',
        icon: this.svg(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L4.5 11.75l1.5-1.5 3.75 3.75L18 5.75l1.5 1.5L9.75 17z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>`),
        roles: ['Security Guard']
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
