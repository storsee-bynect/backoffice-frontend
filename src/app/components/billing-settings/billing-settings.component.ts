import {Component,OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';import {FormsModule} from '@angular/forms';import {HttpClient} from '@angular/common/http';
import {BreadcrumbComponent} from '../../shared/components/breadcrumb/breadcrumb.component';import {environment} from '../../shared/environment/environment';import {SharedService} from '../../shared/services/shared.service';
@Component({selector:'app-billing-settings',standalone:true,imports:[CommonModule,FormsModule,BreadcrumbComponent],templateUrl:'./billing-settings.component.html',styleUrl:'./billing-settings.component.scss'})
export class BillingSettingsComponent implements OnInit{
 settings={smsCharge:0.5,minDeposit:1,maxDeposit:500000,transactionFeePercent:0};loading=true;saving=false;error='';
 readonly fields=[{key:'smsCharge',label:'Per SMS charge (INR)',hint:'Each order verification SMS, including resends.',min:0.01,max:10000},{key:'minDeposit',label:'Minimum wallet deposit (INR)',hint:'Smallest allowed prepaid deposit.',min:1,max:500000},{key:'maxDeposit',label:'Maximum wallet deposit (INR)',hint:'Largest allowed prepaid deposit.',min:1,max:500000},{key:'transactionFeePercent',label:'Deposit transaction fee (%)',hint:'Added to payment; not credited to wallet.',min:0,max:100}];
 constructor(private http:HttpClient,public shared:SharedService){}get base(){return environment.APIUrl+'commerce-billing/admin';}ngOnInit(){this.load();}
 load(){this.loading=true;this.error='';this.http.get<any>(this.base).subscribe({next:r=>{this.settings=r.data;this.loading=false;},error:()=>{this.error='Could not load billing settings.';this.loading=false;}});}

 save(){if(this.saving)return;this.saving=true;this.error='';this.http.put<any>(this.base,this.settings).subscribe({next:r=>{this.settings=r.data;this.saving=false;this.shared.showAlert(1,'Billing settings saved.');},error:e=>{this.saving=false;this.error=e.error?.error||'Could not save settings.';}});}
 value(key:string):number{return (this.settings as any)[key];}setValue(key:string,value:number){(this.settings as any)[key]=value;}
}
