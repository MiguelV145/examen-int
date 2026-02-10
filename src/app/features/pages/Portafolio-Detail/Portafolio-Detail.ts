import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserProfile } from '../../share/Interfaces/Interfaces-Users';
import { FormUtils } from '../../share/Formutils/Formutils';
import emailjs from '@emailjs/browser';
import { LinkPreviewService } from '../../../core/services/link-preview.service.ts';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './Portafolio-Detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioDetail implements OnInit {
  
  private route = inject(ActivatedRoute);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private linkService = inject(LinkPreviewService);

  visitedProfileId: string = '';
  targetProfile: UserProfile | null = null;
  message = signal('Detalle de portafolio - Funcionalidad en construcción. Conectar con backend cuando esté listo.');
  
  // Estado
  isEditing = signal(false);
  currentProjectId = signal<string | null>(null);
  loading = signal(false);
  loadingBooking = signal(false);
  
  // Auto-SEO
  seoPreview = signal<{title?: string, description?: string, image?: string} | null>(null);
  loadingPreview = signal(false);
  
  formUtils = FormUtils;

  // Observables placeholders para template
  notifications$: Observable<any[]> = of([]);
  profile$: Observable<any> = of(null);
  projects$: Observable<any[]> = of([]);
  currentUser$: Observable<any> = of(null);

  // Formularios
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

  constructor() { }

  ngOnInit() {
    this.visitedProfileId = this.route.snapshot.paramMap.get('id') || '';
  }

  fetchSeoData(url: string) {
    // Placeholder
  }

  isOwner(): boolean {
    return false;
  }

  async saveProject() {
    // Placeholder
  }

  openProjectModal(project?: any) {
    // Placeholder
  }

  async respondToRequest(cita: any, status: any) {
    // Placeholder
  }

  openBookingModal(profile: UserProfile, role?: string) {
    // Placeholder
  }

  isAvailableNow(profile: UserProfile): boolean {
    return true;
  }

  private timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
  }

  openMyRequestsModal() {
    // Placeholder
  }

  openAvailabilityModal(profile: UserProfile) {
    // Placeholder
  }

  async saveAvailability() {
    // Placeholder
  }

  async submitBooking() {
    // Placeholder
  }

  async toggleLike(project: any) {
    // Placeholder
  }

  isLikedByMe(project: any): boolean { 
    return false;
  }

  async deleteProject(id: string) {
    // Placeholder
  }
}
