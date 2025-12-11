import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, doc, updateDoc, docData } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import { UserProfile } from '../../share/Interfaces/Interfaces-Users';
import { from, tap, finalize, take, of, catchError } from 'rxjs';
import { FormUtils } from '../../share/Formutils/Formutils';

@Component({
  selector: 'app-programmer-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], 
  // 2. CORREGIDO: Apunta a tu archivo HTML correcto
  templateUrl: './Perfil-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgrammerPage implements OnInit { 
  
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private firestore = inject(Firestore);

  // Signals UI
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  
  // Datos
  skills = signal<string[]>([]);
  previewUrl = signal<string | null>(null);
  user = this.authService.currentUser;

  // 3. EXPONEMOS FORMUTILS AL HTML
  formUtils = FormUtils;

  profileForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    specialty: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    photoURL: [''] 
  });

  constructor() {}

  ngOnInit() {
    this.loadCurrentData();
  }

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
          this.profileForm.patchValue({
            displayName: profile.displayName || '',
            specialty: profile.specialty || '',
            description: profile.description || '',
            photoURL: profile.photoURL || ''
          });
          if (profile['skills'] && Array.isArray(profile['skills'])) {
            this.skills.set(profile['skills']);
          }
        }
      });
    }
  }

  addSkill(event: any) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && !this.skills().includes(value)) {
      this.skills.update(s => [...s, value]);
      input.value = ''; 
    }
  }

  removeSkill(skill: string) {
    this.skills.update(s => s.filter(x => x !== skill));
  }

  // Lógica para guardar la imagen como texto (Base64)
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 500000) { // Límite 500KB
        alert('La imagen es muy grande (Máx 500KB).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => { 
        const base64Image = e.target?.result as string;
        this.previewUrl.set(base64Image); 
        this.profileForm.patchValue({ photoURL: base64Image });
        this.profileForm.get('photoURL')?.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    
    const user = this.authService.currentUser();
    if (!user) return;

    this.loading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const docRef = doc(this.firestore, 'users', user.uid);
    
    // Unimos los datos del form con los skills
    const dataToUpdate = { 
      ...this.profileForm.value, 
      skills: this.skills(),
      // Aseguramos que la foto vaya, si no hay nueva, va la que ya estaba
      photoURL: this.profileForm.value.photoURL || '' 
    };

    from(updateDoc(docRef, dataToUpdate)).pipe(
      tap(() => {
        this.successMessage.set('¡Perfil actualizado con éxito!');
        setTimeout(() => this.successMessage.set(''), 3000);
      }),
      catchError((error) => {
        console.error(error);
        this.errorMessage.set('Error al guardar. Intenta con una imagen más liviana.');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
}