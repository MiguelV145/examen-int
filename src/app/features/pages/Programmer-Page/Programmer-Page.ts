import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {  doc, docData, Firestore,  updateDoc } from '@angular/fire/firestore';
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
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  profileForm = this.fb.group({
    specialty: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    photoURL: ['']
  });

  constructor() {}

  ngOnInit() {
    this.loadCurrentData();
  }

  // Carga los datos del usuario actual
  loadCurrentData() {
    const user = this.authService.currentUser();
    
    if (user) {
      this.loading.set(true);
      const docRef = doc(this.firestore, 'users', user.uid);

      docData(docRef).pipe(
        take(1), // Toma los datos una vez
        tap(() => this.loading.set(false)),
        catchError(err => {
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

  // Guarda los cambios en Firebase
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
    const dataToUpdate = {
      specialty: this.profileForm.value.specialty,
      description: this.profileForm.value.description,
      photoURL: this.profileForm.value.photoURL
    };

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
}
