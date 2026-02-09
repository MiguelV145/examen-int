import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

// Firebase Imports
import { collection, collectionData, deleteDoc, doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { deleteApp, initializeApp } from '@angular/fire/app';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from '@angular/fire/auth';

// Tus servicios e interfaces
import { AuthService } from '../../../core/services/auth/auth.service';
import { Asesoria, Availability, UserProfile } from '../../share/Interfaces/Interfaces-Users';
// Ajusta esta ruta a donde tengas tu environment.ts
import { environment } from '../../../../environments/environment'; 
import { FormUtils } from '../../share/Formutils/Formutils';

@Component({
  selector: 'app-adminpage',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ReactiveFormsModule],
  templateUrl: './Adminpage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Adminpage { 
  
  private firestore = inject(Firestore);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Observables de datos
  users$: Observable<UserProfile[]>;
  asesorias$: Observable<Asesoria[]>;

  // Estado UI
  loading = signal(false);
  showCreateModal = signal(false);
  showAvailabilityModal = signal(false);
  activeTab = signal<'users' | 'asesorias'>('users');
  
  selectedProgrammer = signal<UserProfile | null>(null);
  formUtils = FormUtils; // Exponer al HTML

  // --- FORMULARIOS ---
  

  availabilityForm = this.fb.group({
    dias: ['', Validators.required],
    startHour: ['09:00', Validators.required], // Formato HH:mm
    endHour: ['17:00', Validators.required]
  });

  constructor() {
    const usersRef = collection(this.firestore, 'users');
    this.users$ = collectionData(usersRef, { idField: 'uid' }) as Observable<UserProfile[]>;

    const asesoriasRef = collection(this.firestore, 'asesorias');
    this.asesorias$ = collectionData(asesoriasRef, { idField: 'id' }) as Observable<Asesoria[]>;
  }

  // --- NAVEGACIÓN ---
  switchTab(tab: 'users' | 'asesorias') {
    this.activeTab.set(tab);
  }
  
  // --- GESTIÓN USUARIOS ---
  async toggleRole(user: UserProfile) {
    const currentUserUid = this.authService.currentUser()?.uid || this.authService.currentUser()?.id.toString();
    if (user.uid === currentUserUid) return alert('⛔ No puedes cambiar tu propio rol.');
    if (user.role === 'admin') return alert(' No puedes modificar a otro Admin.');

    const newRole = user.role === 'Programador' ? 'user' : 'Programador';
    if (!confirm(`¿Cambiar rol de ${user.displayName} a ${newRole}?`)) return;

    try {
      await updateDoc(doc(this.firestore, 'users', user.uid), { role: newRole });
    } catch (e) { console.error(e); }
  }

  async deleteUser(user: UserProfile) {
    const currentUserUid = this.authService.currentUser()?.uid || this.authService.currentUser()?.id.toString();
    if (user.uid === currentUserUid) return alert('⛔ No puedes eliminarte.');
    if (user.role === 'admin') return alert(' No puedes borrar Admins.');
    if (!confirm(`¿Eliminar a ${user.email} permanentemente?`)) return;

    try {
      await deleteDoc(doc(this.firestore, 'users', user.uid));
    } catch (e) { console.error(e); }
  }

  // --- HORARIOS (Modal) ---
  openAvailabilityModal(user: UserProfile) {
    if (user.role !== 'Programador') return;
    
    this.selectedProgrammer.set(user);
    
    // Parsear horario existente si lo hay
    const hours = user.availability?.horas || '';
    // Intentamos separar "09:00 - 17:00"
    const [start, end] = hours.includes(' - ') ? hours.split(' - ') : ['09:00', '17:00'];

    this.availabilityForm.patchValue({
      dias: user.availability?.dias || 'Lunes a Viernes',
      startHour: start.trim(),
      endHour: end.trim()
    });
    
    this.showAvailabilityModal.set(true);
  }

  closeAvailabilityModal() {
    this.showAvailabilityModal.set(false);
    this.selectedProgrammer.set(null);
  }

  async saveAvailability() {
    const user = this.selectedProgrammer();
    if (!user || this.availabilityForm.invalid) {
        this.availabilityForm.markAllAsTouched();
        return;
    }

    this.loading.set(true);
    try {
      const { dias, startHour, endHour } = this.availabilityForm.value;
      
      const newAvailability: Availability = {
        dias: dias!,
        horas: `${startHour} - ${endHour}`
      };
      
      await updateDoc(doc(this.firestore, 'users', user.uid), { availability: newAvailability });
      
      alert('✅ Horario actualizado.');
      this.closeAvailabilityModal();
      
    } catch (e) { 
      console.error(e);
      alert('Error al guardar.');
    } finally { 
      this.loading.set(false); 
    }
  }

  // --- GESTIÓN ASESORÍAS ---
  async updateAsesoriaStatus(asesoria: Asesoria, newStatus: 'aprobada' | 'rechazada') {
    if (!asesoria.id) return;
    if (!confirm(`¿${newStatus === 'aprobada' ? 'Aprobar' : 'Rechazar'} cita de ${asesoria.clientName}?`)) return;

    try {
      await updateDoc(doc(this.firestore, 'asesorias', asesoria.id), { 
        status: newStatus,
        responseMsg: newStatus === 'aprobada' ? 'Confirmada por Admin.' : 'Cancelada por Admin.'
      });
    } catch (e) { console.error(e); }
  }
}