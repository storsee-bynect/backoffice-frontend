import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxPaginationModule } from 'ngx-pagination';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PageDataCountComponent } from '../../shared/components/page-data-count/page-data-count.component';
import { TableViewSkeletonComponent } from '../../shared/components/table-view-skeleton/table-view-skeleton.component';
import { BtnLoadingDirective } from '../../shared/directives/btn-loading.directive';
import { StoreReportsComponent } from './store-reports.component';
import { ApplicationRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StoresComponent } from '../stores/stores.component';
import { StoreService } from '../stores/stores.service';

describe('Store reports', () => {
  let fixture: ComponentFixture<StoreReportsComponent>, component: StoreReportsComponent, http: HttpTestingController;
  const row = {id: 1, storeId: 18, storeName: 'First store', slug: 'first', isActive: 1, email: 'visitor@example.test', message: 'The order has not arrived.', created_at: '2026-10-23T01:00:00Z'};
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StoreReportsComponent, PageDataCountComponent, TableViewSkeletonComponent],
      imports: [CommonModule, FormsModule, HttpClientTestingModule, NgxPaginationModule, NgbModule, BreadcrumbComponent, BtnLoadingDirective],
    }).compileComponents();
    fixture = TestBed.createComponent(StoreReportsComponent); component = fixture.componentInstance; http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { fixture.destroy(); http.verify(); });
  function request(scoped = false) { return http.expectOne(r => r.url.endsWith(scoped ? '/abuse-reports' : '/reports')); }
  it('shows reports from multiple stores with the common breadcrumb and table', () => {
    fixture.detectChanges(); const req = request(); expect(req.request.params.has('storeId')).toBeFalse();
    req.flush({data: [row, {...row, id: 2, storeId: 25, storeName: 'Second store'}], total: 2}); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-breadcrumb')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('First store'); expect(fixture.nativeElement.textContent).toContain('Second store');
  });
  it('keeps store scope on initial load, searches and page changes', () => {
    component.storeId = 18; component.storeName = 'First store'; component.modalMode = true; fixture.detectChanges();
    let req = request(true); expect(req.request.params.get('storeId')).toBe('18'); req.flush({data:[row],total:42}); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-breadcrumb')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('thead th').length).toBe(5);
    component.page = 3; component.search = 'name&message'; component.filter(); req = request(true);
    expect(req.request.params.get('page')).toBe('1'); expect(req.request.params.get('storeId')).toBe('18'); expect(req.request.params.get('search')).toBe('name&message'); req.flush({data:[row],total:42});
    component.changePage(2); req = request(true); expect(req.request.params.get('page')).toBe('2'); expect(req.request.params.get('storeId')).toBe('18'); req.flush({data:[row],total:42});
  });
  it('resets pagination when the page size or store status changes', () => {
    fixture.detectChanges(); request().flush({data:[row],total:100}); component.page = 4; component.limit = 30; component.status = 'inactive'; component.filter();
    const req = request(); expect(req.request.params.get('page')).toBe('1'); expect(req.request.params.get('limit')).toBe('30'); expect(req.request.params.get('status')).toBe('inactive'); req.flush({data:[],total:0});
  });
  it('does not retry a scoped failure as an all-store request', () => {
    component.storeId = 18; fixture.detectChanges(); request(true).flush({error:'Unavailable'},{status:500,statusText:'Error'}); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Could not load reports'); component.load(); const req = request(true); expect(req.request.params.get('storeId')).toBe('18'); req.flush({data:[],total:0});
  });
  it('renders untrusted report markup as text', () => {
    fixture.detectChanges(); request().flush({data:[{...row,message:'<script>alert(1)</script> Visitor report'}],total:1}); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.report-preview').textContent).toContain('<script>'); expect(fixture.nativeElement.querySelector('.report-preview script')).toBeNull();
  });
  it('cancels a pending request when the modal closes', () => {
    component.storeId = 18; fixture.detectChanges(); const req = request(true); component.ngOnDestroy(); expect(req.cancelled).toBeTrue();
  });
  it('opens the real store-row modal with its scope set before the first request', () => {
    const modal = TestBed.inject(NgbModal);
    const stores = new StoresComponent({} as any, TestBed.inject(StoreService), modal);
    stores.openReports({id:18,name:'First store'});
    TestBed.inject(ApplicationRef).tick();
    const req = request(true); expect(req.request.params.get('storeId')).toBe('18'); req.flush({data:[row],total:1});
    TestBed.inject(ApplicationRef).tick();
    expect(document.querySelector('ngb-modal-window')?.textContent).toContain('First store');
    const ref = document.querySelector('ngb-modal-window .btn-close') as HTMLButtonElement;
    ref.click();
  });
});
