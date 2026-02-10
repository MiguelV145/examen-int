import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth.service';
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

  // Signals UI
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  message = signal('Perfil - Funcionalidad en construcción. Conectar con backend cuando esté listo.');
  
  // Datos
  skills = signal<string[]>([]);
  previewUrl = signal<string | null>(null);
  user = this.authService.currentUser;

  formUtils = FormUtils;

  profileForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    specialty: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    photoURL: [''] 
  });

  constructor() {}

  ngOnInit() {}

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
    this.successMessage.set('Funcionalidad en construcción - Conectar con backend cuando esté listo.');
    setTimeout(() => this.successMessage.set(''), 3000);
  }
}