export class siteConfigReqModel{
    siteName : string;
    logo : string;
    white_logo : string;
    icon : string;
    mobile : string;
    email : string;
    theme : string = null;
    parentCompany : string;
    storeBaseUrl : string;
    dashboardBaseUrl : string;
    cnameDomain : string;
    version : string;
    
    instagramURL : string;
    facebookURL : string;
    twitterURL : string;
    linkedInURL : string;
    youtubeURL : string;

    enableStoreRegister : boolean;
    enableMaintananceMode : boolean;
}