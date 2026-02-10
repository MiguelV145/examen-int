/**
 * Modelos para asesorías
 */

import { User } from './auth.models';

export enum AsesoriaStatus {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  EN_CURSO = 'EN_CURSO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
  RECHAZADA = 'RECHAZADA'
}

export enum Modality {
  PRESENCIAL = 'PRESENCIAL',
  VIRTUAL = 'VIRTUAL',
  HIBRIDA = 'HIBRIDA'
}

export interface Programmer extends User {
  specialty?: string;
  description?: string;
  photoURL?: string;
  displayName?: string;
}

export interface Asesoria {
  id: number;
  startAt: string; // ISO 8601 datetime
  durationMinutes: number;
  modality: Modality;
  status: AsesoriaStatus;
  topic?: string;
  notes?: string;
  
  programmer: Programmer;
  programmerId: number;
  
  client: User;
  clientId: number;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAsesoriaDto {
  programmerId: number;
  startAt: string; // ISO 8601
  durationMinutes: number;
  modality: Modality;
  topic?: string;
  notes?: string;
}

export interface UpdateAsesoriaStatusDto {
  status: AsesoriaStatus;
}

export interface AsesoriaResponse {
  id: number;
  startAt: string;
  durationMinutes: number;
  modality: Modality;
  status: AsesoriaStatus;
  topic?: string;
  notes?: string;
  programmer: {
    id: number;
    username: string;
    email: string;
    displayName?: string;
  };
  client: {
    id: number;
    username: string;
    email: string;
  };
}
