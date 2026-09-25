import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';
import { SharedService } from '../../shared/services/shared.service';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { BoxViewSkeletonComponent } from '../../shared/components/box-view-skeleton/box-view-skeleton.component';
import { BtnLoadingDirective } from '../../shared/directives/btn-loading.directive';
import { actionKey, isActionLoading } from '../../shared/utils/action-loading.util';
import { LocationsService } from './locations.service';

type LocLevel = 'countries' | 'states' | 'cities';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    BoxViewSkeletonComponent,
    BtnLoadingDirective,
  ],
  templateUrl: './locations.component.html',
  styleUrl: './locations.component.scss',
})
export class LocationsComponent implements OnInit {
  level: LocLevel = 'countries';

  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];

  selectedCountry: any = null;
  selectedState: any = null;

  searchTxt = '';
  citiesPage = 1;
  citiesLimit = 100;
  citiesTotal = 0;

  isLoading = false;
  isSeeding = false;
  isSaving = false;
  btnLoading: string | number | null = null;
  isBtnLoading = (action: string, id?: string | number | null) =>
    isActionLoading(this.btnLoading, action, id);

  // inline form
  showForm = false;
  formMode: 'add' | 'edit' = 'add';
  formEntity: 'country' | 'state' | 'city' = 'country';
  formId: number | null = null;
  formName = '';
  formCode = '';
  formIso2 = '';
  formPhoneCode = '';
  formActive = true;

  constructor(
    public sharedservice: SharedService,
    private locationsService: LocationsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadCountries();
  }

  get breadcrumb(): { label: string; action?: () => void }[] {
    const items: { label: string; action?: () => void }[] = [
      { label: 'Locations', action: () => this.goCountries() },
    ];
    if (this.selectedCountry) {
      items.push({
        label: this.selectedCountry.name,
        action: () => this.openCountry(this.selectedCountry),
      });
    }
    if (this.selectedState) {
      items.push({ label: this.selectedState.name });
    }
    return items;
  }

  goCountries(): void {
    this.level = 'countries';
    this.selectedCountry = null;
    this.selectedState = null;
    this.states = [];
    this.cities = [];
    this.searchTxt = '';
    this.closeForm();
    this.loadCountries();
  }

  openCountry(country: any): void {
    this.selectedCountry = country;
    this.selectedState = null;
    this.cities = [];
    this.level = 'states';
    this.searchTxt = '';
    this.closeForm();
    this.loadStates();
  }

  openState(state: any): void {
    this.selectedState = state;
    this.level = 'cities';
    this.searchTxt = '';
    this.citiesPage = 1;
    this.closeForm();
    this.loadCities();
  }

  loadCountries(): void {
    this.isLoading = true;
    this.locationsService
      .overview()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          this.countries = res?.data || [];
        },
        error: () => this.sharedservice.showAlert(2, 'Failed to load countries'),
      });
  }

  loadStates(): void {
    if (!this.selectedCountry?.id) return;
    this.isLoading = true;
    this.locationsService
      .getStates(this.selectedCountry.id, this.searchTxt.trim())
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          this.states = res?.data || [];
        },
        error: () => this.sharedservice.showAlert(2, 'Failed to load states'),
      });
  }

  loadCities(): void {
    if (!this.selectedState?.id) return;
    this.isLoading = true;
    this.locationsService
      .getCities(this.selectedState.id, this.searchTxt.trim(), this.citiesPage, this.citiesLimit)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          this.cities = res?.data || [];
          this.citiesTotal = res?.totalCount || 0;
        },
        error: () => this.sharedservice.showAlert(2, 'Failed to load cities'),
      });
  }

  onSearch(): void {
    this.searchTxt = this.searchTxt.trim();
    if (this.level === 'states') this.loadStates();
    if (this.level === 'cities') {
      this.citiesPage = 1;
      this.loadCities();
    }
  }

  onCitiesPage(page: number): void {
    this.citiesPage = page;
    this.loadCities();
  }

  openAdd(): void {
    this.formMode = 'add';
    this.formId = null;
    this.formName = '';
    this.formCode = '';
    this.formIso2 = this.level === 'countries' ? '' : '';
    this.formPhoneCode = '';
    this.formActive = true;
    this.formEntity =
      this.level === 'countries' ? 'country' : this.level === 'states' ? 'state' : 'city';
    this.showForm = true;
  }

  openEdit(row: any): void {
    this.formMode = 'edit';
    this.formId = row.id;
    this.formName = row.name || '';
    this.formCode = row.code || '';
    this.formIso2 = row.iso2 || '';
    this.formPhoneCode = row.phoneCode || '';
    this.formActive = row.isActive !== 0 && row.isActive !== false;
    this.formEntity =
      this.level === 'countries' ? 'country' : this.level === 'states' ? 'state' : 'city';
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.isSaving = false;
  }

  saveForm(): void {
    const name = this.formName.trim();
    if (!name) {
      this.sharedservice.showAlert(2, 'Name is required');
      return;
    }
    this.isSaving = true;

    let req$;
    if (this.formEntity === 'country') {
      const body = {
        name,
        iso2: this.formIso2.trim(),
        phoneCode: this.formPhoneCode.trim(),
        isActive: this.formActive ? 1 : 0,
      };
      req$ =
        this.formMode === 'edit' && this.formId
          ? this.locationsService.updateCountry(this.formId, body)
          : this.locationsService.createCountry(body);
    } else if (this.formEntity === 'state') {
      const body = {
        countryId: this.selectedCountry?.id,
        name,
        code: this.formCode.trim(),
        isActive: this.formActive ? 1 : 0,
      };
      req$ =
        this.formMode === 'edit' && this.formId
          ? this.locationsService.updateState(this.formId, body)
          : this.locationsService.createState(body);
    } else {
      const body = {
        stateId: this.selectedState?.id,
        name,
        isActive: this.formActive ? 1 : 0,
      };
      req$ =
        this.formMode === 'edit' && this.formId
          ? this.locationsService.updateCity(this.formId, body)
          : this.locationsService.createCity(body);
    }

    req$.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, this.formMode === 'edit' ? 'Updated' : 'Added');
        this.closeForm();
        if (this.level === 'countries') this.loadCountries();
        if (this.level === 'states') this.loadStates();
        if (this.level === 'cities') this.loadCities();
      },
      error: (err) => {
        this.sharedservice.showAlert(2, err?.error?.error || 'Something went wrong');
      },
    });
  }

  deleteRow(row: any): void {
    const modalRef = this.modalService.open(DeleteConfirmationComponent, {
      size: 'md',
      centered: true,
    });
    modalRef.result.then((ok) => {
      if (!ok) return;
      this.btnLoading = actionKey('delete', row.id);
      let req$;
      if (this.level === 'countries') req$ = this.locationsService.deleteCountry(row.id);
      else if (this.level === 'states') req$ = this.locationsService.deleteState(row.id);
      else req$ = this.locationsService.deleteCity(row.id);

      req$.pipe(finalize(() => (this.btnLoading = null))).subscribe({
        next: () => {
          this.sharedservice.showAlert(1, 'Deleted');
          if (this.level === 'countries') this.loadCountries();
          if (this.level === 'states') this.loadStates();
          if (this.level === 'cities') this.loadCities();
        },
        error: (err) => {
          this.sharedservice.showAlert(2, err?.error?.error || 'Delete failed');
        },
      });
    });
  }

  reseedIndia(): void {
    if (this.isSeeding) return;
    this.isSeeding = true;
    this.locationsService
      .reseedIndia()
      .pipe(finalize(() => (this.isSeeding = false)))
      .subscribe({
        next: (res) => {
          this.sharedservice.showAlert(1, 'India locations synced');
          this.goCountries();
          if (res?.data && !res.data.skipped) {
            // noop — overview reload via goCountries
          }
        },
        error: (err) => {
          this.sharedservice.showAlert(2, err?.error?.error || 'Reseed failed');
        },
      });
  }

  get addLabel(): string {
    if (this.level === 'countries') return 'Add country';
    if (this.level === 'states') return 'Add state';
    return 'Add city';
  }

  get listTitle(): string {
    if (this.level === 'countries') return 'Countries';
    if (this.level === 'states') return `States · ${this.selectedCountry?.name || ''}`;
    return `Cities · ${this.selectedState?.name || ''}`;
  }

  Math = Math;
}
