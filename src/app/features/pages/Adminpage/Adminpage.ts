import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { collection, collectionData, deleteDoc, doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import {  Observable } from 'rxjs';
import { Asesoria, Availability, UserProfile } from '../../share/Interfaces/Interfaces-Users';
import { AsyncPipe, CommonModule } from '@angular/common';
import { deleteApp, initializeApp } from '@angular/fire/app';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from '@angular/fire/auth';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-adminpage',
  imports: [CommonModule, AsyncPipe, ReactiveFormsModule],
  templateUrl: './Adminpage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Adminpage { 
private firestore = inject(Firestore);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // --- OBSERVABLES DE DATOS ---
  users$: Observable<UserProfile[]>;
  asesorias$: Observable<Asesoria[]>;

  // --- SEÑALES DE ESTADO ---
  loading = signal(false);
  showModal = signal(false); // Modal Crear Usuario
  showAvailabilityModal = signal(false); // Modal Horario
  activeTab = signal<'users' | 'asesorias'>('users'); // Pestaña Activa
  
  selectedProgrammer = signal<UserProfile | null>(null);

  // --- LISTA DE HORAS PARA EL SELECTOR ---
  availableHours = [
    '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', 
    '07:00 PM', '08:00 PM'
  ];

  // --- FORMULARIOS ---
  
  // 1. Formulario Crear Usuario
  createUserForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['user']
  });

  // 2. Formulario Disponibilidad (Horario)
  availabilityForm = this.fb.group({
    dias: ['', Validators.required],
    startHour: ['09:00 AM', Validators.required],
    endHour: ['05:00 PM', Validators.required]
  });

  constructor() {
    // Cargar Usuarios
    const usersCollection = collection(this.firestore, 'users');
    this.users$ = collectionData(usersCollection, { idField: 'uid' }) as Observable<UserProfile[]>;

    // Cargar Asesorías
    const asesoriasCollection = collection(this.firestore, 'asesorias');
    this.asesorias$ = collectionData(asesoriasCollection, { idField: 'id' }) as Observable<Asesoria[]>;
  }

  // --- GESTIÓN DE PESTAÑAS ---
  switchTab(tab: 'users' | 'asesorias') {
    this.activeTab.set(tab);
  }

  // --- GESTIÓN DE USUARIOS (CREAR, EDITAR, ELIMINAR) ---

  openModal() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.createUserForm.reset({ role: 'user' });
  }

  async createUser() {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password, displayName, role } = this.createUserForm.value;

    const secondaryApp = initializeApp(environment.firebaseConfig, 'Secondary');
    const secondaryAuth = getAuth(secondaryApp);

    try {
      if(email && password) {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newUser = userCredential.user;

        await updateProfile(newUser, { displayName: displayName });

        const userDocRef = doc(this.firestore, `users/${newUser.uid}`);
        await setDoc(userDocRef, {
          uid: newUser.uid,
          email: email,
          displayName: displayName,
          role: role,
          photoURL: null,
          createdAt: new Date()
        });

        alert(`Usuario ${displayName} creado exitosamente.`);
        this.closeModal();
      }
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      alert(error.code === 'auth/email-already-in-use' ? 'El correo ya está registrado.' : 'Error: ' + error.message);
    } finally {
      this.loading.set(false);
      await deleteApp(secondaryApp);
    }
  }

  async toggleRole(user: UserProfile) {
    const currentUser = this.authService.currentUser();
    if (user.uid === currentUser?.uid) { alert('No puedes cambiar tu propio rol.'); return; }
    if (user.role === 'admin') { alert('No puedes modificar a otro Administrador.'); return; }

    const newRole = user.role === 'Programador' ? 'user' : 'Programador';
    const actionText = user.role === 'Programador' ? 'QUITAR permisos de' : 'DAR permisos de';

    if (!confirm(`¿Estás seguro de ${actionText} Programador a ${user.displayName || user.email}?`)) return;

    try {
      const userRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userRef, { role: newRole });
    } catch (error) {
      console.error(error);
      alert('Error al actualizar rol.');
    }
  }

  async deleteUser(user: UserProfile) {
    const currentUser = this.authService.currentUser();
    if (user.uid === currentUser?.uid) { alert('No puedes eliminarte a ti mismo.'); return; }
    if (user.role === 'admin') { alert('No puedes eliminar a otro Admin.'); return; }

    if (!confirm(`PELIGRO: ¿Eliminar a ${user.email}?`)) return;

    try {
      const userRef = doc(this.firestore, 'users', user.uid);
      await deleteDoc(userRef);
    } catch (error) {
      console.error(error);
      alert('Error al eliminar usuario.');
    }
  }

  // --- GESTIÓN DE HORARIOS (DISPONIBILIDAD) ---

  openAvailabilityModal(user: UserProfile) {
    if (user.role !== 'Programador') return;
    
    this.selectedProgrammer.set(user);

    // Separar hora inicio y fin si existen
    const currentHours = user.availability?.horas || '';
    const [start, end] = currentHours.includes(' - ') 
      ? currentHours.split(' - ') 
      : ['09:00 AM', '05:00 PM'];

    this.availabilityForm.patchValue({
      dias: user.availability?.dias || '',
      startHour: start,
      endHour: end
    });
    
    this.showAvailabilityModal.set(true);
  }

  closeAvailabilityModal() {
    this.showAvailabilityModal.set(false);
    this.selectedProgrammer.set(null);
  }

  async saveAvailability() {
    const user = this.selectedProgrammer();
    if (!user || this.availabilityForm.invalid) return;

    this.loading.set(true);
    try {
      const userRef = doc(this.firestore, 'users', user.uid);
      
      const start = this.availabilityForm.value.startHour;
      const end = this.availabilityForm.value.endHour;
      const hoursString = `${start} - ${end}`;

      const newAvailability: Availability = {
        dias: this.availabilityForm.value.dias || '',
        horas: hoursString
      };

      await updateDoc(userRef, { availability: newAvailability });
      alert('Horario actualizado correctamente.');
      this.closeAvailabilityModal();
    } catch (error) {
      console.error(error);
      alert('Error al guardar horario.');
    } finally {
      this.loading.set(false);
    }
  }

  // --- GESTIÓN DE ASESORÍAS (CITAS) ---

  async updateAsesoriaStatus(asesoria: Asesoria, newStatus: 'aprobada' | 'rechazada') {
    if (!asesoria.id) return;
    
    const confirmMsg = newStatus === 'aprobada' 
      ? `¿Aprobar cita con ${asesoria.programmerName}?` 
      : `¿Rechazar cita de ${asesoria.clientName}?`;
      
    if (!confirm(confirmMsg)) return;

    try {
      const docRef = doc(this.firestore, 'asesorias', asesoria.id);
      await updateDoc(docRef, { 
        status: newStatus,
        responseMsg: newStatus === 'aprobada' ? 'Tu cita ha sido confirmada.' : 'Lo sentimos, el horario no está disponible.'
      });
    } catch (error) {
      console.error(error);
      alert('Error al actualizar la cita.');
    }
  }
}