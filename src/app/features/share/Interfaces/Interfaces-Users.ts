// 1. Interfaz para el Horario
export interface Availability {
  dias: string;   // Ej: "Lunes a Viernes"
  horas: string;  // Ej: "09:00 - 18:00"
}

// 2. Interfaz Principal de Usuario (FUSIONADA)
export interface UserProfile {
  // Datos de Autenticación
  uid: string;
  email: string;
  role: 'admin' | 'user' | 'Programador';
  
  // Datos Básicos
  displayName?: string;
  photoURL?: string;
  
  // Datos de Programador (Opcionales)
  specialty?: string;     // Título (Frontend, etc.)
  description?: string;   // Biografía
  skills?: string[];      // Array de etiquetas (React, Angular...)
  availability?: Availability; // Objeto de horario
  
  // Datos Auxiliares (No se guardan en BD, solo uso interno)
  photoFile?: File; 
}

// 3. Interfaz de Proyectos
export interface Project {
  id?: string;
  programmerId: string;   // ID del dueño
  title: string;
  description: string;
  category: 'Academico' | 'Laboral'; 
  role: string;           // Tu rol en el proyecto
  technologies: string[]; // Array de strings
  repoUrl?: string;
  demoUrl?: string;
  likes?: string[];       // Array de UIDs de usuarios que dieron like
}

// 4. Interfaz de Asesorías (Citas)
export interface Asesoria {
  id?: string;
  programmerId: string;
  programmerName: string;
  clientId: string;       // UID del que pide la cita
  clientName: string;     // Nombre del que pide
  date: string;           // Fecha YYYY-MM-DD
  time: string;           // Hora HH:MM
  comment: string;        // Mensaje/Motivo
  status: 'pendiente' | 'aprobada' | 'rechazada';
  responseMsg?: string;   // Respuesta del programador
}