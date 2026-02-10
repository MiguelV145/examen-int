import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsesoriasApiService } from '../../../core/services/api/asesorias.api';
import { AsesoriaResponse, AsesoriaStatus, UpdateAsesoriaStatusDto } from '../../../core/models/asesorias.models';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-asesorias-recibidas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asesorias-recibidas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesoriasRecibidasprogComponent {
  private asesoriasApi = inject(AsesoriasApiService);
  private toastr = inject(ToastrService);

  loading = signal(false);
  updatingId = signal<number | null>(null);
  asesorias = signal<AsesoriaResponse[]>([]);

  ngOnInit() {
    this.loadAsesorias();
  }

  private loadAsesorias() {
    this.loading.set(true);
    this.asesoriasApi.getAsesoriasRecibidas().subscribe({
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

  updateStatus(id: number, newStatus: string) {
    this.updatingId.set(id);
    const dto: UpdateAsesoriaStatusDto = { status: newStatus as AsesoriaStatus };

    this.asesoriasApi.updateAsesoriaStatus(id, dto).subscribe({
      next: () => {
        this.toastr.success(`Estado actualizado a ${newStatus}`);
        this.updatingId.set(null);
        this.loadAsesorias();
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudo actualizar el estado.'));
        this.updatingId.set(null);
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
