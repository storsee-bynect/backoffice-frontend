import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
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
import { SharedService } from '../../shared/services/shared.service';
import { LeadDashboardService } from './lead-dashboard.service';

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis?: ApexYAxis;
  dataLabels: ApexDataLabels;
  plotOptions?: ApexPlotOptions;
  colors?: string[];
  grid?: ApexGrid;
  stroke?: ApexStroke;
  tooltip?: ApexTooltip;
};

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

const STATUS_LABELS = ['New', 'Contacted', 'Proposal Sent', 'Won', 'On Hold', 'Lost'];
const SOURCE_LABELS = [
  'Cold Calling / Telemarketing',
  'Direct',
  'Email Marketing',
  'Expo / Seminar',
  'Google',
  'Other',
  'Reference',
  'Social Media',
  'Website',
  'Digital Marketing',
];

@Component({
  selector: 'app-lead-dashboard',
  templateUrl: './lead-dashboard.component.html',
  styleUrl: './lead-dashboard.component.scss',
})
export class LeadDashboardComponent implements OnInit {
  dashboardData: any;
  isReloadLoading = false;
  showCharts = false;

  statusWiseLeadChart: Partial<BarChartOptions> | null = null;
  sourceWiseLeadChart: Partial<BarChartOptions> | null = null;
  leadsTrendChart: Partial<LineChartOptions> | null = null;
  statusMixChart: Partial<DonutChartOptions> | null = null;

  readonly statusLabels = STATUS_LABELS;
  readonly sourceLabels = SOURCE_LABELS;

  constructor(
    public sharedservice: SharedService,
    private leaddashboardservice: LeadDashboardService
  ) {}

  ngOnInit(): void {
    this.sharedservice.givePermissionByUrl('/lead-dashboard');
    this.loadDashboard();
  }

  n(key: string): number {
    return Number(this.dashboardData?.[key] || 0);
  }

  statusCount(index: number): number {
    return Number(this.dashboardData?.statusWiseChart?.[index] || 0);
  }

  sourceCount(index: number): number {
    return Number(this.dashboardData?.sourceWiseChart?.[index] || 0);
  }

  statusLabel(status: any): string {
    const i = Number(status) - 1;
    return STATUS_LABELS[i] || String(status || '—');
  }

  sourceLabel(source: any): string {
    const i = Number(source) - 1;
    return SOURCE_LABELS[i] || String(source || '—');
  }

  loadDashboard(refresh = false): void {
    if (this.isReloadLoading) return;
    if (refresh) this.isReloadLoading = true;

    this.leaddashboardservice
      .superAdminDashboard()
      .pipe(finalize(() => (this.isReloadLoading = false)))
      .subscribe({
        next: (res: any) => {
          this.dashboardData = res?.data?.[0] ?? null;
          this.buildCharts();
        },
        error: () => {
          this.sharedservice.showAlert(2, 'Failed to load lead dashboard');
        },
      });
  }

  private buildCharts(): void {
    this.showCharts = false;
    const statusData = (this.dashboardData?.statusWiseChart || []).map((n: any) => Number(n) || 0);
    const sourceData = (this.dashboardData?.sourceWiseChart || []).map((n: any) => Number(n) || 0);
    const trend = this.dashboardData?.leadsChart;

    this.statusWiseLeadChart = {
      series: [{ name: 'Leads', data: statusData }],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          borderRadiusApplication: 'end',
          barHeight: '62%',
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: STATUS_LABELS,
        labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
      },
      colors: ['#1b88f8'],
      grid: {
        borderColor: '#eef2f7',
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      tooltip: { theme: 'light' },
    };

    this.sourceWiseLeadChart = {
      series: [{ name: 'Leads', data: sourceData }],
      chart: {
        type: 'bar',
        height: 360,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          borderRadiusApplication: 'end',
          barHeight: '68%',
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: SOURCE_LABELS,
        labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
      },
      colors: ['#0ea5e9'],
      grid: {
        borderColor: '#eef2f7',
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      tooltip: { theme: 'light' },
    };

    if (trend?.categories?.length) {
      this.leadsTrendChart = {
        series: [{ name: 'New leads', data: (trend.leads || []).map((n: any) => Number(n) || 0) }],
        chart: {
          type: 'area',
          height: 260,
          toolbar: { show: false },
          zoom: { enabled: false },
          fontFamily: 'inherit',
        },
        xaxis: {
          type: 'category',
          categories: trend.categories,
          labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: '#94a3b8', fontSize: '11px' },
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
        },
        tooltip: { theme: 'light' },
        colors: ['#16a34a'],
      };
    } else {
      this.leadsTrendChart = null;
    }

    if (statusData.some((n: number) => n > 0)) {
      this.statusMixChart = {
        series: statusData,
        chart: { type: 'donut', height: 260, fontFamily: 'inherit' },
        labels: STATUS_LABELS,
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
                  label: 'Total',
                  formatter: () => String(this.n('totalLeads')),
                },
              },
            },
          },
        },
        colors: ['#1b88f8', '#f59e0b', '#0ea5e9', '#16a34a', '#94a3b8', '#ef4444'],
        tooltip: { theme: 'light' },
      };
    } else {
      this.statusMixChart = null;
    }

    setTimeout(() => {
      this.showCharts = true;
    }, 0);
  }
}
