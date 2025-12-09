export interface UserProfile {
  uid: string;
  email: string;
  // Respetamos tus nombres exactos
  role: 'admin' | 'user' | 'Programador'; 
  displayName?: string;
  // Opcional: Agrega photoURL si quieres que se vea la foto de Google, si no, bórralo
  photoURL?: string;
  photoFile?: File; 
  specialty?: string;   
  escription?: string; 
}

export interface additionalUserInfo {
  specialty: string;
  description: string;
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


export interface deleteProyecto {
  id: string;
}
