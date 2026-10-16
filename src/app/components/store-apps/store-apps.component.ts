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
 galleryApp:any=null; galleryImages:string[]=[]; galleryRatio='16:9'; uploading=false; gallerySaving=false;
 rows:any[]=[]; search=''; loading=false; failed=false; saving=''; private requests=new Subscription();
 constructor(private http:HttpClient,public shared:SharedService,private cdr:ChangeDetectorRef){}
 get filtered(){const text=this.search.trim().toLowerCase();return this.rows.filter(row => (row.name+' '+row.description+' '+row.category).toLowerCase().includes(text));}
 ngOnInit(){this.load();} ngOnDestroy(){this.requests.unsubscribe();}
 load(){this.loading=true;this.failed=false;this.requests.add(this.http.get<any>(environment.APIUrl+'apps/admin').pipe(finalize(()=>{this.loading=false;this.cdr.markForCheck();})).subscribe({next:r=>{this.rows=r.data||[];},error:()=>{this.failed=true;}}));}
 openGallery(row:any){this.galleryApp=row;this.galleryImages=[...(row.gallery||[])];this.galleryRatio=row.galleryRatio==='9:16'?'9:16':'16:9';}
 closeGallery(){if(!this.uploading&&!this.gallerySaving)this.galleryApp=null;}
 async addGalleryImage(){if(this.uploading||this.gallerySaving||this.galleryImages.length>=4||!this.shared.isPageUpdate)return;this.uploading=true;try{const result=await this.shared.UploadFile('app-gallery',this.galleryRatio==='9:16'?{width:900,height:1600}:{width:1600,height:900});if(result?.url)this.galleryImages.push(result.url);}finally{this.uploading=false;this.cdr.markForCheck();}}
 saveGallery(){if(!this.galleryApp||this.gallerySaving||this.uploading)return;this.gallerySaving=true;const row=this.galleryApp;this.requests.add(this.http.patch<any>(environment.APIUrl+'apps/admin/'+encodeURIComponent(row.code)+'/gallery',{images:this.galleryImages,ratio:this.galleryRatio}).pipe(finalize(()=>{this.gallerySaving=false;this.cdr.markForCheck();})).subscribe({next:r=>{Object.assign(row,r.data);this.galleryApp=null;this.shared.showAlert(1,'App gallery saved');},error:e=>this.shared.showAlert(2,e?.error?.error||'Could not save gallery')}));}
 logo(code:string){return code==='google_analytics' ? 'assets/img/apps/google-analytics.png' : '';}
 toggle(row:any){if(this.saving||!this.shared.isPageUpdate)return;this.saving=row.code;const isActive=Number(row.isActive)!==1;this.requests.add(this.http.patch(environment.APIUrl+'apps/admin/'+encodeURIComponent(row.code)+'/status',{isActive}).pipe(finalize(()=>{this.saving='';this.cdr.markForCheck();})).subscribe({next:()=>row.isActive=isActive?1:0,error:()=>this.shared.showAlert(2,'Could not change app status. Please try again.')}));}
 placement(row:any,field:'isFeatured'|'isPopular'){if(this.saving||!this.shared.isPageUpdate)return;this.saving=row.code;const value=Number(row[field])!==1;this.requests.add(this.http.patch(environment.APIUrl+'apps/admin/'+encodeURIComponent(row.code)+'/merchandising',{[field]:value}).pipe(finalize(()=>{this.saving='';this.cdr.markForCheck();})).subscribe({next:()=>row[field]=value?1:0,error:()=>this.shared.showAlert(2,'Could not update app placement. Please try again.')}));}
}
