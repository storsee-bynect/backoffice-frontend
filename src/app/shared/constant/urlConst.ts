import { environment } from "../environment/environment";

export let urlConstant: ReturnType<typeof buildUrlConstant>;

function buildUrlConstant() {
  const base = environment.APIUrl;
  return {
    LoginAPI: {
      loginAdministrator: base + 'users/loginUser',
      loginStoreadmin: base + 'storeadmin/loginStoreadmin',
    },
    DashboardAPI: {
      superAdminDashboard: base + 'dashboard/superAdminDashboard',
      leadsDashboard: base + 'dashboard/leadsDashboard',
      storeDashboard: base + 'dashboard/storeDashboard/',
    },
    SiteConfigAPI: {
      getSiteConfig: base + 'siteconfig/getSiteconfig',
      updateSiteConfig: base + 'siteconfig/updateSiteconfig/1',
    },
    PaymentSettingAPI: {
      getPaymentSetting: base + 'paymentsetting/getPaymentsetting',
      updatePaymentSetting: base + 'paymentsetting/updatePaymentsetting/1',
    },
    PoliciesAPI: {
      getPolicies: base + 'policies/getPolicies',
      updatePolicies: base + 'policies/updatePolicies/1',
    },
    PushAPI: {
      settings: base + 'push/settings',
      generateVapidKeys: base + 'push/settings/generate-vapid-keys',
      vapidPublicKey: base + 'push/vapid-public-key',
      subscribe: base + 'push/subscribe',
      unsubscribe: base + 'push/unsubscribe',
      preference: base + 'push/preference',
    },
    PushCampaignsAPI: {
      getAllByPage: base + 'push-campaigns',
      create: base + 'push-campaigns',
      getById: base + 'push-campaigns/',
      update: base + 'push-campaigns/',
      delete: base + 'push-campaigns/',
      sendNow: base + 'push-campaigns/',
      test: base + 'push-campaigns/',
      report: base + 'push-campaigns/',
    },
    AppPushAPI: {
      settings: base + 'app-push/settings',
      createKey: base + 'app-push/settings/keys',
      updateKey: base + 'app-push/settings/keys/',
      updateKeyStatus: base + 'app-push/settings/keys/',
      deleteKey: base + 'app-push/settings/keys/',
      testKey: base + 'app-push/settings/keys/',
      register: base + 'app-push/register',
      unregister: base + 'app-push/unregister',
      preference: base + 'app-push/preference',
    },
    AppPushCampaignsAPI: {
      getAllByPage: base + 'app-push-campaigns',
      create: base + 'app-push-campaigns',
      getById: base + 'app-push-campaigns/',
      update: base + 'app-push-campaigns/',
      delete: base + 'app-push-campaigns/',
      sendNow: base + 'app-push-campaigns/',
      test: base + 'app-push-campaigns/',
      report: base + 'app-push-campaigns/',
    },
    PagesAPI: {
      getPages: base + 'pages/getAllPages',
      getAllPagesByPage: base + 'pages/getAllPagesByPage',
      addPages: base + 'pages/createPage',
      updatePages: base + 'pages/updatePage/',
      deletePages: base + 'pages/deletePage/',
    },
    PageCategorysAPI: {
      getPageCategorysAPIs: base + 'pagescategory/getAllPagesCategory',
      getAllPageCategorysByPage: base + 'pagescategory/getAllPageCategorysByPage',
      addPageCategorysAPIs: base + 'pagescategory/createPagesCategory',
      updatePageCategorysAPIs: base + 'pagescategory/updatePagesCategory/',
      deletePageCategorysAPIs: base + 'pagescategory/deletePagesCategory/',
    },
    RolesAPI: {
      getRoles: base + 'roles/getAllRoles',
      addRoles: base + 'roles/createRole',
      updateRoles: base + 'roles/updateRole/',
      deleteRoles: base + 'roles/deleteRole/',
    },
    CouponsAPI: {
      getCoupons: base + 'coupon/getAllCoupons',
      getAllCouponsByPage: base + 'coupon/getAllCouponsByPage',
      addCoupon: base + 'coupon/createCoupon',
      updateCoupon: base + 'coupon/updateCoupon/',
      deleteCoupon: base + 'coupon/deleteCoupon/',
    },
    PackagesAPI: {
      getPackages: base + 'package/getAllPackages',
      getAllPackagesByPage: base + 'package/getAllPackagesByPage',
      addPackage: base + 'package/createPackage',
      updatePackage: base + 'package/updatePackage/',
      deletePackage: base + 'package/deletePackage/',
    },
    StoresAPI: {
      getStores: base + 'store/getAllStores',
      getAllStoresByPage: base + 'store/getAllStoresByPage',
      getStoreById: base + 'store/getStoreById',
      checkStoreSlug: base + 'store/checkStoreSlug',
      addStore: base + 'store/createStore',
      updateStore: base + 'store/updateStore/',
      updateStoreLimits: base + 'store/updateStoreLimits/',
      updateStoreSettings: base + 'store/updateStoreSettings/',
      deleteStore: base + 'store/deleteStore/',
      renewStorePlan: base + 'store/renew-plan/',
    },
    TransactionsAPI: {
      getTransactions: base + 'transaction/getAllTransactions',
      getAllTransactionsByPage: base + 'transaction/getAllTransactionsByPage',
      getTransactionByStoreId: base + 'transaction/getTransactionByStoreId',
      addTransaction: base + 'transaction/createTransaction',
      updateTransaction: base + 'transaction/updateTransaction/',
      deleteTransaction: base + 'transaction/deleteTransaction/',
    },
    ThemeCategorysAPI: {
      getThemeCategorys: base + 'themecategory/getAllThemeCategorys',
      getAllThemecategorysByPage: base + 'themecategory/getAllThemecategorysByPage',
      addThemeCategory: base + 'themecategory/createThemeCategory',
      updateThemeCategory: base + 'themecategory/updateThemeCategory/',
      deleteThemeCategory: base + 'themecategory/deleteThemeCategory/',
    },
    ContactleadsAPI: {
      getContactleads: base + 'contactlead/getAllContactleads',
      getAllContactleadsByPage: base + 'contactlead/getAllContactleadsByPage',
      addContactlead: base + 'contactlead/createContactlead',
      updateContactlead: base + 'contactlead/updateContactlead/',
      deleteContactlead: base + 'contactlead/deleteContactlead/',
    },
    LeadsAPI: {
      getLeads: base + 'leads/getAllLeads',
      getAllLeadsByPage: base + 'leads/getAllLeadsByPage',
      getLeadsByStatusByPage: base + 'leads/getLeadsByStatusByPage',
      addLead: base + 'leads/createLead',
      updateLead: base + 'leads/updateLead/',
      deleteLead: base + 'leads/deleteLead/',
    },
    TemplatesAPI: {
      getTemplates: base + 'template/getAllTemplates',
      getAllTemplatesByPage: base + 'template/getAllTemplatesByPage',
      getTemplateById: base + 'template/getTemplateById',
      addTemplate: base + 'template/createTemplate',
      updateTemplate: base + 'template/updateTemplate/',
      deleteTemplate: base + 'template/deleteTemplate/',
    },
    PermissionsAPI: {
      getPermissionsByRole: base + 'permissions/getPermissionsByRole/',
      rolePermissionUpdate: base + 'permissions/updatePermissionsByRole/',
      addRoles: base + 'roles/createRole',
      updateRoles: base + 'roles/updateRole/',
      deleteRoles: base + 'roles/deleteRole/',
    },
    UsersAPI: {
      getUsers: base + 'users/getAllUsers',
      getAllUsersByPage: base + 'users/getAllUsersByPage',
      addUser: base + 'users/createUser',
      updateUser: base + 'users/updateUser/',
      updateUserStatus: base + 'users/updateUserStatus/',
      deleteUser: base + 'users/deleteUser/',
    },
    TicketsAPI: {
      getTickets: base + 'tickets/getAllTickets',
      getAllTicketsByPage: base + 'tickets/getAllTicketsByPage',
      getTicketsByCustomerIdByPage: base + 'tickets/getTicketsByCustomerIdByPage',
      addTicket: base + 'tickets/createTicket',
      getTicket: base + 'tickets/getTicket/',
      sendMessage: base + 'tickets/',
      closeTicket: base + 'tickets/',
    },
    StoreusersAPI: {
      getStoreusers: base + 'storeadmin/getAllStoreadmins',
      getAllStoreadminsByPage: base + 'storeadmin/getAllStoreadminsByPage',
      getStoreusersByStoreId: base + 'storeadmin/getStoreAdminsByStoreId/',
      addStoreuser: base + 'storeadmin/createStoreadmin',
      updateStoreuser: base + 'storeadmin/updateStoreadmin/',
      deleteStoreuser: base + 'storeadmin/deleteStoreadmin/',
    },
    FilesAPI: {
      fileUpload: base + 'file/upload',
      deleteFile: base + 'file/deleteFile/',
      getFoldersByPath: base + 'file/getFoldersByPath',
      getFilesByPath: base + 'file/getFilesByPath',
    },
    ShippingAPI: {
      adminBase: base + 'shipping/admin/',
    },
  };
}

export function rebuildUrlConstant() {
  urlConstant = buildUrlConstant();
}

// Initial build (before config loads — urls will rebuild after ConfigService.load())
rebuildUrlConstant();
