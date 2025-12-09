import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { collection, collectionData, deleteDoc, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import {  Observable } from 'rxjs';
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

  // --- CAMBIAR ROL ---
  async toggleRole(user: UserProfile) {
    const currentUser = this.authService.currentUser();
    
    // Validaciones de seguridad
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
    const actionText = isProgrammer ? 'QUITAR permisos de' : 'DAR permisos de';

    if (!confirm(`¿Estás seguro de ${actionText} Programador a ${user.displayName || user.email}?`)) return;

    try {
      const userRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userRef, { role: newRole });
    } catch (error) {
      console.error(error);
      alert('Error al actualizar rol.');
    }
  }

  // --- ELIMINAR USUARIO (NUEVO) ---
  async deleteUser(user: UserProfile) {
    const currentUser = this.authService.currentUser();

    // 1. No puedes borrarte a ti mismo
    if (user.uid === currentUser?.uid) {
      alert('No puedes eliminar tu propia cuenta desde aquí.');
      return;
    }

    // 2. No puedes borrar a otros admins
    if (user.role === 'admin') {
      alert('No puedes eliminar a otro Administrador.');
      return;
    }

    // 3. Confirmación
    const confirmMsg = `PELIGRO: ¿Estás seguro de eliminar a ${user.email}?\nEsta acción borrará sus datos de la base de datos.`;
    if (!confirm(confirmMsg)) return;

    try {
      // 4. Borrar documento de Firestore
      const userRef = doc(this.firestore, 'users', user.uid);
      await deleteDoc(userRef);
    } catch (error) {
      console.error(error);
      alert('Error al eliminar usuario. Verifica permisos.');
    }
  }
}