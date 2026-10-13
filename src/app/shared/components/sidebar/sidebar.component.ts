import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {

  expanded: Record<string, boolean> = {};
  private routeSub?: Subscription;

  constructor(
    public sharedservice: SharedService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.syncExpandedFromRoute();
    this.routeSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.syncExpandedFromRoute());
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  /** Track key for each sidebar group (category name) */
  groupKey(category: string): string {
    return category;
  }

  isExpanded(category: string): boolean {
    return !!this.expanded[category];
  }

  isRouteActive(url: string): boolean {
    const current = this.router.url.split('?')[0];
    if (url === '/dashboard') {
      return current === '/dashboard' || current === '' || current === '/';
    }
    return current === url || current.startsWith(`${url}/`);
  }

  isGroupActive(pages: any[]): boolean {
    return (pages || []).some(p => this.isRouteActive(p.url));
  }

  toggleGroup(category: string, pages: any[]): void {
    if (this.sharedservice.isSidebarCollapsed) {
      this.sharedservice.isSidebarCollapsed = false;
      this.expanded[category] = false;
    }
    const wasOpen = this.expanded[category];

    // Close all, then open only this one
    for (const key of Object.keys(this.expanded)) {
      this.expanded[key] = false;
    }

    if (!wasOpen) {
      this.expanded[category] = true;
      // If no child is active, navigate to first child
      if (!this.isGroupActive(pages) && pages?.length) {
        this.router.navigate([pages[0].url]);
      }
    }
  }

  logout(): void {
    this.sharedservice.logout();
  }

  private syncExpandedFromRoute(): void {
    if (!this.sharedservice.sidebarPages?.length) return;

    for (const group of this.sharedservice.sidebarPages) {
      if (group.pages?.length && this.isGroupActive(group.pages)) {
        // Close all first
        for (const key of Object.keys(this.expanded)) {
          this.expanded[key] = false;
        }
        this.expanded[group.category] = true;
        return;
      }
    }
  }
}
