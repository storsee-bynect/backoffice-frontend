export class PackageReqModel {
    slug: string = '';
    tierSlug: string = 'storsee';
    billingCycle: string = '1m';
    billingLabel: string = '1 Month';
    name: string;
    tagline: string = '';
    description: string = '';
    amount: number;
    duration: number;
    productLimit: number;
    maxOrders: number = 0;
    trialDays: number = 0;
    color: string = '#1d68f1';
    isPopular: boolean = false;
    isRecommended: boolean = false;
    isDefault: boolean = false;
    isActive: boolean = true;
    sortOrder: number = 0;
    benefits: string;
    features: string = '{}';
}
