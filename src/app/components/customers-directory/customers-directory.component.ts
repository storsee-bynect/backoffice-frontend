import { SharedService } from '../../shared/services/shared.service';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';
import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, finalize } from 'rxjs';
import { urlConstant } from '../../shared/constant/urlConst';
interface Contact {id?:number;storeId?:number|null;storeName?:string;name:string;mobile:string;countryCode:string;email:string;address:string;city:string;state:string;country:string;postalCode:string;consent:boolean;}
const empty=():Contact=>({name:'',mobile:'',countryCode:'91',email:'',address:'',city:'',state:'',country:'India',postalCode:'',consent:false});
@Component({selector:'app-customers-directory',templateUrl:'./customers-directory.component.html',styleUrl:'./customers-directory.component.scss'})
export class CustomersDirectoryComponent implements OnInit,OnDestroy {
 bulkSelectionMode=false; readonly sourceOptions=[{value:'',label:'All sources'},{value:'store',label:'Store customers'},{value:'imported',label:'Imported / unassigned'}];
 rows:any[]=[];selected=new Set<number>();search='';source='';page=1;limit=10;total=0;loading=false;error='';saving=false;modalError='';draft=empty();file:File|null=null;consent=false;uploading=false;job:any=null;deleteIds:number[]=[];private modal?:NgbModalRef;private listRequest?:Subscription;private importRequest?:Subscription;private pollRequest?:Subscription;private pollTimer?:ReturnType<typeof setInterval>;
 countries:string[]=[];states:string[]=[];cities:string[]=[];locationsLoading=false;statesLoading=false;citiesLoading=false;locationError='';
 private countryRequest?:Subscription;private stateRequest?:Subscription;private cityRequest?:Subscription;
 private get locationBase(){return urlConstant.LocationsAPI.overview.replace('admin/overview','');}
 locationOptions(items:string[],current:string){return current&&!items.includes(current)?[current,...items]:items;}
 loadLocations(){
  this.countryRequest?.unsubscribe();this.stateRequest?.unsubscribe();this.cityRequest?.unsubscribe();
  this.locationsLoading=true;this.statesLoading=false;this.citiesLoading=false;this.locationError='';this.states=[];this.cities=[];
  this.countryRequest=this.http.get<any>(this.locationBase+'countries').pipe(finalize(()=>this.locationsLoading=false)).subscribe({next:r=>{this.countries=(r.data||[]).map((x:any)=>x.name);this.loadStates();},error:()=>this.locationError='Could not load locations. Please retry.'});
 }
 countryChanged(){this.draft.state='';this.draft.city='';this.loadStates();}
 stateChanged(){this.draft.city='';this.loadCities();}
 loadStates(){
  this.stateRequest?.unsubscribe();this.cityRequest?.unsubscribe();this.states=[];this.cities=[];this.citiesLoading=false;this.locationError='';
  if(!this.draft.country)return;this.statesLoading=true;
  this.stateRequest=this.http.get<any>(this.locationBase+'states',{params:{country:this.draft.country}}).pipe(finalize(()=>this.statesLoading=false)).subscribe({next:r=>{this.states=(r.data||[]).map((x:any)=>x.name);if(this.draft.state)this.loadCities();},error:()=>this.locationError='Could not load states. Please retry.'});
 }
 loadCities(){
  this.cityRequest?.unsubscribe();this.cities=[];this.locationError='';if(!this.draft.state)return;this.citiesLoading=true;
  this.cityRequest=this.http.get<any>(this.locationBase+'cities',{params:{country:this.draft.country,state:this.draft.state}}).pipe(finalize(()=>this.citiesLoading=false)).subscribe({next:r=>this.cities=(r.data||[]).map((x:any)=>x.name),error:()=>this.locationError='Could not load cities. Please retry.'});
 }
 constructor(private http:HttpClient,private modals:NgbModal, public sharedservice:SharedService){}
 private get base(){return urlConstant.CustomerDirectoryAPI.base;}
 changePage(page:number){if(this.loading)return;this.page=page;this.load();}
 get pages(){return Math.max(1,Math.ceil(this.total/this.limit));}
 get allSelected(){return this.rows.length>0&&this.rows.every(row=>this.selected.has(row.id));}
 get importing(){return this.job&&['queued','processing'].includes(this.job.status);}
 ngOnInit(){this.load();const id=localStorage.getItem('customer_directory_import');if(id)this.poll(id);}
 ngOnDestroy(){this.countryRequest?.unsubscribe();this.stateRequest?.unsubscribe();this.cityRequest?.unsubscribe();this.listRequest?.unsubscribe();this.importRequest?.unsubscribe();this.stopPoll();this.modal?.dismiss();}
 load(reset=false){if(reset)this.page=1;this.listRequest?.unsubscribe();this.selected.clear();this.loading=true;this.error='';this.listRequest=this.http.get<any>(this.base,{params:{page:this.page,limit:this.limit,search:this.search.trim(),source:this.source}}).pipe(finalize(()=>this.loading=false)).subscribe({next:r=>{this.rows=r.data||[];this.total=r.total||0;this.page=r.page||1;},error:e=>{this.rows=[];this.error=e?.error?.error||'Customers could not be loaded. Please try again.';}});}
 clearFilters(){this.search='';this.source='';this.load(true);}
 toggleSelectionMode(){if(this.loading||this.saving||!this.sharedservice.isPageDelete)return;this.bulkSelectionMode=!this.bulkSelectionMode;this.selected.clear();}
 clearSelection(){if(!this.loading&&!this.saving)this.selected.clear();}
 toggle(id:number){if(!this.bulkSelectionMode||this.loading||this.saving)return;this.selected.has(id)?this.selected.delete(id):this.selected.add(id);}
 toggleAll(){if(!this.bulkSelectionMode||this.loading||this.saving)return;if(this.allSelected)this.selected.clear();else this.rows.forEach(row=>this.selected.add(row.id));}
 initials(name:string){return String(name||'?').split(' ').filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase();}
 phone(row:any){const number=String(row.mobile||'').trim();return number.startsWith('+')?number:'+'+(row.countryCode||'91')+' '+number;}
 openEditor(view:TemplateRef<any>,row?:any){this.draft=row?{...empty(),...row,consent:!!row.directoryConsentAt}:empty();this.modalError='';this.loadLocations();this.modal=this.modals.open(view,{centered:true,size:'lg',windowClass:'directory-customer-modal',backdrop:'static',beforeDismiss:()=>!this.saving});}
 save(){if(this.saving)return;this.modalError='';if(!this.draft.name.trim()||!this.draft.mobile.trim()||!this.draft.consent){this.modalError='Name, mobile and permission confirmation are required.';return;}this.saving=true;const request=this.draft.id?this.http.put(this.base+'/'+this.draft.id,this.draft):this.http.post(this.base,this.draft);request.pipe(finalize(()=>this.saving=false)).subscribe({next:()=>{this.modal?.close();this.sharedservice.showAlert(1,this.draft.id?'Customer updated.':'Customer added to the directory.');this.load(!this.draft.id);},error:e=>this.modalError=e?.error?.error||'Unable to save customer.'});}
 openDelete(id?:number){this.deleteIds=id?[id]:[...this.selected];if(!this.deleteIds.length)return;this.modalError='';this.modal=this.modals.open(DeleteConfirmationComponent,{centered:true,backdrop:'static'});this.modal.componentInstance.title='Delete '+this.deleteIds.length+' customer'+(this.deleteIds.length===1?'':'s')+'?';this.modal.componentInstance.message="These customers will be permanently removed from the directory and any linked store's customer list. Previous orders and invoices will remain. This action cannot be undone.";this.modal.result.then(confirmed=>{if(confirmed)this.delete();},()=>{});}
 delete(){if(this.saving)return;this.saving=true;this.http.post<any>(this.base+'/delete',{ids:this.deleteIds}).pipe(finalize(()=>this.saving=false)).subscribe({next:r=>{this.modal?.close();this.sharedservice.showAlert(1,r.deleted+' customer(s) deleted.');this.load();},error:e=>this.sharedservice.showAlert(2,e?.error?.error||'Unable to delete customers.')});}
 openImport(view:TemplateRef<any>){this.file=null;this.consent=false;this.modalError='';this.modal=this.modals.open(view,{centered:true,size:'lg',backdrop:'static',beforeDismiss:()=>!this.uploading});}
 selectFile(event:Event){this.file=(event.target as HTMLInputElement).files?.[0]||null;this.modalError='';if(this.file&&(!this.file.name.toLowerCase().endsWith('.csv')||this.file.size>512*1024*1024)){this.modalError='Choose a CSV file up to 512 MB.';this.file=null;}}
 upload(){if(!this.file||!this.consent||this.uploading)return;this.uploading=true;this.modalError='';const form=new FormData();form.append('file',this.file);form.append('consent','true');this.importRequest=this.http.post<any>(this.base+'/import',form).pipe(finalize(()=>this.uploading=false)).subscribe({next:job=>{this.job=job;localStorage.setItem('customer_directory_import',job.id);this.modal?.close();this.poll(job.id);},error:e=>this.modalError=e?.error?.error||'Import could not be started.'});}
 private stopPoll(){if(this.pollTimer)clearInterval(this.pollTimer);this.pollTimer=undefined;this.pollRequest?.unsubscribe();}
 private poll(id:string){this.stopPoll();const update=()=>{if(this.pollRequest&&!this.pollRequest.closed)return;this.pollRequest=this.http.get<any>(this.base+'/import/'+id).subscribe({next:job=>{this.job=job;if(!this.importing){this.stopPoll();localStorage.removeItem('customer_directory_import');this.load(true);}},error:e=>{this.stopPoll();localStorage.removeItem('customer_directory_import');this.job={status:'failed',message:e?.error?.error||'Unable to check import progress. Existing imported numbers are skipped when retrying.'};}});};this.pollTimer=setInterval(update,1800);update();}
 cancelImport(){if(this.job?.id)this.http.post(this.base+'/import/'+this.job.id+'/cancel',{}).subscribe({error:e=>this.error=e?.error?.error||'Unable to cancel import.'});}
 template(){const csv='name,mobile,country_code,email,address_line_1,city,state,country,pincode\r\nExample Customer,9876543210,91,customer@example.com,"12 Example Road",Ahmedabad,Gujarat,India,380001\r\n';const href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=href;link.download='customers-directory-template.csv';link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}
}
