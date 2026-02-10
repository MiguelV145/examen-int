import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AsesoriasApiService } from '../../../core/services/api/asesorias.api';
import { AvailabilityApiService } from '../../../core/services/api/availability.api';
import { AuthStoreService } from '../../../core/services/auth/auth-store.service';
import { Modality, AsesoriaStatus } from '../../../core/models/asesorias.models';
import { AvailabilitySlot, DayOfWeek } from '../../../core/models/availability.models';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reservar-asesoria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './reservar-asesoria.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservarAsesoriaComponent {
  private fb = inject(FormBuilder);
  private asesoriasApi = inject(AsesoriasApiService);
  private availabilityApi = inject(AvailabilityApiService);
  private authStore = inject(AuthStoreService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  loading = signal(false);
  programmers = signal<any[]>([]);
  availableSlots = signal<AvailabilitySlot[]>([]);

  selectedProgrammerId: string | number = '';
  selectedModality = 'VIRTUAL';
  selectedSlotId = signal<number | null>(null);
  selectedSlot = signal<AvailabilitySlot | null>(null);
  selectedProgrammerName = computed(() => {
    const prog = this.programmers().find(p => p.id == this.selectedProgrammerId);
    return prog?.displayName || prog?.username || '';
  });

  canSubmit = computed(() => {
    return this.selectedProgrammerId && this.selectedSlotId() !== null && this.reservaForm.valid;
  });

  reservaForm = this.fb.group({
    topic: ['', [Validators.required, Validators.minLength(5)]],
    notes: ['']
  });

  ngOnInit() {
    this.loadProgrammers();
  }

  private loadProgrammers() {
    this.loading.set(true);
    this.asesoriasApi.getProgrammersAvailable().subscribe({
      next: (programmers) => {
        this.programmers.set(programmers);
        this.loading.set(false);
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudieron cargar los programadores.'));
        this.loading.set(false);
      }
    });
  }

  onProgrammerSelected(event: any) {
    this.selectedProgrammerId = event.target.value;
    this.availableSlots.set([]);
    this.selectedSlotId.set(null);
    this.selectedSlot.set(null);
    this.loadAvailableSlots();
  }

  private loadAvailableSlots() {
    if (!this.selectedProgrammerId) return;
    
    this.availabilityApi.getSlotsByProgrammer(Number(this.selectedProgrammerId)).subscribe({
      next: (slots) => {
        // Filtrar slots activos y por modalidad
        const filtered = slots.filter(s => 
          s.enabled && s.modality === this.selectedModality
        );
        this.availableSlots.set(filtered);
      },
      error: (err) => {
        this.toastr.error(this.getErrorMessage(err, 'No se pudieron cargar los horarios disponibles.'));
      }
    });
  }

  onModalitySelected() {
    this.selectedSlotId.set(null);
    this.selectedSlot.set(null);
    this.loadAvailableSlots();
  }

  onSlotSelected(slot: AvailabilitySlot) {
    this.selectedSlotId.set(slot.id);
    this.selectedSlot.set(slot);
  }

  onSubmit() {
    if (!this.canSubmit()) return;

    this.loading.set(true);
    const slot = this.selectedSlot();
    const today = new Date();
    const startAt = this.calculateDateTime(today, slot!.dayOfWeek, slot!.startTime);

        const createDto = {
          programmerId: Number(this.selectedProgrammerId),
          startAt: startAt.toISOString(),
          durationMinutes: 60,
          modality: this.selectedModality as Modality,
          topic: this.reservaForm.get('topic')?.value ?? undefined,
          notes: this.reservaForm.get('notes')?.value ?? undefined
        };

    this.asesoriasApi.createAsesoria(createDto).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.toastr.success('Asesoría reservada correctamente');
        this.router.navigate(['/mis-asesorias']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(this.getErrorMessage(err, 'No se pudo reservar la asesoría.'));
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

  private calculateDateTime(baseDate: Date, dayOfWeek: DayOfWeek, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  getDayName(day: DayOfWeek): string {
    const days: Record<DayOfWeek, string> = {
      [DayOfWeek.LUNES]: 'Lunes',
      [DayOfWeek.MARTES]: 'Martes',
      [DayOfWeek.MIERCOLES]: 'Miércoles',
      [DayOfWeek.JUEVES]: 'Jueves',
      [DayOfWeek.VIERNES]: 'Viernes',
      [DayOfWeek.SABADO]: 'Sábado',
      [DayOfWeek.DOMINGO]: 'Domingo'
    };
    return days[day];
  }
}
