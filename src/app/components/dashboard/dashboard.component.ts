import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { DashboardService } from './dashboard.service';
import { SharedService } from '../../shared/services/shared.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';

export type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  fill: ApexFill;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  colors: string[];
};

/** @deprecated Prefer LineChartOptions — kept for lead-dashboard compatibility */
export type ChartOptions = LineChartOptions;

export type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  colors: string[];
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  dashboardData: any;
  isReloadLoading = false;
  showCharts = false;

  revenueChartOptions: Partial<LineChartOptions> | null = null;
  storesChartOptions: Partial<LineChartOptions> | null = null;
  planMixChartOptions: Partial<DonutChartOptions> | null = null;

  constructor(
    public sharedservice: SharedService,
    private dashboardservice: DashboardService
  ) {}

  ngOnInit(): void {
    this.sharedservice.givePermissionByUrl('/dashboard');
    this.loadDashboard();
  }

  n(key: string): number {
    return Number(this.dashboardData?.[key] || 0);
  }

  money(key: string): string {
    const val = this.n(key);
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  setupRate(): string {
    const total = this.n('totalStores');
    if (!total) return '0%';
    return `${Math.round((this.n('setupComplete') / total) * 100)}%`;
  }

  loadDashboard(refresh = false): void {
    if (this.isReloadLoading) return;
    if (refresh) this.isReloadLoading = true;

    this.dashboardservice
      .superAdminDashboard()
      .pipe(finalize(() => (this.isReloadLoading = false)))
      .subscribe({
        next: (res: any) => {
          this.dashboardData = res?.data?.[0] ?? null;
          this.buildCharts();
        },
        error: () => {
          this.sharedservice.showAlert(2, 'Failed to load dashboard');
        },
      });
  }

  private baseLine(name: string, color: string): Partial<LineChartOptions> {
    return {
      series: [{ name, data: [] }],
      chart: {
        type: 'area',
        height: 260,
        width: '100%',
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit',
      },
      xaxis: {
        type: 'category',
        categories: [],
        labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 400 } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 400 },
          formatter: (val: number) => String(Math.round(val || 0)),
        },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2.5 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      grid: {
        borderColor: '#eef2f7',
        strokeDashArray: 4,
        padding: { left: 8, right: 8 },
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
      },
      tooltip: { theme: 'light' },
      colors: [color],
    };
  }

  private buildCharts() {
    this.showCharts = false;
    const rev = this.dashboardData?.revenueChart;
    const stores = this.dashboardData?.storesChart;
    const mix = Array.isArray(this.dashboardData?.planMix) ? this.dashboardData.planMix : [];

    if (rev?.categories?.length) {
      this.revenueChartOptions = {
        ...this.baseLine('Revenue', '#16a34a'),
        series: [{ name: 'Revenue', data: (rev.revenue || []).map((n: any) => Number(n) || 0) }],
        xaxis: {
          type: 'category',
          categories: rev.categories,
          labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 400 } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
      };
    } else {
      this.revenueChartOptions = null;
    }

    if (stores?.categories?.length) {
      this.storesChartOptions = {
        ...this.baseLine('Stores', '#1b88f8'),
        series: [{ name: 'New stores', data: (stores.stores || []).map((n: any) => Number(n) || 0) }],
        xaxis: {
          type: 'category',
          categories: stores.categories,
          labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 400 } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
      };
    } else {
      this.storesChartOptions = null;
    }

    if (mix.length) {
      this.planMixChartOptions = {
        series: mix.map((m: any) => Number(m.count || 0)),
        chart: { type: 'donut', height: 260, fontFamily: 'inherit' },
        labels: mix.map((m: any) => m.name),
        legend: { position: 'bottom', fontSize: '12px' },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: '68%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Live',
                  formatter: () => String(this.n('livePlans')),
                },
              },
            },
          },
        },
        colors: ['#1b88f8', '#0ea5e9', '#16a34a', '#f59e0b', '#7c3aed', '#ef4444', '#64748b', '#14b8a6'],
        tooltip: { theme: 'light' },
      };
    } else {
      this.planMixChartOptions = null;
    }

    setTimeout(() => {
      this.showCharts = true;
    }, 0);
  }
}
