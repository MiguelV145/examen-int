export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user' | 'Programador';
  displayName?: string;
  photoURL?: string;
  specialty?: string;    
  description?: string; 
  skills?: string[]; 
   photoFile?: File; 
}


export interface Project {
  id?: string;
  programmerId: string; // Para vincularlo al dueño
  title: string;
  description: string;
  category: 'Academico' | 'Laboral'; 
  role: string; // Frontend, Backend, Fullstack, BD
  technologies: string[]; 
  repoUrl?: string;
  demoUrl?: string;
  likes?: string[];//
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