import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; 
// 👇 ESTO FALTABA:
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, doc, updateDoc, docData } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import { UserProfile } from '../../share/Interfaces/Interfaces-Users';
import { from, tap, finalize, take, of, catchError } from 'rxjs';

@Component({
  selector: 'app-programmer-page',
  standalone: true,
  // 👇 AQUÍ SE AGREGA:
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './Perfil-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgrammerPage implements OnInit { 
  
  private fb = inject(FormBuilder);
  public authService = inject(AuthService); // Público para el HTML
  private firestore = inject(Firestore);

  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  
  // Signals para UI
  skills = signal<string[]>([]);
  previewUrl = signal<string | null>(null);
  user = this.authService.currentUser;

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
      
      docData(docRef).pipe(take(1), tap(() => this.loading.set(false))).subscribe((data: any) => {
        if (data) {
          const profile = data as UserProfile;
          this.profileForm.patchValue({
            displayName: profile.displayName || '',
            specialty: profile.specialty || '',
            description: profile.description || '',
            photoURL: profile.photoURL || ''
          });
          if (profile['skills']) this.skills.set(profile['skills']);
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


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máximo 500KB para no saturar Firestore)
      if (file.size > 500000) {
        alert('La imagen es muy grande. Usa una de menos de 500KB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => { 
        const base64Image = e.target?.result as string;
        
        // 1. Mostrar vista previa
        this.previewUrl.set(base64Image);
        
        // 2. IMPORTANTE: Guardar el string de la imagen en el formulario
        this.profileForm.patchValue({
          photoURL: base64Image
        });
        
        // Marcar como 'dirty' para que Angular sepa que cambió
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
    const docRef = doc(this.firestore, 'users', user.uid);
    
    // Obtenemos los valores del formulario (incluida la foto en Base64 si se cambió)
    const formValues = this.profileForm.value;

    const dataToUpdate = {
      displayName: formValues.displayName,
      specialty: formValues.specialty,
      description: formValues.description,
      photoURL: formValues.photoURL, // <--- Aquí va la foto
      skills: this.skills()
    };

    from(updateDoc(docRef, dataToUpdate)).pipe(
      tap(() => {
        this.successMessage.set('¡Perfil actualizado con éxito!');
        setTimeout(() => this.successMessage.set(''), 3000);
      }),
      catchError((error) => {
        console.error(error);
        this.errorMessage.set('Error al guardar. La imagen puede ser muy pesada.');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

 
}
