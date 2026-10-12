import {of,throwError} from 'rxjs';
import {BlogPublishingSettingsComponent} from './blog-publishing-settings.component';
import {BlogsComponent} from '../blogs/blogs.component';
describe('Store blog publishing settings',()=>{
  const app=(code='blogger',connected=false)=>({code,name:'Blogger',description:'',enabled:connected,settings:{postingMode:'manual' as const},connection:{connected,authorized:connected,accountName:'Account',targetId:connected?'123':'',targetName:'Blog'}});
  it('does not enable Blogger without a verified account and blog',()=>{
    const update=jasmine.createSpy('update');const c=new BlogPublishingSettingsComponent({update} as any);c.app=app();c.save();expect(update).not.toHaveBeenCalled();expect(c.error).toContain('Connect Google');
  });
  it('selects the verified Blogger destination before enabling auto mode',()=>{
    const service={selectBlog:jasmine.createSpy().and.returnValue(of({connection:{connected:true}})),update:jasmine.createSpy().and.returnValue(of({data:app('blogger',true)}))};
    const c=new BlogPublishingSettingsComponent(service as any);c.app=app();c.authorized=true;c.blogId='123';c.mode='auto';const saved=jasmine.createSpy('saved');c.saved.subscribe(saved);c.save();
    expect(service.selectBlog).toHaveBeenCalledWith('123');expect(service.update).toHaveBeenCalledWith('blogger',{enabled:true,settings:{postingMode:'auto'}});expect(saved).toHaveBeenCalled();c.ngOnDestroy();
  });
  it('does not enable Blogger when destination verification fails',()=>{
    const service={selectBlog:()=>throwError(()=>({error:{error:'Blog rejected'}})),update:jasmine.createSpy()};
    const c=new BlogPublishingSettingsComponent(service as any);c.app=app();c.authorized=true;c.blogId='123';c.save();expect(service.update).not.toHaveBeenCalled();expect(c.busy).toBeFalse();expect(c.error).toBe('Blog rejected');c.ngOnDestroy();
  });
  it('shows separate manual actions only for eligible published blogs',()=>{
    const c=new BlogsComponent({isPageUpdate:true} as any,{} as any,{} as any,{} as any);const a=app('blogger',true);const blog={status:1,externalPosts:[]};
    expect(c.canPost(blog,a)).toBeTrue();expect(c.canPost({...blog,status:0},a)).toBeFalse();expect(c.canPost(blog,{...a,enabled:false})).toBeFalse();
    expect(c.canPost({...blog,externalPosts:[{provider:'blogger',status:'succeeded'}]},a)).toBeFalse();expect(c.canPost({...blog,externalPosts:[{provider:'blogger',status:'uncertain'}]},a)).toBeFalse();
    expect(c.canPost(blog,{...a,settings:{postingMode:'auto'}})).toBeFalse();
  });
});

describe('Backoffice blog publishing initialization',()=>{
  it('loads connected accounts when the Blogs page opens',()=>{
    const list=jasmine.createSpy('list').and.returnValue(of({data:[]}));
    const component=new BlogsComponent({isPageUpdate:true} as any,{} as any,{} as any,{list} as any);
    spyOn(component,'getDataList');component.ngOnInit();
    expect(list).toHaveBeenCalled();component.ngOnDestroy();
  });
});
