export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user' | 'Programador';
  displayName?: string;
  photoURL?: string;
  specialty?: string;    
  description?: string; 
  
  // AGREGA ESTA LÍNEA AQUÍ:
  skills?: string[]; 
  
  // Opcional: Para manejo interno de subida de archivos (no se guarda en Firestore tal cual)
  photoFile?: File; 
}

export interface Proyecto {
  id?: string;
  uid: string; 
  tipo: 'academico' | 'laboral';
  title: string;
  description: string;
  participacion: 'frontend' | 'backend' | 'database' | 'fullstack';
  tecnologias: string[];
  repoURL?: string;
  demoURL?: string;
  photoURL?: string;
}


export interface Availability {
  dias: string;   
  horas: string;  
}

export interface UserProfile {
  specialty?: string;
  description?: string;
  photoURL?: string;
  // NUEVO CAMPO:
  availability?: Availability; 
}

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