import {Component,OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {StoreAppItem,StoreAppsService} from './blog-setting.service';
import {BlogPublishingSettingsComponent} from './blog-publishing-settings.component';
import {SharedService} from '../../shared/services/shared.service';
import {BreadcrumbComponent} from '../../shared/components/breadcrumb/breadcrumb.component';
import {BoxViewSkeletonComponent} from '../../shared/components/box-view-skeleton/box-view-skeleton.component';
@Component({selector:'app-blog-setting',standalone:true,imports:[CommonModule,RouterLink,BlogPublishingSettingsComponent,BreadcrumbComponent,BoxViewSkeletonComponent],templateUrl:'./blog-setting.component.html',styleUrl:'./blog-setting.component.scss'})
export class BlogSettingComponent implements OnInit {
  apps:StoreAppItem[]=[];selected:StoreAppItem|null=null;loading=true;error='';busy='';
  constructor(private service:StoreAppsService,public shared:SharedService){}
  ngOnInit(){this.load();}
  load(){this.loading=true;this.error='';this.service.list().subscribe({next:r=>{this.apps=r.data.filter(app=>app.code==='blogger');this.loading=false;},error:e=>{this.loading=false;this.error=e?.error?.error || 'Could not load blog settings.';}});}
  logo(code:string){return 'assets/img/apps/blogger.png';}
  saved(app:StoreAppItem){this.shared.showAlert(1,app.enabled ? `${app.name} settings saved` : `${app.name} disconnected`);this.selected=null;this.load();}
  close(){this.selected=null;this.load();}
  toggle(app:StoreAppItem){if(this.busy || !this.shared.isPageUpdate)return;if(!app.enabled && !app.connection?.connected){this.selected=app;return;}this.busy=app.code;this.service.update(app.code,{enabled:!app.enabled}).subscribe({next:()=>{this.busy='';this.load();},error:e=>{this.busy='';this.shared.showAlert(2,e?.error?.error || 'Could not update publishing.');}});}
}
