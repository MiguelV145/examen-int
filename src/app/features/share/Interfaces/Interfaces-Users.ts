export interface UserProfile {
  uid: string;
  email: string;

  role: 'admin' | 'user' | 'Programador';
  displayName?: string;
  photoURL?: string;
  specialty?: string;   
  description?: string; 
}
