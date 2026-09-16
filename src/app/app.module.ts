import { APP_INITIALIZER, NgModule } from '@angular/core';
import { ConfigService } from './shared/services/config.service';

export function initAppConfig(cfg: ConfigService) {
  return () => cfg.load();
}
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { BreadcrumbComponent } from './shared/components/breadcrumb/breadcrumb.component';
import { PageDataCountComponent } from './shared/components/page-data-count/page-data-count.component';
import { UsersComponent } from './components/users/users.component';
import { AddUpdateUsersComponent } from './components/users/add-update-users/add-update-users.component';
import { NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { RolesComponent } from './components/roles/roles.component';
import { AddUpdateRoleComponent } from './components/roles/add-update-role/add-update-role.component';
import { UpdateRolePermissionComponent } from './components/roles/update-role-permission/update-role-permission.component';
import { PagesComponent } from './components/pages/pages.component';
import { AddUpdatePageComponent } from './components/pages/add-update-page/add-update-page.component';
import { PageCategoriesComponent } from './components/page-categories/page-categories.component';
import { AddUpdatePageCategoryComponent } from './components/page-categories/add-update-page-category/add-update-page-category.component';
import { TableViewSkeletonComponent } from './shared/components/table-view-skeleton/table-view-skeleton.component';
import { BoxViewSkeletonComponent } from './shared/components/box-view-skeleton/box-view-skeleton.component';
import { Interceptor } from './shared/services/intercenptor';
import { BtnLoadingDirective } from './shared/directives/btn-loading.directive';
import { ViewImageComponent } from './shared/components/view-image/view-image.component';
import { ViewContentComponent } from './shared/components/view-content/view-content.component';
import { TicketsComponent } from './components/tickets/tickets.component';
import { TicketChatComponent } from './components/tickets/ticket-chat/ticket-chat.component';
import { NgxSimpleTextEditorModule } from 'ngx-simple-text-editor';
import { CouponsComponent } from './components/coupons/coupons.component';
import { AddUpdateCouponComponent } from './components/coupons/add-update-coupon/add-update-coupon.component';
import { OnlyNumberDirective } from './shared/directive/only-number.directive';
import { ThemeCategoryComponent } from './components/theme-category/theme-category.component';
import { AddUpdateThemeCategoryComponent } from './components/theme-category/add-update-theme-category/add-update-theme-category.component';
import { DeleteConfirmationComponent } from './shared/components/delete-confirmation/delete-confirmation.component';
import { TemplatesComponent } from './components/templates/templates.component';
import { AddUpdateTemplateComponent } from './components/templates/add-update-template/add-update-template.component';
import { PackagesComponent } from './components/packages/packages.component';
import { AddUpdatePackageComponent } from './components/packages/add-update-package/add-update-package.component';
import { PackageBenefitsComponent } from './components/packages/package-benefits/package-benefits.component';
import { StoresComponent } from './components/stores/stores.component';
import { AddUpdateStoreComponent } from './components/stores/add-update-store/add-update-store.component';
import { ContactLeadsComponent } from './components/contact-leads/contact-leads.component';
import { ViewStoreDetailComponent } from './components/stores/view-store-detail/view-store-detail.component';
import { ViewTemplateDetailComponent } from './components/templates/view-template-detail/view-template-detail.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StoreUsersComponent } from './components/store-users/store-users.component';
import { AddUpdateStoreUserComponent } from './components/store-users/add-update-store-user/add-update-store-user.component';
import { StoreUsersListComponent } from './components/stores/store-users-list/store-users-list.component';
import { PoliciesComponent } from './components/policies/policies.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { PaymentSettingComponent } from './components/payment-setting/payment-setting.component';
import { FileUploadComponent } from './shared/components/file-upload/file-upload.component';
import { LeadDashboardComponent } from './components/lead-dashboard/lead-dashboard.component';
import { LeadsComponent } from './components/leads/leads.component';
import { AddUpdateLeadComponent } from './components/leads/add-update-lead/add-update-lead.component';
import { UpdateLeadStatusComponent } from './components/leads/update-lead-status/update-lead-status.component';
import { ViewLocationComponent } from './shared/components/view-location/view-location.component';
import { StorePlanHistoryComponent } from './components/stores/store-plan-history/store-plan-history.component';
import { StoreAssignPlanComponent } from './components/stores/store-plan-history/store-assign-plan/store-assign-plan.component';
import { StoreSettingsComponent } from './components/stores/store-settings/store-settings.component';
import { NotificationSettingsComponent } from './components/notification-settings/notification-settings.component';
import { PushNotificationsComponent } from './components/push-notifications/push-notifications.component';
import { AddUpdatePushCampaignComponent } from './components/push-notifications/add-update-push-campaign/add-update-push-campaign.component';
import { PushCampaignReportComponent } from './components/push-notifications/push-campaign-report/push-campaign-report.component';
import { AppNotificationsComponent } from './components/app-notifications/app-notifications.component';
import { AddUpdateAppNotificationComponent } from './components/app-notifications/add-update-app-notification/add-update-app-notification.component';
import { AppNotificationReportComponent } from './components/app-notifications/app-notification-report/app-notification-report.component';
import { ShippingManagerComponent } from './components/shipping/shipping-manager.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    LayoutComponent,
    LoginComponent,
    DashboardComponent,
    SidebarComponent,
    PageDataCountComponent,
    UsersComponent,
    AddUpdateUsersComponent,
    RolesComponent,
    AddUpdateRoleComponent,
    UpdateRolePermissionComponent,
    PagesComponent,
    AddUpdatePageComponent,
    PageCategoriesComponent,
    AddUpdatePageCategoryComponent,
    TableViewSkeletonComponent,
    ViewImageComponent,
    ViewContentComponent,
    TicketsComponent,
    TicketChatComponent,
    CouponsComponent,
    AddUpdateCouponComponent,
    ThemeCategoryComponent,
    AddUpdateThemeCategoryComponent,
    DeleteConfirmationComponent,
    TemplatesComponent,
    AddUpdateTemplateComponent,
    PackagesComponent,
    AddUpdatePackageComponent,
    PackageBenefitsComponent,
    StoresComponent,
    AddUpdateStoreComponent,
    ContactLeadsComponent,
    ViewStoreDetailComponent,
    ViewTemplateDetailComponent,
    StoreUsersComponent,
    AddUpdateStoreUserComponent,
    StoreUsersListComponent,
    PoliciesComponent,
    TransactionsComponent,
    PaymentSettingComponent,
    FileUploadComponent,
    LeadDashboardComponent,
    LeadsComponent,
    AddUpdateLeadComponent,
    UpdateLeadStatusComponent,
    ViewLocationComponent,
    StorePlanHistoryComponent,
    StoreAssignPlanComponent,
    StoreSettingsComponent,
    ShippingManagerComponent
  ],
  imports: [
    OnlyNumberDirective,
    BtnLoadingDirective,
    FormsModule,
    BrowserModule,
    NgxPaginationModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgbModule,
    NgbTooltip,
    NgMultiSelectDropDownModule,
    ToastrModule.forRoot(),
    NgxSimpleTextEditorModule,
    NgApexchartsModule,
    BreadcrumbComponent,
    BoxViewSkeletonComponent,
    NotificationSettingsComponent,
    PushNotificationsComponent,
    AddUpdatePushCampaignComponent,
    PushCampaignReportComponent,
    AppNotificationsComponent,
    AddUpdateAppNotificationComponent,
    AppNotificationReportComponent
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: initAppConfig, deps: [ConfigService], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
