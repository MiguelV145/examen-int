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
  templateUrl: './Programmer-Page.html',
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
      const reader = new FileReader();
      reader.onload = (e) => { this.previewUrl.set(e.target?.result as string); };
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
    const data = { ...this.profileForm.value, skills: this.skills() };

    from(updateDoc(docRef, data)).pipe(
      tap(() => {
        this.successMessage.set('¡Perfil actualizado!');
        setTimeout(() => this.successMessage.set(''), 3000);
      }),
      catchError(() => {
        this.errorMessage.set('Error al guardar.');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
}