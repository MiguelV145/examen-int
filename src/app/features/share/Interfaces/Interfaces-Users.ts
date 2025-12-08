export interface UserProfile {
  uid: string;
  email: string;
  // Respetamos tus nombres exactos
  role: 'admin' | 'user' | 'Programador'; 
  displayName?: string;
  // Opcional: Agrega photoURL si quieres que se vea la foto de Google, si no, bórralo
  photoURL?: string; 
  specialty?: string;   
  escription?: string; 
}