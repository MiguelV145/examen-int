/**
 * Modelos para disponibilidad de asesorías
 */

export enum DayOfWeek {
  LUNES = 'LUNES',
  MARTES = 'MARTES',
  MIERCOLES = 'MIERCOLES',
  JUEVES = 'JUEVES',
  VIERNES = 'VIERNES',
  SABADO = 'SABADO',
  DOMINGO = 'DOMINGO'
}

export enum Modality {
  PRESENCIAL = 'PRESENCIAL',
  VIRTUAL = 'VIRTUAL',
  HIBRIDA = 'HIBRIDA'
}

export interface AvailabilitySlot {
  id: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  modality: Modality;
  enabled: boolean;
  programmerId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAvailabilityDto {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  modality: Modality;
}

export interface UpdateAvailabilityDto {
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  modality?: Modality;
  enabled?: boolean;
}
