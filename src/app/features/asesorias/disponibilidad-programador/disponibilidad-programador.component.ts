import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AvailabilityApiService } from '../../../core/services/api/availability.api';
import { AvailabilitySlot, CreateAvailabilityDto, DayOfWeek, Modality } from '../../../core/models/availability.models';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-disponibilidad-programador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './disponibilidad-programador.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisponibilidadProgramadorComponent {
  private fb = inject(FormBuilder);
  private availabilityApi = inject(AvailabilityApiService);
  private toastr = inject(ToastrService);

  loading = signal(false);
  loadingSlots = signal(false);
  creatingSlot = signal(false);
  
  slots = signal<AvailabilitySlot[]>([]);
  daysOfWeek = Object.values(DayOfWeek);

  form = this.fb.group({
    dayOfWeek: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    modality: ['VIRTUAL', Validators.required]
  });

  ngOnInit() {
    this.loadSlots();
  }

  private loadSlots() {
    this.loadingSlots.set(true);
    this.availabilityApi.getMySlots().subscribe({
      next: (slots) => {
        this.slots.set(slots);
        this.loadingSlots.set(false);
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudieron cargar los horarios.'));
        this.loadingSlots.set(false);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.creatingSlot.set(true);
    const dto: CreateAvailabilityDto = {
      dayOfWeek: this.form.get('dayOfWeek')?.value as DayOfWeek,
      startTime: this.form.get('startTime')?.value || '',
      endTime: this.form.get('endTime')?.value || '',
      modality: this.form.get('modality')?.value as Modality
    };

    this.availabilityApi.createSlot(dto).subscribe({
      next: (slot) => {
        this.toastr.success('Horario agregado correctamente');
        this.form.reset({ modality: 'VIRTUAL' });
        this.creatingSlot.set(false);
        this.loadSlots();
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudo agregar el horario.'));
        this.creatingSlot.set(false);
      }
    });
  }

  toggleSlot(slot: AvailabilitySlot) {
    this.availabilityApi.updateSlot(slot.id, { enabled: !slot.enabled }).subscribe({
      next: () => {
        this.toastr.success('Estado actualizado');
        this.loadSlots();
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudo actualizar el estado.'));
      }
    });
  }

  deleteSlot(id: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario?')) return;

    this.availabilityApi.deleteSlot(id).subscribe({
      next: () => {
        this.toastr.success('Horario eliminado');
        this.loadSlots();
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudo eliminar el horario.'));
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
