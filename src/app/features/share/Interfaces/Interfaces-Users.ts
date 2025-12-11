// 1. Interfaz para el Horario
export interface Availability {
  dias: string;   // Ej: "Lunes a Viernes"
  horas: string;  // Ej: "09:00 - 18:00"
}

// 2. Interfaz Principal de Usuario
export interface UserProfile {
  // Datos de Autenticación
  uid: string;
  email: string;
  role: 'admin' | 'user' | 'Programador';
  
  // Datos Básicos
  displayName?: string;
  photoURL?: string;
  
  // Datos de Programador
  specialty?: string;     
  description?: string;   
  skills?: string[];      
  availability?: Availability; 
  
  // Datos Auxiliares
  photoFile?: File; 
}

// 3. Interfaz de Proyectos
export interface Project {
  id?: string;
  programmerId: string;
  title: string;
  description: string;
  category: 'Academico' | 'Laboral'; 
  role: string;
  technologies: string[];
  repoUrl?: string;
  demoUrl?: string;
  
  // Campo para la imagen SEO automática
  image?: string;      
  
  // Campos opcionales/legacy
  photoURL?: string;   
  likes?: string[];
}

// 4. Interfaz de Asesorías
export interface Asesoria {
  id?: string;
  programmerId: string;
  programmerName: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  comment: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  responseMsg?: string;
}

// 5. Interfaces para el Servicio de Links (NUEVAS)
export interface LinkPreview {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export interface MicrolinkResponse {
  status: string;
  data: {
    title?: string;
    description?: string;
    image?: { url: string };
    url?: string;
  };
}