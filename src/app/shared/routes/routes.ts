import { CustomersDirectoryComponent } from '../../components/customers-directory/customers-directory.component';
import { Routes } from "@angular/router";
import { IndustriesComponent } from '../../components/industries/industries.component';
import { DashboardComponent } from "../../components/dashboard/dashboard.component";
import { UsersComponent } from "../../components/users/users.component";
import { RolesComponent } from "../../components/roles/roles.component";
import { PagesComponent } from "../../components/pages/pages.component";
import { PageCategoriesComponent } from "../../components/page-categories/page-categories.component";
import { TicketsComponent } from "../../components/tickets/tickets.component";
import { TicketChatComponent } from "../../components/tickets/ticket-chat/ticket-chat.component";
import { CouponsComponent } from "../../components/coupons/coupons.component";
import { ThemeCategoryComponent } from "../../components/theme-category/theme-category.component";
import { TemplatesComponent } from "../../components/templates/templates.component";
import { PackagesComponent } from "../../components/packages/packages.component";
import { StoresComponent } from "../../components/stores/stores.component";
import { ContactLeadsComponent } from "../../components/contact-leads/contact-leads.component";
import { StoreUsersComponent } from "../../components/store-users/store-users.component";
import { PoliciesComponent } from "../../components/policies/policies.component";
import { TransactionsComponent } from "../../components/transactions/transactions.component";
import { PaymentSettingComponent } from "../../components/payment-setting/payment-setting.component";
import { LeadDashboardComponent } from "../../components/lead-dashboard/lead-dashboard.component";
import { LeadsComponent } from "../../components/leads/leads.component";
import { NotificationSettingsComponent } from "../../components/notification-settings/notification-settings.component";
import { PushNotificationsComponent } from "../../components/push-notifications/push-notifications.component";
import { AppNotificationsComponent } from "../../components/app-notifications/app-notifications.component";
import { ShippingManagerComponent } from "../../components/shipping/shipping-manager.component";
import { SiteConfigurationComponent } from "../../components/site-configuration/site-configuration.component";
import { CredentialsComponent } from "../../components/credentials/credentials.component";
import { LocationsComponent } from "../../components/locations/locations.component";
import { BlogsComponent } from "../../components/blogs/blogs.component";
export const routing: Routes = [
    { path: 'ai-settings', loadComponent: () => import('../../components/ai-settings/ai-settings.component').then(m => m.AiSettingsComponent) },
    { path: 'fonts', loadComponent: () => import('../../components/fonts/fonts.component').then(m => m.FontsComponent) },
    {
        path: '',
        redirectTo: '',
        pathMatch: "full"
    },{
        path: '',
        component: DashboardComponent
    },{
        path: 'dashboard',
        component: DashboardComponent
    },{
        path: 'users',
        component: UsersComponent
    },{
        path: 'roles',
        component: RolesComponent
    },{
        path: 'pages',
        component: PagesComponent
    },{
        path: 'page-categories',
        component: PageCategoriesComponent
    },{
        path: 'tickets',
        component: TicketsComponent
    },{
        path: 'tickets/:id',
        component: TicketChatComponent
    },{
        path: 'coupons',
        component: CouponsComponent
    },{
        path: 'theme-category',
        component: ThemeCategoryComponent
    },{
        path: 'templates',
        component: TemplatesComponent
    },{
        path: 'blogs',
        component: BlogsComponent
    },{
        path: 'packages',
        component: PackagesComponent
    },{
        path: 'stores',
        component: StoresComponent
    },{
        path: 'industries',
        component: IndustriesComponent
    },{
        path: 'contact-leads',
        component: ContactLeadsComponent
    },{
        path: 'store-users',
        component: StoreUsersComponent
    },{
        path: 'policies',
        component: PoliciesComponent
    },{
        path: 'transactions',
        component: TransactionsComponent
    },    {
        path: 'payment-setting',
        component: PaymentSettingComponent
    },{
        path: 'notification-settings',
        component: NotificationSettingsComponent
    },{
        path: 'push-notifications',
        component: PushNotificationsComponent
    },{
        path: 'app-notifications',
        component: AppNotificationsComponent
    },{
        path: 'lead-dashboard',
        component: LeadDashboardComponent
    },{
        path: 'leads',
        component: LeadsComponent
    },    {
        path: 'customers-directory',
        component: CustomersDirectoryComponent
    },{
        path: 'shipping',
        component: ShippingManagerComponent
    },{
        path: 'locations',
        component: LocationsComponent
    },{
        path: 'site-configuration',
        component: SiteConfigurationComponent
    },{
        path: 'credentials',
        component: CredentialsComponent
    },{
        path:'billing-settings',
        loadComponent:()=>import('../../components/billing-settings/billing-settings.component').then(m=>m.BillingSettingsComponent)
    },{
        path: 'store-apps',
        loadComponent: () => import('../../components/store-apps/store-apps.component').then(m => m.StoreAppsComponent)
    },{
        path: '**',
        component: DashboardComponent
    },
]
