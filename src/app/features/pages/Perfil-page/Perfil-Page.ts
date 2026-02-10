import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ProfileApiService } from '../../../core/services/api/profile.api';
import { UserProfile } from '../../share/Interfaces/Interfaces-Users';
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
  private profileApi = inject(ProfileApiService);

  // Signals UI
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  message = signal('Perfil - Funcionalidad en construcción. Conectar con backend cuando esté listo.');
  
  // Datos
  skills = signal<string[]>([]);
  previewUrl = signal<string | null>(null);
  user = this.authService.currentUser;
  
  skillInputCtrl = new FormControl<string>('', { nonNullable: true });

  formUtils = FormUtils;

  profileForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    specialty: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    photoURL: [''] 
  });

  constructor() {}

  ngOnInit() {
    this.loadProfile();
  }

  private loadProfile() {
    this.profileApi.getMyProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.profileForm.patchValue({
            displayName: profile.displayName || '',
            specialty: profile.specialty || '',
            description: profile.description || '',
            photoURL: profile.photoURL || ''
          });
          this.skills.set(profile.skills || []);
          if (profile.photoURL) {
            this.previewUrl.set(profile.photoURL);
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
      }
    });
  }

  addSkill(event: Event) {
    event.preventDefault();
    const value = (this.skillInputCtrl.value ?? '').trim();
    if (!value) return;

    this.skills.update((list) => {
      const exists = list.some((x) => x.toLowerCase() === value.toLowerCase());
      return exists ? list : [...list, value];
    });

    this.skillInputCtrl.setValue('');
  }

  removeSkill(skill: string) {
    this.skills.update((list) => list.filter((x) => x !== skill));
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 500000) {
        alert('La imagen es muy grande (Máx 500KB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => { 
        const base64Image = e.target?.result as string;
        this.previewUrl.set(base64Image); 
        this.profileForm.patchValue({ photoURL: base64Image });
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.errorMessage.set('Por favor completa todos los campos requeridos.');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    const payload = {
      displayName: this.profileForm.value.displayName || '',
      specialty: this.profileForm.value.specialty || '',
      description: this.profileForm.value.description || '',
      skills: this.skills(),
      photoURL: this.profileForm.value.photoURL || undefined,
    };

    this.loading.set(true);

    this.profileApi
      .updateMyProfile(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.successMessage.set('✅ Perfil actualizado exitosamente');
          if (res.photoURL) {
            this.previewUrl.set(res.photoURL);
            this.profileForm.patchValue({ photoURL: res.photoURL });
          }
          setTimeout(() => this.successMessage.set(''), 4000);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al guardar el perfil. Intenta de nuevo.';
          this.errorMessage.set(`❌ ${msg}`);
          console.error('Error al guardar perfil:', err);
          setTimeout(() => this.errorMessage.set(''), 4000);
        },
      });
  }
}