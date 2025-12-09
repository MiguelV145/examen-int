import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { doc, docData, Firestore, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import { catchError, finalize, from, Observable, of, take, tap } from 'rxjs';
import { UserProfile } from '../../share/Interfaces/Interfaces-Users';
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
  private authService = inject(AuthService); // Se mantiene privado
  private firestore = inject(Firestore);
  skills = signal<string[]>([]);

  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  previewUrl = signal<string | null>(null);
  selectedFile: File | null = null;

  // --- SOLUCIÓN DEL ERROR ---
  // Creamos una propiedad pública que el HTML sí puede ver
  public user = this.authService.currentUser;

  // En Programmer-Page.ts

  profileForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]], 
    specialty: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    photoURL: ['']
  });

  constructor() { }

  ngOnInit() {
    this.loadCurrentData();
  }

  // Carga los datos iniciales
  loadCurrentData() {
    const currentUser = this.user(); // Usamos la señal pública

    if (currentUser) {
      this.loading.set(true);
      const docRef = doc(this.firestore, 'users', currentUser.uid);

      docData(docRef).pipe(
        take(1),
        tap(() => this.loading.set(false)),
        catchError(err => {
          console.error(err);
          this.loading.set(false);
          return of(null);
        })
      ).subscribe((data: any) => {
        if (data) {
          const profile = data as UserProfile;
          this.profileForm.patchValue({
            specialty: profile.specialty || '',
            description: profile.description || '',
            photoURL: profile.photoURL || ''
          });
        }
      });
    }
  }

  // Previsualizar archivo local
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;

      // Crear URL temporal para ver la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    // ... validaciones previas ...

    const dataToUpdate = {
      displayName: this.profileForm.value.displayName,
      specialty: this.profileForm.value.specialty,
      description: this.profileForm.value.description,
      photoURL: this.profileForm.value.photoURL,
      
      // AGREGAR ESTO: Guardamos el array de la signal en Firestore
      skills: this.skills() 
    };
    const currentUser = this.user();
    if (!currentUser) return;

    this.loading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const docRef = doc(this.firestore, 'users', currentUser.uid);

    // NOTA: Aquí deberías subir la imagen a Storage si 'this.selectedFile' existe.
    // Por ahora, guardamos los datos de texto.
   

    from(updateDoc(docRef, dataToUpdate)).pipe(
      tap(() => {
        this.successMessage.set('¡Perfil actualizado correctamente!');
        setTimeout(() => this.successMessage.set(''), 3000);
      }),
      catchError((error) => {
        console.error(error);
        this.errorMessage.set('Error al guardar los cambios.');
        return of(null);
      }),
      finalize(() => {
        this.loading.set(false);
      })
    ).subscribe();
  }

  addSkill(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if (value && !this.skills().includes(value)) {
      this.skills.update(current => [...current, value]);
      input.value = ''; // Limpiar input
    }
  }

  // 3. FUNCIÓN PARA ELIMINAR SKILL
  removeSkill(skillToRemove: string) {
    this.skills.update(current => current.filter(skill => skill !== skillToRemove));
  }
}