import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {StoreAppItem, StoreAppsService} from './blog-setting.service';
import {finalize, Subscription} from 'rxjs';
@Component({selector:'app-blog-publishing-settings', standalone:true, imports:[CommonModule,FormsModule],templateUrl:'./blog-publishing-settings.component.html',styleUrl:'./blog-publishing-settings.component.scss'})
export class BlogPublishingSettingsComponent implements OnInit,OnDestroy {
  @Input({required:true}) app!:StoreAppItem;
  @Output() saved=new EventEmitter<StoreAppItem>();
  @Output() cancelled=new EventEmitter<void>();
  mode:'manual'|'auto'='manual'; blogId=''; blogs:any[]=[]; busy=false; error=''; authorized=false;
  private popup:Window|null=null; private monitor?:ReturnType<typeof setInterval>; private requests=new Subscription();
  constructor(private service:StoreAppsService) {}
  ngOnInit(){this.mode=this.app.settings?.postingMode || 'manual';this.blogId=this.app.connection?.targetId || '';this.authorized=!!this.app.connection?.authorized;if(this.app.code==='blogger' && this.authorized)this.loadBlogs();window.addEventListener('message',this.message);}
  ngOnDestroy(){window.removeEventListener('message',this.message);if(this.monitor)clearInterval(this.monitor);this.popup?.close();this.requests.unsubscribe();}
  private message=(event:MessageEvent)=>{
    if(event.origin!==this.service.callbackOrigin || event.source!==this.popup || event.data?.type!=='storsee-platform-blogger-connected')return;
    if(this.monitor)clearInterval(this.monitor);this.busy=false;this.popup=null;
    if(event.data.status==='authorized'){this.authorized=true;this.blogId='';this.loadBlogs();}else this.error=event.data.error || 'Google connection failed.';
  };
  connectGoogle(){
    if(this.busy)return;this.error='';
    this.popup=window.open('about:blank','storsee-blogger-connect','width=560,height=720');
    if(!this.popup){this.error='Allow popups for this site to connect Google.';return;}
    this.busy=true;
    this.requests.add(this.service.startBlogger().subscribe({next:r=>{
      if(!this.popup)return;this.popup.location.href=r.url;
      this.monitor=setInterval(()=>{if(this.popup?.closed){if(this.monitor)clearInterval(this.monitor);this.popup=null;this.busy=false;this.requests.add(this.service.list().subscribe({next:r=>{const app=r.data.find(a=>a.code==='blogger');if(app?.connection?.authorized){this.authorized=true;this.loadBlogs();}},error:()=>{this.error='Could not check Google connection. Reopen settings to retry.';}}));}},500);
    },error:e=>{this.popup?.close();this.popup=null;this.busy=false;this.error=e?.error?.error || 'Could not start Google connection.';}}));
  }
  loadBlogs(){this.busy=true;this.error='';this.requests.add(this.service.bloggerBlogs().pipe(finalize(()=>this.busy=false)).subscribe({next:r=>{this.blogs=r.data || [];if(!this.blogs.length)this.error='No writable Blogger blogs found. Create a blog at blogger.com or ask its owner for author access.';},error:e=>this.error=e?.error?.error || 'Could not load Blogger blogs.'}));}
  save(){
    if(this.busy)return;this.error='';
    if(this.app.code==='blogger' && (!this.authorized || !this.blogId)){this.error='Connect Google and choose your Blogger blog first.';return;}
    this.busy=true;
    const connect=this.service.selectBlog(this.blogId);
    const update=()=>{this.requests.add(this.service.update(this.app.code,{enabled:true,settings:{postingMode:this.mode}}).pipe(finalize(()=>this.busy=false)).subscribe({next:r=>this.saved.emit(r.data),error:e=>this.error=e?.error?.error || 'Could not save publishing settings.'}));};
    if(connect)this.requests.add(connect.subscribe({next:update,error:e=>{this.busy=false;this.error=e?.error?.error || 'Could not verify this connection.';}}));else update();
  }
  disconnect(){if(this.busy)return;this.busy=true;this.error='';this.requests.add(this.service.disconnect(this.app.code).pipe(finalize(()=>this.busy=false)).subscribe({next:()=>this.saved.emit({...this.app,enabled:false,connection:{connected:false,authorized:false,accountName:'',targetId:'',targetName:''}}),error:e=>this.error=e?.error?.error || 'Could not disconnect.'}));}
}
