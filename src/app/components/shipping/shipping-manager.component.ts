import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { SharedService } from '../../shared/services/shared.service';
import { ShippingService } from './shipping.service';

type TabKey =
  | 'overview'
  | 'providers'
  | 'rules'
  | 'calculator'
  | 'shipments'
  | 'analytics'
  | 'logs'
  | 'webhooks'
  | 'remittances';

const SHIPROCKET_LOGO =
  'https://sr-website-01.shiprocket.in/sr-website/shiprocket_logo-1-TWLqUy.svg';

const PLATFORM_PROVIDER = 'shiprocket';

@Component({
  selector: 'app-shipping-manager',
  templateUrl: './shipping-manager.component.html',
  styleUrl: './shipping-manager.component.scss',
})
export class ShippingManagerComponent implements OnInit {
  readonly shiprocketLogo = SHIPROCKET_LOGO;

  tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
    { key: 'providers', label: 'Providers', icon: 'fa-truck-fast' },
    { key: 'rules', label: 'Rules & Margin', icon: 'fa-sliders' },
    { key: 'calculator', label: 'Rate calculator', icon: 'fa-calculator' },
    { key: 'shipments', label: 'Shipments', icon: 'fa-boxes-stacked' },
    { key: 'analytics', label: 'Analytics', icon: 'fa-chart-line' },
    { key: 'logs', label: 'Logs', icon: 'fa-terminal' },
    { key: 'webhooks', label: 'Webhooks', icon: 'fa-satellite-dish' },
    { key: 'remittances', label: 'COD remittance', icon: 'fa-money-bill-transfer' },
  ];

  activeTab: TabKey = 'overview';
  isLoading = false;
  isSavingRule = false;
  isSavingMargin = false;
  overview: any = { stats: {} };
  loadError = '';
  providers: any[] = [];
  rules: any[] = [];
  marginRules: any[] = [];
  shipments: any[] = [];
  analytics: any = null;
  logs: any[] = [];
  webhooks: any[] = [];
  remittances: any[] = [];

  rateForm = {
    pickupPincode: '',
    destinationPincode: '',
    weightKg: 0.5,
    lengthCm: 10,
    widthCm: 10,
    heightCm: 10,
    orderValue: 500,
    paymentMode: 'prepaid',
  };
  rateResults: any[] = [];
  isCalculating = false;

  credForms: Record<number, { email: string; password: string }> = {};
  showPassword: Record<number, boolean> = {};
  testingId: number | null = null;
  savingCredId: number | null = null;

  marginForm = {
    id: null as number | null,
    name: '',
    priority: 100,
    active: true,
    scope: 'global',
    storeId: null as number | null,
    pricingType: 'fixed_add',
    amount: 15,
    percent: 10,
    merchantPrice: 0,
    paymentMode: '',
    minMonthlyShipments: null as number | null,
    maxMonthlyShipments: null as number | null,
  };

  routingForm = {
    id: null as number | null,
    name: '',
    priority: 100,
    active: true,
    paymentMode: '',
    minWeightKg: null as number | null,
    maxWeightKg: null as number | null,
    minOrderValue: null as number | null,
    forceProvider: PLATFORM_PROVIDER,
  };

  shipmentFilter = '';
  logFilter = '';

  constructor(
    public sharedservice: SharedService,
    private shipping: ShippingService
  ) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  get storseeLogo(): string {
    return this.sharedservice.getSiteLogoLight('assets/img/transparent.png');
  }

  get shiprocket(): any | null {
    return this.providers[0] || null;
  }

  get filteredShipments(): any[] {
    const q = this.shipmentFilter.trim().toLowerCase();
    if (!q) return this.shipments;
    return this.shipments.filter((s) =>
      [s.id, s.orderId, s.storeId, s.awb, s.status].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }

  get filteredLogs(): any[] {
    const q = this.logFilter.trim().toLowerCase();
    if (!q) return this.logs;
    return this.logs.filter((l) =>
      [l.providerCode, l.endpoint, l.httpStatus, l.errorMessage].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }

  get deliveryRate(): number {
    const total = Number(this.analytics?.totalShipments || this.overview?.stats?.totalShipments || 0);
    const delivered = Number(this.analytics?.delivered || this.overview?.stats?.delivered || 0);
    if (!total) return 0;
    return Math.round((delivered / total) * 1000) / 10;
  }

  onlyShiprocket(list: any[]): any[] {
    return (list || []).filter((p) => String(p.code || '').toLowerCase() === PLATFORM_PROVIDER);
  }

  credForm(id: number): { email: string; password: string } {
    if (!this.credForms[id]) this.credForms[id] = { email: '', password: '' };
    return this.credForms[id];
  }

  setTab(tab: TabKey) {
    this.activeTab = tab;
    if (tab === 'providers') this.loadProviders();
    if (tab === 'rules') this.loadRules();
    if (tab === 'calculator') {
      /* keep form */
    }
    if (tab === 'shipments') this.loadShipments();
    if (tab === 'analytics') this.loadAnalytics();
    if (tab === 'logs') this.loadLogs();
    if (tab === 'webhooks') this.loadWebhooks();
    if (tab === 'remittances') this.loadRemittances();
  }

  loadOverview() {
    this.isLoading = true;
    this.loadError = '';
    this.shipping.overview().pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (res) => {
        const providers = this.onlyShiprocket(res?.data?.providers || []);
        this.overview = { stats: res?.data?.stats || {}, providers };
        this.providers = providers;
        this.initCredForms(providers);
      },
      error: (e) => {
        this.loadError = e.error?.error || 'Failed to load shipping overview';
        this.overview = { stats: {} };
        this.sharedservice.showAlert(2, this.loadError);
        this.loadProviders();
      },
    });
  }

  private initCredForms(list: any[]) {
    for (const p of list) {
      if (!this.credForms[p.id]) this.credForms[p.id] = { email: '', password: '' };
    }
  }

  loadProviders() {
    this.shipping.providers().subscribe({
      next: (res) => {
        this.providers = this.onlyShiprocket(res?.data || []);
        this.initCredForms(this.providers);
      },
      error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Failed to load providers'),
    });
  }

  loadRules() {
    this.shipping.rules().subscribe({ next: (res) => (this.rules = res?.data || []) });
    this.shipping.marginRules().subscribe({ next: (res) => (this.marginRules = res?.data || []) });
  }

  loadShipments() {
    this.shipping.shipments({ limit: 100 }).subscribe({
      next: (res) => (this.shipments = res?.data || []),
      error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Failed to load shipments'),
    });
  }

  loadAnalytics() {
    this.shipping.analytics().subscribe({
      next: (res) => (this.analytics = res?.data || {}),
      error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Failed to load analytics'),
    });
  }

  loadLogs() {
    this.shipping.logs().subscribe({
      next: (res) => (this.logs = res?.data || []),
      error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Failed to load logs'),
    });
  }

  loadWebhooks() {
    this.shipping.webhooks().subscribe({
      next: (res) => (this.webhooks = res?.data || []),
      error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Failed to load webhooks'),
    });
  }

  loadRemittances() {
    this.shipping.remittances().subscribe({
      next: (res) => (this.remittances = res?.data || []),
      error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Failed to load remittances'),
    });
  }

  toggleProvider(p: any) {
    this.shipping.updateProvider(p.id, { enabled: p.enabled ? 0 : 1 }).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, p.enabled ? 'Shiprocket disabled' : 'Shiprocket enabled');
        this.loadProviders();
        if (this.activeTab === 'overview') this.loadOverview();
      },
      error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Update failed'),
    });
  }

  setEnvironment(p: any, environment: string) {
    this.shipping.updateProvider(p.id, { environment }).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, `Environment set to ${environment}`);
        this.loadProviders();
      },
      error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Update failed'),
    });
  }

  saveCredentials(p: any) {
    const form = this.credForm(p.id);
    const email = String(form.email || '').trim();
    const password = String(form.password || '').trim();
    if (!email || !password) {
      this.sharedservice.showAlert(2, 'Enter Shiprocket API email and password');
      return;
    }
    this.savingCredId = p.id;
    this.shipping
      .saveCredentials(p.id, { email, password })
      .pipe(finalize(() => (this.savingCredId = null)))
      .subscribe({
        next: () => {
          this.sharedservice.showAlert(1, 'Credentials saved — Shiprocket enabled');
          form.password = '';
          this.loadProviders();
          this.loadOverview();
        },
        error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Save failed'),
      });
  }

  testConnection(p: any) {
    this.testingId = p.id;
    this.shipping
      .testProvider(p.id)
      .pipe(finalize(() => (this.testingId = null)))
      .subscribe({
        next: () => {
          this.sharedservice.showAlert(1, 'Shiprocket connection successful');
          this.loadProviders();
          this.loadOverview();
        },
        error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Test failed'),
      });
  }

  calculateRates() {
    const pickup = String(this.rateForm.pickupPincode || '').trim();
    const dest = String(this.rateForm.destinationPincode || '').trim();
    if (!/^\d{6}$/.test(pickup) || !/^\d{6}$/.test(dest)) {
      this.sharedservice.showAlert(2, 'Enter valid 6-digit pickup and destination pincodes');
      return;
    }
    this.isCalculating = true;
    this.shipping
      .calculateRates({ ...this.rateForm, pickupPincode: pickup, destinationPincode: dest })
      .pipe(finalize(() => (this.isCalculating = false)))
      .subscribe({
        next: (res) => {
          this.rateResults = (res?.data || []).filter(
            (r: any) => String(r.provider || '').toLowerCase() === PLATFORM_PROVIDER || !r.provider
          );
          if (!this.rateResults.length && (res?.data || []).length) {
            this.rateResults = res.data;
          }
        },
        error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Rate calculation failed'),
      });
  }

  resetMarginForm() {
    this.marginForm = {
      id: null,
      name: '',
      priority: 100,
      active: true,
      scope: 'global',
      storeId: null,
      pricingType: 'fixed_add',
      amount: 15,
      percent: 10,
      merchantPrice: 0,
      paymentMode: '',
      minMonthlyShipments: null,
      maxMonthlyShipments: null,
    };
  }

  editMargin(r: any) {
    const pricing = r.pricing || r.pricingJson || {};
    const cond = r.conditions || r.conditionsJson || {};
    this.marginForm = {
      id: r.id,
      name: r.name || '',
      priority: Number(r.priority) || 100,
      active: !!r.active,
      scope: r.scope || 'global',
      storeId: r.storeId || null,
      pricingType: pricing.type || 'fixed_add',
      amount: Number(pricing.amount) || 0,
      percent: Number(pricing.percent) || 0,
      merchantPrice: Number(pricing.merchantPrice || pricing.amount) || 0,
      paymentMode: cond.paymentMode || '',
      minMonthlyShipments: cond.minMonthlyShipments ?? null,
      maxMonthlyShipments: cond.maxMonthlyShipments ?? null,
    };
  }

  saveMarginRule() {
    const name = String(this.marginForm.name || '').trim();
    if (!name) {
      this.sharedservice.showAlert(2, 'Margin rule name is required');
      return;
    }
    const pricing: any = { type: this.marginForm.pricingType };
    if (this.marginForm.pricingType === 'fixed_add') pricing.amount = Number(this.marginForm.amount) || 0;
    if (this.marginForm.pricingType === 'percent_add') pricing.percent = Number(this.marginForm.percent) || 0;
    if (this.marginForm.pricingType === 'flat_merchant') {
      pricing.merchantPrice = Number(this.marginForm.merchantPrice) || 0;
      pricing.amount = pricing.merchantPrice;
    }
    const conditions: any = {};
    if (this.marginForm.paymentMode) conditions.paymentMode = this.marginForm.paymentMode;
    if (this.marginForm.minMonthlyShipments != null && this.marginForm.minMonthlyShipments !== ('' as any)) {
      conditions.minMonthlyShipments = Number(this.marginForm.minMonthlyShipments);
    }
    if (this.marginForm.maxMonthlyShipments != null && this.marginForm.maxMonthlyShipments !== ('' as any)) {
      conditions.maxMonthlyShipments = Number(this.marginForm.maxMonthlyShipments);
    }

    const body: any = {
      id: this.marginForm.id || undefined,
      name,
      priority: Number(this.marginForm.priority) || 100,
      active: !!this.marginForm.active,
      scope: this.marginForm.scope,
      storeId: this.marginForm.scope === 'merchant' ? Number(this.marginForm.storeId) || null : null,
      conditions,
      pricing,
    };

    this.isSavingMargin = true;
    this.shipping
      .saveMarginRule(body)
      .pipe(finalize(() => (this.isSavingMargin = false)))
      .subscribe({
        next: () => {
          this.sharedservice.showAlert(1, this.marginForm.id ? 'Margin rule updated' : 'Margin rule created');
          this.resetMarginForm();
          this.loadRules();
        },
        error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Save failed'),
      });
  }

  deleteMargin(r: any) {
    if (!confirm(`Delete margin rule "${r.name}"?`)) return;
    this.shipping.deleteMarginRule(r.id).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, 'Margin rule deleted');
        this.loadRules();
      },
      error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Delete failed'),
    });
  }

  resetRoutingForm() {
    this.routingForm = {
      id: null,
      name: '',
      priority: 100,
      active: true,
      paymentMode: '',
      minWeightKg: null,
      maxWeightKg: null,
      minOrderValue: null,
      forceProvider: PLATFORM_PROVIDER,
    };
  }

  editRouting(r: any) {
    const cond = r.conditions || r.conditionsJson || {};
    const actions = r.actions || r.actionsJson || {};
    this.routingForm = {
      id: r.id,
      name: r.name || '',
      priority: Number(r.priority) || 100,
      active: !!r.active,
      paymentMode: cond.paymentMode || '',
      minWeightKg: cond.minWeightKg ?? null,
      maxWeightKg: cond.maxWeightKg ?? null,
      minOrderValue: cond.minOrderValue ?? null,
      forceProvider: actions.forceProvider || PLATFORM_PROVIDER,
    };
  }

  saveRoutingRule() {
    const name = String(this.routingForm.name || '').trim();
    if (!name) {
      this.sharedservice.showAlert(2, 'Routing rule name is required');
      return;
    }
    const conditions: any = {};
    if (this.routingForm.paymentMode) conditions.paymentMode = this.routingForm.paymentMode;
    if (this.routingForm.minWeightKg != null) conditions.minWeightKg = Number(this.routingForm.minWeightKg);
    if (this.routingForm.maxWeightKg != null) conditions.maxWeightKg = Number(this.routingForm.maxWeightKg);
    if (this.routingForm.minOrderValue != null) conditions.minOrderValue = Number(this.routingForm.minOrderValue);

    const body: any = {
      id: this.routingForm.id || undefined,
      name,
      priority: Number(this.routingForm.priority) || 100,
      active: !!this.routingForm.active,
      conditions,
      actions: { forceProvider: this.routingForm.forceProvider || PLATFORM_PROVIDER },
    };

    this.isSavingRule = true;
    this.shipping
      .saveRule(body)
      .pipe(finalize(() => (this.isSavingRule = false)))
      .subscribe({
        next: () => {
          this.sharedservice.showAlert(1, this.routingForm.id ? 'Routing rule updated' : 'Routing rule created');
          this.resetRoutingForm();
          this.loadRules();
        },
        error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Save failed'),
      });
  }

  deleteRouting(r: any) {
    if (!confirm(`Delete routing rule "${r.name}"?`)) return;
    this.shipping.deleteRule(r.id).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, 'Routing rule deleted');
        this.loadRules();
      },
      error: (e) => this.sharedservice.showAlert(2, e.error?.error || 'Delete failed'),
    });
  }

  pricingLabel(r: any): string {
    const p = r.pricing || r.pricingJson || {};
    if (p.type === 'percent_add') return `+${p.percent || 0}%`;
    if (p.type === 'flat_merchant') return `Flat ₹${p.merchantPrice || p.amount || 0}`;
    return `+₹${p.amount || 0}`;
  }

  healthClass(status: string): string {
    const s = String(status || 'unknown').toLowerCase();
    if (s === 'healthy') return 'is-healthy';
    if (s.includes('error') || s.includes('fail')) return 'is-bad';
    return 'is-unknown';
  }
}
