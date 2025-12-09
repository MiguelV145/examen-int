import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { collection, collectionData, doc, docData, Firestore, query, updateDoc, where } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import { catchError, finalize, from, Observable, of, take, tap } from 'rxjs';
import { Asesoria, UserProfile } from '../../share/Interfaces/Interfaces-Users';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-programmer-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './Programmer-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgrammerPage implements OnInit {
 private fb = inject(FormBuilder);
  public authService = inject(AuthService); // Público para usarlo en el HTML
  private firestore = inject(Firestore);

  // --- SIGNALS PARA LA UI ---
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  
  // Para las etiquetas de habilidades (Tags)
  skills = signal<string[]>([]);
  
  // Para la vista previa de la imagen local
  previewUrl = signal<string | null>(null);
  
  // Acceso rápido al usuario para el HTML
  user = this.authService.currentUser;

  // --- FORMULARIO ---
  profileForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    specialty: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    photoURL: [''] // Mantiene la URL de la base de datos
  });

  constructor() {}

  ngOnInit() {
    this.loadCurrentData();
  }

  // 1. CARGAR DATOS
  loadCurrentData() {
    const user = this.authService.currentUser();
    if (user) {
      this.loading.set(true);
      const docRef = doc(this.firestore, 'users', user.uid);
      
      docData(docRef).pipe(
        take(1),
        tap(() => this.loading.set(false))
      ).subscribe((data: any) => {
        if (data) {
          const profile = data as UserProfile;
          
          // Llenar formulario
          this.profileForm.patchValue({
            displayName: profile.displayName || '',
            specialty: profile.specialty || '',
            description: profile.description || '',
            photoURL: profile.photoURL || ''
          });

          // Llenar skills si existen (asegurando que sea array)
          // Nota: Necesitas agregar 'skills?: string[]' a tu interfaz UserProfile si no está
          if (profile['skills'] && Array.isArray(profile['skills'])) {
            this.skills.set(profile['skills']);
          }
        }
      });
    }
  }

  // 2. LOGICA DE SKILLS (Enter para agregar, Click para borrar)
  addSkill(event: any) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if (value && !this.skills().includes(value)) {
      this.skills.update(skills => [...skills, value]);
      input.value = ''; // Limpiar input
    }
  }

  removeSkill(skillToRemove: string) {
    this.skills.update(skills => skills.filter(skill => skill !== skillToRemove));
  }

  // 3. LOGICA DE FOTO (Vista previa local)
  // NOTA: Para subir la foto real a internet necesitas configurar Firebase Storage.
  // Por ahora, esto solo muestra la vista previa local.
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // 4. GUARDAR PERFIL
  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    
    const user = this.authService.currentUser();
    if (!user) return;

    this.loading.set(true);
    this.successMessage.set('');
    
    const docRef = doc(this.firestore, 'users', user.uid);
    
    const dataToUpdate: any = {
      displayName: this.profileForm.value.displayName,
      specialty: this.profileForm.value.specialty,
      description: this.profileForm.value.description,
      skills: this.skills() // Guardamos el array de skills
    };

    // Si tuviéramos Firebase Storage, aquí subiríamos la foto.
    // Como estamos usando solo texto por ahora, mantenemos la photoURL existente
    // o podríamos guardar la previewUrl si es pequeña (Base64), pero no es recomendable para producción.

    from(updateDoc(docRef, dataToUpdate)).pipe(
      tap(() => {
        this.successMessage.set('¡Perfil actualizado con éxito!');
        setTimeout(() => this.successMessage.set(''), 3000);
      }),
      catchError((error) => {
        console.error(error);
        this.errorMessage.set('Error al guardar.');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
}