export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user' | 'Programador';
  displayName?: string;
  photoURL?: string;
  specialty?: string;   
  description?: string; 
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
