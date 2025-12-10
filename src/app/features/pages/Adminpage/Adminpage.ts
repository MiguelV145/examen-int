import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

// Firebase
import { 
  collection, collectionData, deleteDoc, doc, Firestore, 
  setDoc, updateDoc 
} from '@angular/fire/firestore';
import { deleteApp, initializeApp } from '@angular/fire/app';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from '@angular/fire/auth';

// Proyecto
import { AuthService } from '../../../core/services/firebase/authservice';
import { Asesoria, Availability, UserProfile } from '../../share/Interfaces/Interfaces-Users';
import { environment } from '../../../../environments/environment';

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

  // Observables
  users$: Observable<UserProfile[]>;
  asesorias$: Observable<Asesoria[]>;

  // Señales de Estado
  loading = signal(false);
  showModal = signal(false);            // Modal Crear Usuario
  showAvailabilityModal = signal(false); // Modal Horarios (¡ESTA ES LA QUE TE FALLABA!)
  activeTab = signal<'users' | 'asesorias'>('users');
  
  selectedProgrammer = signal<UserProfile | null>(null);

  // Lista de horas para el HTML
  availableHours = [
    '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', 
    '07:00 PM', '08:00 PM'
  ];

  // Formularios
  createUserForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['user']
  });

  availabilityForm = this.fb.group({
    dias: ['', Validators.required],
    startHour: ['09:00 AM', Validators.required],
    endHour: ['05:00 PM', Validators.required]
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

  // --- MODAL USUARIO ---
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

    // 👇 AQUÍ ESTABA EL ERROR. CAMBIA 'environment.firebase' POR 'environment.firebaseConfig'
    const secondaryApp = initializeApp(environment.firebaseConfig, 'Secondary'); 
    
    const secondaryAuth = getAuth(secondaryApp);

    try {
      if(email && password) {
        // ... (el resto de la lógica sigue igual)
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
          createdAt: new Date().toISOString()
        });

        alert(`Usuario ${displayName} creado.`);
        this.closeModal();
      }
    } catch (error: any) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      this.loading.set(false);
      await deleteApp(secondaryApp);
    }
  }

  // --- GESTIÓN ROLES ---
  async toggleRole(user: UserProfile) {
    if (user.uid === this.authService.currentUser()?.uid) return alert('No puedes cambiar tu propio rol.');
    if (user.role === 'admin') return alert('No puedes modificar a otro Admin.');

    const newRole = user.role === 'Programador' ? 'user' : 'Programador';
    if (!confirm(`¿Cambiar rol de ${user.displayName}?`)) return;

    try {
      await updateDoc(doc(this.firestore, 'users', user.uid), { role: newRole });
    } catch (e) { console.error(e); }
  }

  async deleteUser(user: UserProfile) {
    if (user.uid === this.authService.currentUser()?.uid) return alert('No puedes eliminarte.');
    if (user.role === 'admin') return alert('No puedes borrar Admins.');
    if (!confirm(`¿Eliminar a ${user.email}?`)) return;

    try {
      await deleteDoc(doc(this.firestore, 'users', user.uid));
    } catch (e) { console.error(e); }
  }

  // --- MODAL HORARIOS (ESTAS SON LAS FUNCIONES QUE TE FALTABAN) ---
  
  openAvailabilityModal(user: UserProfile) {
    if (user.role !== 'Programador') return;
    
    this.selectedProgrammer.set(user); // Guarda al usuario seleccionado

    // Separa las horas si ya existen (ej: "09:00 AM - 05:00 PM")
    const hours = user.availability?.horas || '';
    const [start, end] = hours.includes(' - ') ? hours.split(' - ') : ['09:00 AM', '05:00 PM'];

    this.availabilityForm.patchValue({
      dias: user.availability?.dias || '',
      startHour: start.trim(),
      endHour: end.trim()
    });
    
    this.showAvailabilityModal.set(true); // Abre el modal
  }

  closeAvailabilityModal() {
    this.showAvailabilityModal.set(false); // Cierra el modal
    this.selectedProgrammer.set(null);
  }

  async saveAvailability() {
    const user = this.selectedProgrammer();
    if (!user || this.availabilityForm.invalid) return;

    this.loading.set(true);
    try {
      const { dias, startHour, endHour } = this.availabilityForm.value;
      
      const newAvailability: Availability = {
        dias: dias!,
        horas: `${startHour} - ${endHour}`
      };
      
      await updateDoc(doc(this.firestore, 'users', user.uid), { availability: newAvailability });
      
      alert('Horario actualizado.');
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
    if (!confirm(`¿${newStatus === 'aprobada' ? 'Aprobar' : 'Rechazar'} cita?`)) return;

    try {
      await updateDoc(doc(this.firestore, 'asesorias', asesoria.id), { 
        status: newStatus,
        responseMsg: newStatus === 'aprobada' ? 'Confirmada por Admin.' : 'Cancelada por Admin.'
      });
    } catch (e) { console.error(e); }
  }
}