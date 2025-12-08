import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { collection, collectionData, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import { from, Observable } from 'rxjs';
import { UserProfile } from '../../share/Interfaces/Interfaces-Users';
import { AsyncPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-adminpage',
  imports: [CommonModule, AsyncPipe],
  templateUrl: './Adminpage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Adminpage { 
  private firestore = inject(Firestore);
  public authService = inject(AuthService);

  users$: Observable<UserProfile[]>;

  constructor() {
    const usersCollection = collection(this.firestore, 'users');
    this.users$ = collectionData(usersCollection, { idField: 'uid' }) as Observable<UserProfile[]>;
  }

  // ... (El resto de tu código toggleRole sigue igual) ...
  async toggleRole(user: UserProfile) {
    // ... tu lógica aquí ...
     const currentUser = this.authService.currentUser();
    if (user.uid === currentUser?.uid) {
      alert('No puedes cambiar tu propio rol.');
      return;
    }

    if (user.role === 'admin') {
      alert('No puedes modificar a otro Administrador.');
      return;
    }

    const isProgrammer = user.role === 'Programador';
    const newRole = isProgrammer ? 'user' : 'Programador';
    const actionText = isProgrammer ? 'Quitar permisos de' : 'Dar permisos de';

    const confirmMessage = `¿Estás seguro de ${actionText} Programador a ${user.displayName || user.email}?`;
    if (!confirm(confirmMessage)) return;

    try {
      const userRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userRef, { role: newRole });
    } catch (error) {
      console.error(error);
      alert('Error al actualizar. Verifica tus permisos.');
    }
  }
}