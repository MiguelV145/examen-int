import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsesoriasApiService } from '../../../core/services/api/asesorias.api';
import { AsesoriaResponse, AsesoriaStatus } from '../../../core/models/asesorias.models';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-mis-asesorias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-asesorias.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisAsesoriasComponent {
  private asesoriasApi = inject(AsesoriasApiService);
  private toastr = inject(ToastrService);

  loading = signal(false);
  asesorias = signal<AsesoriaResponse[]>([]);

  ngOnInit() {
    this.loadAsesorias();
  }

  private loadAsesorias() {
    this.loading.set(true);
    this.asesoriasApi.getMisAsesoriasAsClient().subscribe({
      next: (asesorias) => {
        this.asesorias.set(asesorias);
        this.loading.set(false);
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudieron cargar las asesorías.'));
        this.loading.set(false);
      }
    });
  }

  cancelAsesoria(id: number) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta asesoría?')) return;

    this.asesoriasApi.cancelAsesoria(id).subscribe({
      next: () => {
        this.toastr.success('Asesoría cancelada');
        this.loadAsesorias();
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudo cancelar la asesoría.'));
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

  getStatusBadgeClass(status: AsesoriaStatus): string {
    const classes: Record<string, string> = {
      'PENDIENTE': 'badge-warning',
      'CONFIRMADA': 'badge-info',
      'EN_CURSO': 'badge-primary',
      'COMPLETADA': 'badge-success',
      'CANCELADA': 'badge-error',
      'RECHAZADA': 'badge-error'
    };
    return classes[status] || 'badge-default';
  }

  formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}
