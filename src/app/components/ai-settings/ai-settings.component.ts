import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {finalize, Subscription} from 'rxjs';
import {BreadcrumbComponent} from '../../shared/components/breadcrumb/breadcrumb.component';
import {SharedService} from '../../shared/services/shared.service';
import {environment} from '../../shared/environment/environment';
@Component({selector:'app-ai-settings',standalone:true,imports:[CommonModule,FormsModule,BreadcrumbComponent],templateUrl:'./ai-settings.component.html',styleUrls:['./ai-settings.component.scss']})
export class AiSettingsComponent implements OnInit,OnDestroy {
  rows:any[]=[]; page=1; total=0; loading=false; busy=false; configured=false; failed=false;
  editor=false; editing:number|null=null; deleting:number|null=null; error='';
  showApiKey=false;
  transferMode:'backup'|'restore'|null=null; backupPassword=''; backupFile:any=null; transferError='';
  draft={label:'',projectName:'',priority:10,apiKey:'',isEnabled:false};
  private requests=new Subscription();
  private list?:Subscription;
  constructor(private http:HttpClient,public shared:SharedService){}
  get base(){return environment.APIUrl+'ai-keys';}
  get pages(){return Math.max(1,Math.ceil(this.total/20));}
  get rangeStart(){return this.total?(this.page-1)*20+1:0;}
  get rangeEnd(){return Math.min(this.page*20,this.total);}
  get activeCount(){return this.rows.filter(r=>Number(r.isEnabled)===1).length;}
  get testedCount(){return this.rows.filter(r=>r.testStatus==='valid').length;}
  ngOnInit(){this.load();}
  ngOnDestroy(){this.requests.unsubscribe();this.list?.unsubscribe();this.draft.apiKey='';}
  load(){this.list?.unsubscribe();this.loading=true;this.failed=false;this.list=this.http.get<any>(this.base,{params:{page:this.page}}).pipe(finalize(()=>this.loading=false)).subscribe({next:r=>{this.rows=r.data;this.total=r.totalCount;this.configured=r.storageConfigured;if(this.page>this.pages){this.page=this.pages;this.load();}},error:()=>this.failed=true});}
  open(row?:any){if(this.busy)return;this.editing=row?.id||null;this.showApiKey=false;this.error='';this.draft={label:row?.label||'',projectName:row?.projectName||'',priority:row?.priority??10,apiKey:'',isEnabled:!!Number(row?.isEnabled)};this.editor=true;if(row){this.busy=true;this.requests.add(this.http.post<any>(this.base+'/'+row.id+'/credential',{}).pipe(finalize(()=>this.busy=false)).subscribe({next:r=>this.draft.apiKey=r.apiKey,error:e=>this.error=e.error?.error||'Could not load saved key. You can paste a replacement.'}));}}
  close(){this.editor=false;this.showApiKey=false;this.draft.apiKey='';this.error='';}
  save(){if(this.busy)return;this.busy=true;this.error='';const body={...this.draft};const req=this.editing?this.http.patch(this.base+'/'+this.editing,body):this.http.post(this.base,body);this.requests.add(req.pipe(finalize(()=>this.busy=false)).subscribe({next:()=>{this.close();this.load();this.shared.showAlert(1,'AI key saved.');},error:e=>this.error=e.error?.error||'Could not save this key.'}));}
  openTransfer(mode:'backup'|'restore'){this.transferMode=mode;this.backupPassword='';this.backupFile=null;this.transferError='';}
  async selectBackup(event:Event){this.backupFile=null;this.transferError='';const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;if(file.size>6000000){this.transferError='Backup file is too large.';return;}try{this.backupFile=JSON.parse(await file.text());}catch{this.transferError='Choose a valid JSON backup file.';}}
  transfer(){if(this.busy||!this.transferMode)return;this.busy=true;this.transferError='';const mode=this.transferMode;this.requests.add(this.http.post<any>(this.base+'/'+mode,{password:this.backupPassword,...(mode==='restore'?{backup:this.backupFile}:{})}).pipe(finalize(()=>this.busy=false)).subscribe({next:r=>{if(mode==='backup'){const url=URL.createObjectURL(new Blob([JSON.stringify(r)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='storsee-ai-keys-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}else{this.shared.showAlert(1,r.restored+' keys restored. Test before enabling.');this.load();}this.transferMode=null;this.backupPassword='';this.backupFile=null;},error:e=>this.transferError=e.error?.error||'Could not complete backup operation.'}));}
  test(row:any){this.run(this.http.post<any>(this.base+'/'+row.id+'/test',{}),r=>{this.shared.showAlert(r.testStatus==='valid'?1:2,r.testMessage);this.load();});}
  toggle(row:any){this.run(this.http.patch(this.base+'/'+row.id,{label:row.label,projectName:row.projectName,priority:row.priority,isEnabled:!Number(row.isEnabled)}),()=>this.load());}
  remove(row:any){this.run(this.http.delete(this.base+'/'+row.id),()=>{this.deleting=null;this.load();});}
  move(page:number){if(!this.busy&&!this.loading){this.page=page;this.load();}}
  private run(req:any,next:(r:any)=>void){if(this.busy)return;this.busy=true;this.requests.add(req.pipe(finalize(()=>this.busy=false)).subscribe({next,error:(e:any)=>this.shared.showAlert(2,e.error?.error||'Could not complete this action.')}));}
}
