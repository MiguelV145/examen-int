/**
 * Modelos para reportes y dashboards
 */

export interface AsesoriasSummaryReport {
  status: string;
  count: number;
}

export interface AsesoriasByProgrammerReport {
  programmerName: string;
  programmerId: number;
  count: number;
}

export interface AsesoriasByDateReport {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface ProjectsByUserReport {
  userId: number;
  userName: string;
  email: string;
  totalProjects: number;
  activeProjects: number;
}

export interface AdminDashboardData {
  totalAsesorias: number;
  totalProgrammers: number;
  totalUsers: number;
  asesoriasBySatus: AsesoriasSummaryReport[];
  asesoriasByProgrammer: AsesoriasByProgrammerReport[];
  asesoriasByDate: AsesoriasByDateReport[];
  projectsByUser: ProjectsByUserReport[];
}

export class ReportFilters {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  programmerId?: number;
  status?: string;
  userId?: number;
}
