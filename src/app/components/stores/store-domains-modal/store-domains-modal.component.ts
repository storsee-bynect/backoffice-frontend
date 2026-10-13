import {Component,Input,OnInit,OnDestroy,ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Subscription,finalize} from 'rxjs';
import {environment} from '../../../shared/environment/environment';
@Component({selector:'app-store-domains-modal',standalone:true,imports:[CommonModule],templateUrl:'./store-domains-modal.component.html',styleUrl:'./store-domains-modal.component.scss'})
export class StoreDomainsModalComponent implements OnInit,OnDestroy{
 @Input() store:any;@Input() platformUrl='';domains:any[]=[];loading=true;failed=false;private request?:Subscription;
 constructor(public activeModal:NgbActiveModal,private http:HttpClient,private cdr:ChangeDetectorRef){}
 ngOnInit(){this.load();}ngOnDestroy(){this.request?.unsubscribe();}
 load(){this.request?.unsubscribe();this.loading=true;this.failed=false;this.request=this.http.get<any>(environment.APIUrl+'customdomain/getDomainByStoreId/'+encodeURIComponent(this.store.id)).pipe(finalize(()=>{this.loading=false;this.cdr.markForCheck();})).subscribe({next:r=>this.domains=r.domainDetails||[],error:()=>this.failed=true});}
 status(domain:any){if(Number(domain.verified)!==1)return domain.lastError?'DNS needs attention':'Awaiting DNS';return domain.sslStatus==='ready'?'Connected':domain.sslStatus==='error'?'SSL needs attention':'Setting up SSL';}
 url(domain:any){return 'https://'+String(domain.domain||'').replace(/^https?:\/\//i,'').split('/')[0];}
}
