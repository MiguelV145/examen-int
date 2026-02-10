import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ReportsApiService } from '../../../core/services/api/reports.api';
import { AdminDashboardData, ReportFilters } from '../../../core/models/reports.models';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-reportes-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reportes-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminReportesDashboardComponent {
  private reportsApi = inject(ReportsApiService);
  private toastr = inject(ToastrService);

  loading = signal(false);
  downloadingReport = signal(false);
  dashboardData = signal<AdminDashboardData | null>(null);

  currentFilters: ReportFilters = {};

  ngOnInit() {
    this.loadDashboard();
  }

  private loadDashboard() {
    this.loading.set(true);
    this.reportsApi.getAdminDashboard(this.currentFilters).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudo cargar el dashboard.'));
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    // Aquí extraerías los valores de los inputs
    this.loadDashboard();
  }

  downloadReport(type: string) {
    this.downloadingReport.set(true);

    let observable;
    let filename = '';

    switch (type) {
      case 'asesorias-pdf':
        observable = this.reportsApi.downloadAsesoriasPdf(this.currentFilters);
        filename = `asesorias-${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      case 'asesorias-xlsx':
        observable = this.reportsApi.downloadAsesoriasXlsx(this.currentFilters);
        filename = `asesorias-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      case 'projects-pdf':
        observable = this.reportsApi.downloadProjectsPdf(this.currentFilters);
        filename = `proyectos-${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      case 'projects-xlsx':
        observable = this.reportsApi.downloadProjectsXlsx(this.currentFilters);
        filename = `proyectos-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      default:
        return;
    }

    observable.subscribe({
      next: (blob) => {
        this.reportsApi.downloadFile(blob, filename);
        this.toastr.success('Descarga completada');
        this.downloadingReport.set(false);
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudo descargar el reporte.'));
        this.downloadingReport.set(false);
      }
    });
  }

  private getErrorMessage(error: any, fallback: string): string {
    const backendMsg = error?.error?.message || error?.error?.details;
    if (backendMsg) return backendMsg;
    if (error?.status) return `Error ${error.status}: ${error.statusText || fallback}`;
    if (error?.message?.includes('Network')) {
      return 'Error de conexion. Verifica tu conexion a internet.';
    }
    return fallback;
  }
}
