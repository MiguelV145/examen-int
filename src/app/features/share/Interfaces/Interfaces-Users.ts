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


export interface addProyecto {
  hasProyecto: boolean;
  photoURL?: string;
  photoFile?: File;
  title?: string;
  description?: string;
  lenguajes?: string[];
}


export interface Proyecto {
  id?: string;
  uid: string;
  title: string;
  description: string;
  lenguajes: string[];
  photoURL?: string;
}


export interface DeleteProyecto {
  id: string;
}

