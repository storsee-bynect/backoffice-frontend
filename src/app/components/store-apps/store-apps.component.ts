import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Subscription, finalize} from 'rxjs';
import {BreadcrumbComponent} from '../../shared/components/breadcrumb/breadcrumb.component';
import {SharedService} from '../../shared/services/shared.service';
import {environment} from '../../shared/environment/environment';
@Component({selector:'app-store-apps',standalone:true,imports:[CommonModule,FormsModule,BreadcrumbComponent],templateUrl:'./store-apps.component.html',styleUrl:'./store-apps.component.scss'})
export class StoreAppsComponent implements OnInit,OnDestroy {
 rows:any[]=[]; search=''; loading=false; failed=false; saving=''; private requests=new Subscription();
 constructor(private http:HttpClient,public shared:SharedService,private cdr:ChangeDetectorRef){}
 get filtered(){const text=this.search.trim().toLowerCase();return this.rows.filter(row => (row.name+' '+row.description+' '+row.category).toLowerCase().includes(text));}
 ngOnInit(){this.load();} ngOnDestroy(){this.requests.unsubscribe();}
 load(){this.loading=true;this.failed=false;this.requests.add(this.http.get<any>(environment.APIUrl+'apps/admin').pipe(finalize(()=>{this.loading=false;this.cdr.markForCheck();})).subscribe({next:r=>{this.rows=r.data||[];},error:()=>{this.failed=true;}}));}
 logo(code:string){return code==='blogger' ? 'assets/img/apps/blogger.png' : code==='google_analytics' ? 'assets/img/apps/google-analytics.png' : '';}
 toggle(row:any){if(this.saving||!this.shared.isPageUpdate)return;this.saving=row.code;const isActive=Number(row.isActive)!==1;this.requests.add(this.http.patch(environment.APIUrl+'apps/admin/'+encodeURIComponent(row.code)+'/status',{isActive}).pipe(finalize(()=>{this.saving='';this.cdr.markForCheck();})).subscribe({next:()=>row.isActive=isActive?1:0,error:()=>this.shared.showAlert(2,'Could not change app status. Please try again.')}));}
 placement(row:any,field:'isFeatured'|'isPopular'){if(this.saving||!this.shared.isPageUpdate)return;this.saving=row.code;const value=Number(row[field])!==1;this.requests.add(this.http.patch(environment.APIUrl+'apps/admin/'+encodeURIComponent(row.code)+'/merchandising',{[field]:value}).pipe(finalize(()=>{this.saving='';this.cdr.markForCheck();})).subscribe({next:()=>row[field]=value?1:0,error:()=>this.shared.showAlert(2,'Could not update app placement. Please try again.')}));}
}
