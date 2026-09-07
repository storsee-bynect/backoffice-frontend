import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../services/shared.service';

interface HeaderSearchItem {
  label: string;
  url: string;
  group: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  @ViewChild('searchInputDesktop') searchInputDesktop?: ElementRef<HTMLInputElement>;
  @ViewChild('searchInputMobile') searchInputMobile?: ElementRef<HTMLInputElement>;

  searchTxt = '';
  searchResults: HeaderSearchItem[] = [];
  isMobileSearchOpen = false;
  showSearchResults = false;
  isUserDropdownOpen = false;

  private readonly searchIndex: HeaderSearchItem[] = [
    { label: 'Dashboard',        url: '/dashboard',          group: 'Main' },
    { label: 'Stores',           url: '/stores',             group: 'Stores' },
    { label: 'Users',            url: '/users',              group: 'Admin' },
    { label: 'Roles',            url: '/roles',              group: 'Admin' },
    { label: 'Packages',         url: '/packages',           group: 'Monetisation' },
    { label: 'Transactions',     url: '/transactions',       group: 'Monetisation' },
    { label: 'Templates',        url: '/templates',          group: 'Content' },
    { label: 'Theme Category',   url: '/theme-category',     group: 'Content' },
    { label: 'Pages',            url: '/pages',              group: 'Content' },
    { label: 'Page Categories',  url: '/page-categories',    group: 'Content' },
    { label: 'Tickets',          url: '/tickets',            group: 'Support' },
    { label: 'Contact Leads',    url: '/contact-leads',      group: 'Leads' },
    { label: 'Leads',            url: '/leads',              group: 'Leads' },
    { label: 'Lead Dashboard',   url: '/lead-dashboard',     group: 'Leads' },
    { label: 'Coupons',          url: '/coupons',            group: 'Marketing' },
    { label: 'Policies',         url: '/policies',           group: 'Settings' },
    { label: 'Payment Setting',  url: '/payment-setting',    group: 'Settings' },
    { label: 'Notification Settings', url: '/notification-settings', group: 'Settings' },
    { label: 'Web Push Campaigns', url: '/push-notifications', group: 'Marketing' },
    { label: 'App Push Campaigns', url: '/app-notifications', group: 'Marketing' },
    { label: 'Store Users',      url: '/store-users',        group: 'Tools' },
  ];

  constructor(
    public sharedservice: SharedService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.sharedservice.deviceWidth = window.innerWidth;
    this.sharedservice.deviceHeight = window.innerHeight;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.sharedservice.deviceWidth = window.innerWidth;
    this.sharedservice.deviceHeight = window.innerHeight;
    if (this.sharedservice.deviceWidth >= 992) {
      this.isMobileSearchOpen = false;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusSearch();
    }
    if (event.key === 'Escape') {
      this.closeSearch();
    }
  }

  get adminInitials(): string {
    const name = this.sharedservice.userData?.name || 'Admin';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  focusSearch(): void {
    if (this.sharedservice.deviceWidth < 992) {
      this.isMobileSearchOpen = true;
      setTimeout(() => this.searchInputMobile?.nativeElement?.focus(), 0);
      return;
    }
    this.searchInputDesktop?.nativeElement?.focus();
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen = !this.isMobileSearchOpen;
    if (this.isMobileSearchOpen) {
      setTimeout(() => this.searchInputMobile?.nativeElement?.focus(), 0);
    } else {
      this.closeSearch();
    }
  }

  onSearchInput(): void {
    const q = this.searchTxt.trim().toLowerCase();
    if (!q) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }
    this.searchResults = this.searchIndex
      .filter(item =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q)
      )
      .slice(0, 8);
    this.showSearchResults = this.searchResults.length > 0;
  }

  onSearchFocus(): void {
    if (this.searchTxt.trim()) this.onSearchInput();
  }

  navigateSearch(item: HeaderSearchItem): void {
    this.router.navigate([item.url]);
    this.closeSearch();
    this.sharedservice.isSidebarOpen = false;
  }

  closeSearch(): void {
    this.searchTxt = '';
    this.searchResults = [];
    this.showSearchResults = false;
    this.isMobileSearchOpen = false;
  }

  goTo(path: string): void {
    this.isUserDropdownOpen = false;
    this.router.navigate([path]);
  }

  logout(): void {
    this.isUserDropdownOpen = false;
    this.sharedservice.logout();
  }
}
