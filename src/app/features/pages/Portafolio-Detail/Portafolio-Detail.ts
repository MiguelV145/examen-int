import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// Firebase Imports
import { Firestore, doc, docData, collection, query, where, collectionData, addDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, orderBy } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
// RxJS
import { Observable, of, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserProfile, Project, Asesoria } from '../../share/Interfaces/Interfaces-Users';
// Utils & EmailJS
import { FormUtils } from '../../share/Formutils/Formutils';
import emailjs from '@emailjs/browser';
import { LinkPreviewService } from '../../../core/services/link-preview.service.ts';
// IMPORTAR EL NUEVO SERVICIO

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
  // INYECTAR EL SERVICIO
  private linkService = inject(LinkPreviewService); 

  // --- OBSERVABLES DE DATOS ---
  profile$: Observable<UserProfile | undefined> | null = null;
  projects$: Observable<Project[]> | null = null;
  notifications$: Observable<Asesoria[]>;
  currentUser$: Observable<UserProfile | undefined>; 

  // --- VARIABLES DE ESTADO ---
  visitedProfileId: string = '';
  targetProfile: UserProfile | null = null;
  
  isEditing = signal(false);
  currentProjectId = signal<string | null>(null);
  loading = signal(false);
  loadingBooking = signal(false);
  
  // NUEVOS ESTADOS PARA SEO
  seoPreview = signal<{title?: string, description?: string, image?: string} | null>(null);
  loadingPreview = signal(false);
  
  // Utilidad para formularios
  formUtils = FormUtils;

  // --- FORMULARIOS ---
  availabilityForm = this.fb.group({
    startHour: ['09:00', Validators.required],
    endHour: ['18:00', Validators.required],
    days: ['Lunes a Viernes', Validators.required]
  });

  projectForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: ['Academico', Validators.required],
    role: ['', Validators.required],
    technologies: ['', Validators.required],
    repoUrl: ['', Validators.pattern('https?://.+')],
    demoUrl: ['', Validators.pattern('https?://.+')]
  });

  bookingForm = this.fb.group({
    date: ['', Validators.required],
    time: ['', Validators.required],
    subject: ['', Validators.required],
    comment: ['', [Validators.required, Validators.minLength(5)]]
  });

  constructor() {
    // --- NUEVO: ESCUCHAR CAMBIOS EN DEMO URL ---
    this.projectForm.get('demoUrl')?.valueChanges.pipe(
      debounceTime(1000), // Esperar 1 segundo después de dejar de escribir
      distinctUntilChanged() // Solo si el valor cambió
    ).subscribe(url => {
      // Si hay URL válida, buscamos el SEO
      if (url && this.projectForm.get('demoUrl')?.valid) {
        this.fetchSeoData(url);
      } else {
        this.seoPreview.set(null);
      }
    });

    // 1. Obtener usuario actual y su rol
    this.currentUser$ = this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of(undefined);
        return docData(doc(this.firestore, 'users', user.uid)) as Observable<UserProfile>;
      })
    );

    // 2. Obtener Notificaciones
    this.notifications$ = this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);
        const profileIdFromUrl = this.route.snapshot.paramMap.get('id');
        const isOwnerOfPage = user.uid === profileIdFromUrl;
        const citasRef = collection(this.firestore, 'asesorias');
        
        if (isOwnerOfPage) {
          return collectionData(query(citasRef, where('programmerId', '==', user.uid), orderBy('date', 'desc')), { idField: 'id' });
        } else {
          return collectionData(query(citasRef, where('clientId', '==', user.uid), orderBy('date', 'desc')), { idField: 'id' });
        }
      })
    ) as Observable<Asesoria[]>;
  }

  // --- NUEVO: FUNCIÓN PARA BUSCAR SEO ---
  fetchSeoData(url: string) {
    this.loadingPreview.set(true);
    this.linkService.getMetaData(url).subscribe(data => {
      this.loadingPreview.set(false);
      if (data.image || data.title) {
        this.seoPreview.set(data);
        
        // Opcional: Autocompletar título y descripción si están vacíos
        if (!this.projectForm.get('title')?.value && data.title) {
          this.projectForm.patchValue({ title: data.title });
        }
        if (!this.projectForm.get('description')?.value && data.description) {
          this.projectForm.patchValue({ description: data.description });
        }
      }
    });
  }

  ngOnInit() {
    emailjs.init("rjFCNeLrN83tOInc19");

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

  // --- GESTIÓN DE SOLICITUDES ---
  async respondToRequest(cita: Asesoria, status: 'aprobada' | 'rechazada') {
    if (!cita.id) return;
    if (cita.status !== 'pendiente') { alert('Solicitud ya procesada.'); return; }
    
    let mensaje = '';
    if (status === 'aprobada') {
      if (!confirm('¿Aceptar esta asesoría?')) return;
      mensaje = '¡Hola! He aceptado tu solicitud. Pronto te enviaré detalles.';
    } else {
      const motivo = prompt('Motivo del rechazo (Obligatorio):');
      if (!motivo) return;
      mensaje = motivo;
    }

    try {
      await updateDoc(doc(this.firestore, 'asesorias', cita.id), { status, responseMsg: mensaje });
    } catch (error) { console.error(error); }
  }

  // --- LÓGICA DE CONTACTO ---
  openBookingModal(profile: UserProfile, role?: string) {
    if (!this.authService.currentUser()) { alert('Inicia sesión.'); return; }
    if (role === 'admin') { alert('Admins no pueden agendar.'); return; }
    if (!this.isAvailableNow(profile)) { alert(`No disponible. Horario: ${profile.availability?.horas}`); return; }

    this.targetProfile = profile;
    this.bookingForm.reset();
    (document.getElementById('booking_modal') as HTMLDialogElement).showModal();
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

  // --- MODALES ---
  openMyRequestsModal() {
    if (!this.authService.currentUser()) return;
    (document.getElementById('my_requests_modal') as HTMLDialogElement).showModal();
  }

  openAvailabilityModal(profile: UserProfile) {
    if (!this.isOwner()) return;
    if (profile.availability?.horas) {
      const [start, end] = profile.availability.horas.split(' - ');
      this.availabilityForm.patchValue({ startHour: start || '09:00', endHour: end || '18:00', days: profile.availability.dias || 'Lunes a Viernes' });
    }
    (document.getElementById('availability_modal') as HTMLDialogElement).showModal();
  }

  openProjectModal(project?: Project) {
     if (!this.isOwner()) return; 
     this.projectForm.reset({ category: 'Academico' });
     this.seoPreview.set(null); // Limpiar preview al abrir
     
     if (project) {
        this.isEditing.set(true);
        this.currentProjectId.set(project.id!);
        this.projectForm.patchValue({
           title: project.title, description: project.description, category: project.category as any,
           role: project.role, technologies: project.technologies?.join(', '), repoUrl: project.repoUrl, demoUrl: project.demoUrl
        });
        // Si editamos y ya tiene imagen, la mostramos en el preview
        if (project['image']) {
          this.seoPreview.set({ image: project['image'], title: project.title, description: project.description });
        }
     } else {
        this.isEditing.set(false);
        this.currentProjectId.set(null);
     }
     (document.getElementById('project_modal') as HTMLDialogElement).showModal();
  }

  // --- GUARDADO ---
  async saveAvailability() {
    if (this.availabilityForm.invalid || !this.isOwner()) return;
    this.loading.set(true);
    const { startHour, endHour, days } = this.availabilityForm.value;
    try {
      await updateDoc(doc(this.firestore, 'users', this.visitedProfileId), { availability: { horas: `${startHour} - ${endHour}`, dias: days } });
      (document.getElementById('availability_modal') as HTMLDialogElement).close();
    } catch (e) { alert('Error al guardar.'); } finally { this.loading.set(false); }
  }

  async submitBooking() {
    if (this.bookingForm.invalid) { this.bookingForm.markAllAsTouched(); return; }
    const currentUser = this.authService.currentUser();
    if (!currentUser || !this.targetProfile) return;
    if (!this.isAvailableNow(this.targetProfile)) { alert('Fuera de horario.'); return; }

    this.loadingBooking.set(true);
    const formVal = this.bookingForm.value;
    
    try {
      await addDoc(collection(this.firestore, 'asesorias'), {
        programmerId: this.targetProfile.uid, programmerName: this.targetProfile.displayName || 'Programador',
        clientId: currentUser.uid, clientName: currentUser.displayName || currentUser.email,
        date: formVal.date!, time: formVal.time!, comment: `[${formVal.subject}] ${formVal.comment}`, status: 'pendiente'
      });
      
      if (this.targetProfile.email) {
        const templateParams = { to_email: this.targetProfile.email, to_name: this.targetProfile.displayName, from_name: currentUser.displayName, subject: formVal.subject, title: formVal.subject, message: formVal.comment, date_time: `${formVal.date} - ${formVal.time}`, name: currentUser.displayName, email: currentUser.email };
        await emailjs.send('service_y02aan7', 'template_faf7lba', templateParams, 'rjFCNeLrN83tOInc19');
      }
      alert('✅ Solicitud enviada.');
      (document.getElementById('booking_modal') as HTMLDialogElement).close();
    } catch (e: any) { alert('Error: ' + e.message); } finally { this.loadingBooking.set(false); }
  }

  async saveProject() {
    if (this.projectForm.invalid || !this.isOwner()) {
        this.projectForm.markAllAsTouched();
        return;
    }
    this.loading.set(true);
    const val = this.projectForm.value;

    // 👇 IMPORTANTE: Capturamos la imagen de la vista previa 👇
    // Si hay algo en seoPreview(), usamos esa imagen. Si no, mandamos null.
    const seoImage = this.seoPreview()?.image || null;

    const data: any = { 
      programmerId: this.visitedProfileId,
      title: val.title, 
      description: val.description, 
      category: val.category, 
      role: val.role,
      technologies: (val.technologies || '').split(',').map((t: string) => t.trim()),
      repoUrl: val.repoUrl || '', 
      demoUrl: val.demoUrl || '',
      
      image: seoImage, // <--- ¡ESTA LÍNEA ES CLAVE! Sin esto, no se guarda.
    };
    
    try {
        if (this.isEditing() && this.currentProjectId()) {
           // Si editamos, actualizamos. 
           // Nota: Si quieres mantener la imagen vieja si no detecta una nueva, podrías validar aquí.
           await updateDoc(doc(this.firestore, 'projects', this.currentProjectId()!), data);
        } else {
           data.likes = []; // Inicializamos likes para nuevos
           await addDoc(collection(this.firestore, 'projects'), data);
        }
        (document.getElementById('project_modal') as HTMLDialogElement).close();
    } catch (e: any) { 
       alert(e.message); 
    } finally { 
       this.loading.set(false); 
    }
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