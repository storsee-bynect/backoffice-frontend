export class StoreReqModel{
    industryId: number | null = null;
    name: string;
    email: string;
    type: number = null;
    phone: string;
    countryCode: string = '91';
    sessions: number = 0;
    slug: string;
    selectedTemplate: string = null;
    expireDate: string;
    lastRenew: string;
    isActive: boolean = true;
    activePackageId: number = 0;
    productLimit: number = 0;
    maxOrders: number = 0;
    createStoreLogin: boolean = true;
    adminPassword: string;
    adminName: string;
    ip: string;
}
