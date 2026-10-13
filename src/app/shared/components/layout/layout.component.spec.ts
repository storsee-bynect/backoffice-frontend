import {TestBed, ComponentFixture} from '@angular/core/testing';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterTestingModule} from '@angular/router/testing';
import {Router} from '@angular/router';
import {By} from '@angular/platform-browser';
import {LayoutComponent} from './layout.component';
import {SidebarComponent} from '../sidebar/sidebar.component';
import {HeaderComponent} from '../header/header.component';
import {SharedService} from '../../services/shared.service';

describe('Storsee dashboard shell',()=>{
 let fixture:ComponentFixture<LayoutComponent>;let shared:any;let resetStyle:HTMLStyleElement;
 const element=(selector:string)=>fixture.nativeElement.querySelector(selector) as HTMLElement;
 const mobile=()=>window.innerWidth<992;
 beforeEach(async()=>{
  shared={isSidebarOpen:false,isSidebarCollapsed:false,deviceWidth:window.innerWidth,deviceHeight:window.innerHeight,storeData:{name:'Test Store',slug:'test'},userData:{name:'Admin'},sidebarPages:[{category:'Stores',pages:[{url:'/dashboard',pagename:'Dashboard',icon:'house'},{url:'/stores',pagename:'Stores',icon:'store'}]}],getSiteLogoDark:()=> 'assets/icons/favicon-32x32.png',logout:jasmine.createSpy('logout')};
  spyOn(HeaderComponent.prototype,'ngOnInit').and.stub();
  await TestBed.configureTestingModule({imports:[CommonModule,FormsModule,RouterTestingModule],declarations:[LayoutComponent,SidebarComponent,HeaderComponent],providers:[{provide:SharedService,useValue:shared}]}).compileComponents();
  spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);
  resetStyle=document.createElement('style');resetStyle.textContent='body{margin:0}*,*::before,*::after{box-sizing:border-box;transition:none!important;animation:none!important}';document.head.appendChild(resetStyle);
  fixture=TestBed.createComponent(LayoutComponent);fixture.detectChanges();
 });
 afterEach(()=>{fixture?.destroy();resetStyle?.remove();});
 it('renders a white rounded workspace without horizontal overflow at this viewport',()=>{
  const content=element('.content-main');expect(getComputedStyle(content).backgroundColor).toBe('rgb(255, 255, 255)');expect(parseFloat(getComputedStyle(content).borderTopLeftRadius)).toBeGreaterThanOrEqual(14);
  const bounds=content.getBoundingClientRect();expect(bounds.right).toBeLessThanOrEqual(window.innerWidth+1);expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight+1);expect(bounds.width).toBeGreaterThan(200);
  if(!mobile())expect(Math.round(bounds.left)).toBe(220);
 });
 it('collapses to an icon rail and reopens when a navigation group is clicked',()=>{
  if(mobile())return;
  element('.header-collapse-btn').click();fixture.detectChanges();expect(shared.isSidebarCollapsed).toBeTrue();expect(Math.round(element('.sidebar-main').getBoundingClientRect().width)).toBe(60);expect(Math.round(element('.content-main').getBoundingClientRect().left)).toBe(60);
  expect(getComputedStyle(element('.nav-item-label')).display).toBe('none');expect(getComputedStyle(element('.header-collapse-btn')).display).toBe('none');element('.header-logo-link').click();fixture.detectChanges();expect(shared.isSidebarCollapsed).toBeFalse();element('.header-collapse-btn').click();fixture.detectChanges();element('.nav-parent').click();fixture.detectChanges();expect(shared.isSidebarCollapsed).toBeFalse();expect(Math.round(element('.content-main').getBoundingClientRect().left)).toBe(220);
 });
 it('keeps search keyboard access and the account dropdown usable when collapsed',async()=>{
  const header=fixture.debugElement.query(By.directive(HeaderComponent)).componentInstance as HeaderComponent;
  shared.isSidebarCollapsed=true;fixture.detectChanges();
  if(!mobile()) { header.onKeyDown(new KeyboardEvent('keydown',{key:'k',ctrlKey:true}));fixture.detectChanges();await new Promise(resolve=>setTimeout(resolve,1));expect(shared.isSidebarCollapsed).toBeFalse();expect(document.activeElement).toBe(element('.header-search-input')); }
  element('.header-store-btn').click();fixture.detectChanges();expect(element('.header-store-dropdown').classList.contains('is-visible')).toBeTrue();const dropdown=element('.header-store-dropdown').getBoundingClientRect();expect(dropdown.left).toBeGreaterThanOrEqual(0);expect(dropdown.right).toBeLessThanOrEqual(window.innerWidth+1);expect(dropdown.bottom).toBeLessThanOrEqual(window.innerHeight+1);
  header.onKeyDown(new KeyboardEvent('keydown',{key:'Escape'}));fixture.detectChanges();expect(element('.header-store-dropdown').classList.contains('is-visible')).toBeFalse();
 });
 it('opens and dismisses the mobile drawer, keeping background content inert',()=>{
  if(!mobile())return;
  expect(getComputedStyle(element('.sidebar-main')).visibility).toBe('hidden');element('.header-menu-btn').click();fixture.detectChanges();expect(shared.isSidebarOpen).toBeTrue();expect(getComputedStyle(element('.sidebar-main')).visibility).toBe('visible');expect(element('.content-main').hasAttribute('inert')).toBeTrue();element('.sidebar-backdrop').click();fixture.detectChanges();expect(shared.isSidebarOpen).toBeFalse();expect(element('.content-main').hasAttribute('inert')).toBeFalse();
 });
 
});
