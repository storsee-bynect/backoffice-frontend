import {TestBed} from '@angular/core/testing';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {Subject,of} from 'rxjs';
import {CredentialsComponent} from './credentials.component';
import {CredentialsService} from './credentials.service';
import {SiteConfigService} from '../site-configuration/site-configuration.service';
import {SharedService} from '../../shared/services/shared.service';
describe('Credentials OTP settings',()=>{
 let pending:Subject<any>;let service:any;
 beforeEach(async()=>{pending=new Subject();service={getCredentials:()=>pending,updateOtp:jasmine.createSpy('updateOtp').and.callFake((data:any)=>of({data})),updateGoogle:()=>of({data:{google:{}}})};await TestBed.configureTestingModule({declarations:[CredentialsComponent],imports:[CommonModule,FormsModule],schemas:[NO_ERRORS_SCHEMA],providers:[{provide:CredentialsService,useValue:service},{provide:SiteConfigService,useValue:{getSiteConfig:()=>of({})}},{provide:SharedService,useValue:{showAlert:()=>{},isPageUpdate:true}}]}).compileComponents();});
 function setup(){const f=TestBed.createComponent(CredentialsComponent);f.detectChanges();expect(f.nativeElement.querySelector('.cr-skeleton')).not.toBeNull();pending.next({data:{google:{},otp:{sendOnLogin:false,sendOnOnboard:false,endpoint:'https://jskbulkmarketing.in/app/smsapi/index.php',params:[]}}});f.detectChanges();return f;}
 it('replaces the loading skeleton with tabs and hides the setup guide until requested',()=>{const f=setup();expect(f.nativeElement.querySelector('.cr-load-error')).toBeNull();expect(f.nativeElement.querySelectorAll('.cr-tabs__btn').length).toBe(2);expect(f.nativeElement.querySelector('.cr-steps')).toBeNull();f.nativeElement.querySelector('.cr-guide-link').click();f.detectChanges();expect(f.nativeElement.querySelector('.cr-steps')).not.toBeNull();f.destroy();});
 it('imports URL parameters, replaces static recipients and saves independently controlled switches',()=>{const f=setup();const c=f.componentInstance;c.setTab('otp');c.importUrl='https://jskbulkmarketing.in/app/smsapi/index.php?key=test-only&contacts=9812345678&msg=OTP%20%3A%20%7B%23num%23%7D';c.importSmsUrl();expect(c.otp.params.find((p:any)=>p.name==='contacts').value).toBe('{#mobile#}');expect(c.importUrl).toBe('');c.otp.sendOnLogin=true;c.otp.sendOnOnboard=false;f.detectChanges();expect(f.nativeElement.querySelector('#cr-sendOnLogin')).not.toBeNull();expect(f.nativeElement.querySelector('#cr-sendOnOnboard')).not.toBeNull();expect(f.nativeElement.querySelector('.cr-param-value input[type=password]')).not.toBeNull();c.saveOtp();expect(service.updateOtp).toHaveBeenCalledWith(jasmine.objectContaining({sendOnLogin:true,sendOnOnboard:false}));f.destroy();});
});
