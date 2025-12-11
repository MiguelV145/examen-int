import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// Firebase
import { Firestore, doc, docData, collection, query, where, collectionData, addDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, orderBy } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
// RxJS
import { Observable, of, switchMap } from 'rxjs';
import { UserProfile, Project, Asesoria } from '../../share/Interfaces/Interfaces-Users';
// EmailJS
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ReactiveFormsModule],
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
  notifications$: Observable<Asesoria[]>; // Notificaciones inteligentes

  visitedProfileId: string = '';
  targetProfile: UserProfile | null = null;
  
  // Estados
  isEditing = signal(false);
  currentProjectId = signal<string | null>(null);
  loading = signal(false);
  loadingBooking = signal(false);

  // 1. Formulario de Horario
  availabilityForm = this.fb.group({
    startHour: ['09:00', Validators.required],
    endHour: ['18:00', Validators.required],
    days: ['Lunes a Viernes', Validators.required]
  });

  // 2. Formulario de Proyectos
  projectForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    category: ['Academico', Validators.required],
    role: ['', Validators.required],
    technologies: ['', Validators.required],
    repoUrl: [''],
    demoUrl: ['']
  });

  // 3. Formulario de Contacto
  bookingForm = this.fb.group({
    date: ['', Validators.required],
    time: ['', Validators.required],
    subject: ['', Validators.required],
    comment: ['', [Validators.required, Validators.minLength(5)]]
  });

  constructor() {
    // Lógica de Notificaciones:
    // Si soy el DUEÑO del perfil -> Veo solicitudes RECIBIDAS (programmerId == yo)
    // Si soy un CLIENTE -> Veo solicitudes ENVIADAS (clientId == yo)
    this.notifications$ = this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);
        
        // Obtenemos el ID del perfil que estamos visitando desde la URL
        const profileIdFromUrl = this.route.snapshot.paramMap.get('id');
        const isOwnerOfPage = user.uid === profileIdFromUrl;

        const citasRef = collection(this.firestore, 'asesorias');
        let qCitas;

        if (isOwnerOfPage) {
          // Soy el dueño: muéstrame quién me quiere contactar
          qCitas = query(citasRef, where('programmerId', '==', user.uid), orderBy('date', 'desc'));
        } else {
          // Soy cliente: muéstrame mis solicitudes enviadas
          qCitas = query(citasRef, where('clientId', '==', user.uid), orderBy('date', 'desc'));
        }

        return collectionData(qCitas, { idField: 'id' }) as Observable<Asesoria[]>;
      })
    );
  }

  ngOnInit() {
    // 1. Inicializar EmailJS con tu Public Key (IMAGEN: image_18cdf8.png)
    emailjs.init("rjFCNeLrN83tOInc19");

    // 2. Cargar Perfil y Proyectos
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

  // --- 🔥 GESTIÓN DE SOLICITUDES (RESPONDER) ---
  async respondToRequest(cita: Asesoria, status: 'aprobada' | 'rechazada') {
    if (!cita.id) return;
    
    let mensaje = '';

    if (status === 'aprobada') {
      if (!confirm('¿Aceptar esta asesoría?')) return;
      mensaje = '¡Hola! He aceptado tu solicitud. Pronto te enviaré los detalles de la reunión.';
    } else {
      const motivo = prompt('Por favor, escribe el motivo del rechazo:');
      if (!motivo) return; // Cancelar si no escribe nada
      mensaje = motivo;
    }

    try {
      const citaRef = doc(this.firestore, 'asesorias', cita.id);
      await updateDoc(citaRef, {
        status: status,
        responseMsg: mensaje
      });
      alert(`Solicitud ${status} correctamente.`);
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el estado.');
    }
  }

  // --- MODALES ---
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
    if (!this.authService.currentUser()) {
      alert('⚠️ Inicia sesión para contactar.');
      return;
    }
    
    // Validación de Horario antes de abrir
    if (!this.isAvailableNow(profile)) {
      alert(`⛔ El programador no está disponible en este momento.\nHorario: ${profile.availability?.horas}`);
      return; 
    }

    this.targetProfile = profile;
    this.bookingForm.reset();
    const modal = document.getElementById('booking_modal') as HTMLDialogElement;
    if(modal) modal.showModal();
  }

  // --- LÓGICA DE HORARIO ---
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
      await updateDoc(userRef, {
        availability: {
          horas: `${startHour} - ${endHour}`,
          dias: days
        }
      });
      alert('✅ Horario actualizado.');
      (document.getElementById('availability_modal') as HTMLDialogElement).close();
    } catch (error) {
      console.error(error);
      alert('Error al guardar.');
    } finally {
      this.loading.set(false);
    }
  }

  // --- ENVÍO DE CORREO Y CITA (EMAILJS) ---
  async submitBooking() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }
    
    const currentUser = this.authService.currentUser();
    if (!currentUser || !this.targetProfile) return;

    // Doble chequeo de horario
    if (!this.isAvailableNow(this.targetProfile)) {
      alert('Estás fuera del horario de atención.');
      return;
    }

    this.loadingBooking.set(true);
    const formVal = this.bookingForm.value;

    try {
      // 1. Guardar en Base de Datos (Para Admin y Notificaciones)
      await addDoc(collection(this.firestore, 'asesorias'), {
        programmerId: this.targetProfile.uid,
        programmerName: this.targetProfile.displayName || 'Programador',
        clientId: currentUser.uid,
        clientName: currentUser.displayName || currentUser.email,
        date: formVal.date!,
        time: formVal.time!,
        comment: `[${formVal.subject}] ${formVal.comment}`,
        status: 'pendiente' // <--- Inicia pendiente
      });

      // 2. Enviar Correo con EmailJS
      if (this.targetProfile.email) {
        
        // Variables EXACTAS de tu plantilla (IMAGEN: image_1927f1.png y image_1859f4.png)
        const templateParams = {
          to_email: this.targetProfile.email,       // Destinatario
          to_name: this.targetProfile.displayName,  
          from_name: currentUser.displayName || 'Usuario',
          
          title: formVal.subject,                   // Asunto ({{title}})
          message: formVal.comment,                 // Mensaje ({{message}})
          date_time: `${formVal.date} - ${formVal.time}`,
          
          name: currentUser.displayName || currentUser.email, // ({{name}})
          email: currentUser.email                  // ({{email}}) Reply-To
        };

        await emailjs.send(
          'service_y02aan7',   // Service ID
          'template_faf7lba',  // Template ID
          templateParams,
          'rjFCNekN83tOlNc19' // Public Key (Por seguridad la pasamos aquí también)
        );
      }
      
      alert('✅ Solicitud enviada con éxito.');
      const modal = document.getElementById('booking_modal') as HTMLDialogElement;
      if(modal) modal.close();
      
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error al enviar: ' + (error.text || error.message || 'Desconocido'));
    } finally {
      this.loadingBooking.set(false);
    }
  }

  // --- GESTIÓN DE PROYECTOS ---
  async saveProject() {
    if (this.projectForm.invalid || !this.isOwner()) return;
    this.loading.set(true);
    const val = this.projectForm.value;
    const data: any = {
        programmerId: this.visitedProfileId, title: val.title, description: val.description,
        category: val.category, role: val.role, 
        technologies: (val.technologies || '').split(',').map((t: string) => t.trim()),
        repoUrl: val.repoUrl || '', demoUrl: val.demoUrl || ''
    };
    try {
        if (this.isEditing() && this.currentProjectId()) {
            await updateDoc(doc(this.firestore, 'projects', this.currentProjectId()!), data);
        } else {
            await addDoc(collection(this.firestore, 'projects'), data);
        }
        (document.getElementById('project_modal') as HTMLDialogElement).close();
    } catch (e: any) { alert(e.message); } 
    finally { this.loading.set(false); }
  }

  async toggleLike(project: Project) {
    const user = this.authService.currentUser();
    if (!user) { alert('Inicia sesión para dar like.'); return; }
    if (!project.id) return;
    const ref = doc(this.firestore, 'projects', project.id);
    const liked = project.likes?.includes(user.uid);
    liked ? await updateDoc(ref, { likes: arrayRemove(user.uid) }) : await updateDoc(ref, { likes: arrayUnion(user.uid) });
  }

  isLikedByMe(project: Project): boolean {
    return project.likes?.includes(this.authService.currentUser()?.uid || '') || false;
  }
  
  async deleteProject(id: string) {
    if (!this.isOwner() || !confirm('¿Borrar?')) return;
    await deleteDoc(doc(this.firestore, 'projects', id));
  }
}