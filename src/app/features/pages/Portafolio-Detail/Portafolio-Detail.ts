import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute} from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, doc, docData, collection, query, where, collectionData, addDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, orderBy } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import { Observable, of, switchMap } from 'rxjs';
import { UserProfile, Project, Asesoria } from '../../share/Interfaces/Interfaces-Users';
import emailjs, { type EmailJSResponseStatus } from '@emailjs/browser';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ReactiveFormsModule, ],
  templateUrl: './Portafolio-Detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioDetail implements OnInit {
private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Observables
  profile$: Observable<UserProfile | undefined> | null = null;
  projects$: Observable<Project[]> | null = null;
  
  // 🔔 NOTIFICACIONES INTELIGENTES
  notifications$: Observable<Asesoria[]>;

  visitedProfileId: string = '';
  targetProfile: UserProfile | null = null;

  // Estados
  isEditing = signal(false);
  currentProjectId = signal<string | null>(null);
  loading = signal(false);
  loadingBooking = signal(false);

  // Formularios
  availabilityForm = this.fb.group({
    startHour: ['09:00', Validators.required],
    endHour: ['18:00', Validators.required],
    days: ['Lunes a Viernes', Validators.required]
  });

  projectForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    category: ['Academico', Validators.required],
    role: ['', Validators.required],
    technologies: ['', Validators.required],
    repoUrl: [''],
    demoUrl: ['']
  });

  bookingForm = this.fb.group({
    date: ['', Validators.required],
    time: ['', Validators.required],
    subject: ['', Validators.required],
    comment: ['', [Validators.required, Validators.minLength(5)]]
  });

  constructor() {
    // LOGICA DE NOTIFICACIONES:
    // Si soy Dueño -> Veo quién me escribe (ProgrammerId == Yo)
    // Si soy Cliente -> Veo a quién le escribí (ClientId == Yo)
    this.notifications$ = this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]); 
        
        const profileIdFromUrl = this.route.snapshot.paramMap.get('id'); 
        const isOwner = user.uid === profileIdFromUrl;

        const citasRef = collection(this.firestore, 'asesorias');
        let qCitas;

        if (isOwner) {
          // VISTA PROGRAMADOR (Recibidos)
          qCitas = query(citasRef, where('programmerId', '==', user.uid), orderBy('date', 'desc'));
        } else {
          // VISTA CLIENTE (Enviados)
          qCitas = query(citasRef, where('clientId', '==', user.uid), orderBy('date', 'desc'));
        }

        return collectionData(qCitas, { idField: 'id' }) as Observable<Asesoria[]>;
      })
    );
  }

  ngOnInit() {
    emailjs.init("rjFCNeLrN83tOInc19"); // Tu Public Key
    
    this.visitedProfileId = this.route.snapshot.paramMap.get('id') || '';
    if (this.visitedProfileId) {
      const userDoc = doc(this.firestore, 'users', this.visitedProfileId);
      this.profile$ = docData(userDoc) as Observable<UserProfile>;

      const projectsRef = collection(this.firestore, 'projects');
      const q = query(projectsRef, where('programmerId', '==', this.visitedProfileId));
      this.projects$ = collectionData(q, { idField: 'id' }) as Observable<Project[]>;
    }
  }

  isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.uid === this.visitedProfileId;
  }

  // --- 🔥 FUNCIÓN NUEVA: PROGRAMADOR RESPONDE SOLICITUD ---
  async respondToRequest(cita: Asesoria, status: 'aprobada' | 'rechazada') {
    if (!cita.id) return;
    
    const confirmMsg = status === 'aprobada' ? '¿Aceptar esta asesoría?' : '¿Rechazar esta solicitud?';
    if (!confirm(confirmMsg)) return;

    try {
      const citaRef = doc(this.firestore, 'asesorias', cita.id);
      
      await updateDoc(citaRef, {
        status: status,
        // Mensaje automático que verá el cliente
        responseMsg: status === 'aprobada' 
          ? `¡Hola! He aceptado tu solicitud. Te enviaré detalles pronto.`
          : 'Lo siento, no tengo disponibilidad en ese horario.'
      });

      alert(`Solicitud ${status} correctamente.`);
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el estado.');
    }
  }

  // --- (Resto del código igual) ---

  openMyRequestsModal() {
    if (!this.authService.currentUser()) return;
    const modal = document.getElementById('my_requests_modal') as HTMLDialogElement;
    if(modal) modal.showModal();
  }

  openAvailabilityModal(profile: UserProfile) {
    if (!this.isOwner()) return;
    if (profile.availability?.horas) {
      const [start, end] = profile.availability.horas.split(' - ');
      this.availabilityForm.patchValue({
        startHour: start || '09:00',
        endHour: end || '18:00',
        days: profile.availability.dias || 'Lunes a Viernes'
      });
    }
    const modal = document.getElementById('availability_modal') as HTMLDialogElement;
    if(modal) modal.showModal();
  }

  openProjectModal(project?: Project) {
     if (!this.isOwner()) return; 
     this.projectForm.reset({ category: 'Academico' });
     if (project) {
        this.isEditing.set(true);
        this.currentProjectId.set(project.id!);
        this.projectForm.patchValue({
           title: project.title, description: project.description,
           category: project.category as any, role: project.role,
           technologies: project.technologies.join(', '), repoUrl: project.repoUrl, demoUrl: project.demoUrl
        });
     } else {
        this.isEditing.set(false);
        this.currentProjectId.set(null);
     }
     const modal = document.getElementById('project_modal') as HTMLDialogElement;
     if(modal) modal.showModal();
  }

  openBookingModal(profile: UserProfile) {
    if (!this.authService.currentUser()) { alert('⚠️ Inicia sesión para contactar.'); return; }
    if (!this.isAvailableNow(profile)) { 
      if(!confirm(`⛔ El programador no está disponible ahora (${profile.availability?.horas}). ¿Deseas agendar igual?`)) return; 
    }
    this.targetProfile = profile;
    this.bookingForm.reset();
    const modal = document.getElementById('booking_modal') as HTMLDialogElement;
    if(modal) modal.showModal();
  }

  isAvailableNow(profile: UserProfile): boolean {
    if (!profile.availability?.horas) return true; 
    const now = new Date();
    const currentVal = now.getHours() * 60 + now.getMinutes();
    const [startStr, endStr] = profile.availability.horas.split(' - ');
    if (!startStr || !endStr) return true;
    const startVal = this.timeStringToMinutes(startStr);
    const endVal = this.timeStringToMinutes(endStr);
    return currentVal >= startVal && currentVal < endVal;
  }

  private timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
  }

  async saveAvailability() {
    if (this.availabilityForm.invalid || !this.isOwner()) return;
    this.loading.set(true);
    const { startHour, endHour, days } = this.availabilityForm.value;
    try {
      const userRef = doc(this.firestore, 'users', this.visitedProfileId);
      await updateDoc(userRef, { availability: { horas: `${startHour} - ${endHour}`, dias: days } });
      alert('✅ Horario actualizado.');
      (document.getElementById('availability_modal') as HTMLDialogElement).close();
    } catch (error) { alert('Error al guardar.'); } finally { this.loading.set(false); }
  }

  async submitBooking() {
    if (this.bookingForm.invalid) { this.bookingForm.markAllAsTouched(); return; }
    const currentUser = this.authService.currentUser();
    if (!currentUser || !this.targetProfile) return;
    this.loadingBooking.set(true);
    const formVal = this.bookingForm.value;
    try {
      await addDoc(collection(this.firestore, 'asesorias'), {
        programmerId: this.targetProfile.uid,
        programmerName: this.targetProfile.displayName,
        clientId: currentUser.uid,
        clientName: currentUser.displayName,
        date: formVal.date!, time: formVal.time!, comment: `[${formVal.subject}] ${formVal.comment}`,
        status: 'pendiente' // <--- INICIA PENDIENTE
      });
      if (this.targetProfile.email) {
        const templateParams = {
          to_email: this.targetProfile.email, to_name: this.targetProfile.displayName, from_name: currentUser.displayName,
          subject: formVal.subject, message: formVal.comment, date_time: `${formVal.date} - ${formVal.time}`,
          name: currentUser.displayName, email: currentUser.email, title: formVal.subject
        };
        await emailjs.send('service_y02aan7', 'template_faf7lba', templateParams, 'rjFCNeLrN83tOInc19');
      }
      alert('✅ Solicitud enviada con éxito.');
      (document.getElementById('booking_modal') as HTMLDialogElement).close();
    } catch (error) { alert('Error al enviar.'); } finally { this.loadingBooking.set(false); }
  }

  async saveProject() {
    if (this.projectForm.invalid || !this.isOwner()) return;
    this.loading.set(true);
    const val = this.projectForm.value;
    const data: any = { programmerId: this.visitedProfileId, title: val.title, description: val.description, category: val.category, role: val.role, technologies: (val.technologies || '').split(',').map((t: string) => t.trim()), repoUrl: val.repoUrl || '', demoUrl: val.demoUrl || '' };
    try {
        if (this.isEditing() && this.currentProjectId()) await updateDoc(doc(this.firestore, 'projects', this.currentProjectId()!), data);
        else await addDoc(collection(this.firestore, 'projects'), data);
        (document.getElementById('project_modal') as HTMLDialogElement).close();
    } catch (e: any) { alert(e.message); } finally { this.loading.set(false); }
  }

  async toggleLike(project: Project) {
    const user = this.authService.currentUser();
    if (!user) { alert('Inicia sesión para dar like.'); return; }
    if (!project.id) return;
    const ref = doc(this.firestore, 'projects', project.id);
    const liked = project.likes?.includes(user.uid);
    liked ? await updateDoc(ref, { likes: arrayRemove(user.uid) }) : await updateDoc(ref, { likes: arrayUnion(user.uid) });
  }

  isLikedByMe(project: Project): boolean { return project.likes?.includes(this.authService.currentUser()?.uid || '') || false; }
  async deleteProject(id: string) { if (!this.isOwner() || !confirm('¿Borrar?')) return; await deleteDoc(doc(this.firestore, 'projects', id)); }

}