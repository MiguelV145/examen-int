import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// IMPORTANTE: Agrega 'arrayUnion' y 'arrayRemove' aquí 👇
import { Firestore, doc, docData, collection, query, where, collectionData, addDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import { Observable } from 'rxjs';
import { UserProfile, Project } from '../../share/Interfaces/Interfaces-Users';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './Portafolio-Detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioDetail implements OnInit {
  
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);

  profile$: Observable<UserProfile | undefined> | null = null;
  projects$: Observable<Project[]> | null = null;
  visitedProfileId: string = '';

  isEditing = signal(false);
  currentProjectId = signal<string | null>(null);
  loading = signal(false);

  projectForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    category: ['Academico', Validators.required],
    role: ['', Validators.required],
    technologies: ['', Validators.required],
    repoUrl: [''],
    demoUrl: ['']
  });

  ngOnInit() {
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

  sendEmail(prog: UserProfile) {
    if (!prog.email) {
      alert('Este programador no tiene correo público.');
      return;
    }
    const currentUser = this.authService.currentUser();
    const myName = currentUser ? (currentUser.displayName || 'Un usuario') : 'Interesado';
    const subject = `Solicitud de Asesoría - Portafolio`;
    const body = `Hola ${prog.displayName || 'Programador'},\n\nSoy ${myName} y acabo de ver tus proyectos. Me gustaría agendar una asesoría contigo.\n\nSaludos.`;
    const mailtoLink = `mailto:${prog.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }

  // --- 👇 AQUÍ ESTÁN LAS FUNCIONES QUE TE FALTABAN 👇 ---

  async toggleLike(project: Project) {
    const user = this.authService.currentUser();
    
    if (!user) {
      alert('Debes iniciar sesión para destacar proyectos ⭐');
      return;
    }

    if (!project.id) return;

    const projectRef = doc(this.firestore, 'projects', project.id);
    const myUid = user.uid;

    // Verificar si ya di like
    const hasLiked = project.likes?.includes(myUid);

    try {
      if (hasLiked) {
        // QUITAR ESTRELLA
        await updateDoc(projectRef, {
          likes: arrayRemove(myUid)
        });
      } else {
        // DAR ESTRELLA
        await updateDoc(projectRef, {
          likes: arrayUnion(myUid)
        });
      }
    } catch (error) {
      console.error("Error al dar estrella:", error);
    }
  }

  isLikedByMe(project: Project): boolean {
    const user = this.authService.currentUser();
    if (!user || !project.likes) return false;
    return project.likes.includes(user.uid);
  }

  // --------------------------------------------------------

  openProjectModal(project?: Project) {
     if (!this.isOwner()) return; 
     this.projectForm.reset({ category: 'Academico' });
     if (project) {
        this.isEditing.set(true);
        this.currentProjectId.set(project.id!);
        this.projectForm.patchValue({
           title: project.title,
           description: project.description,
           category: project.category as any,
           role: project.role,
           technologies: project.technologies.join(', '),
           repoUrl: project.repoUrl,
           demoUrl: project.demoUrl
        });
     } else {
        this.isEditing.set(false);
        this.currentProjectId.set(null);
     }
     (document.getElementById('project_modal') as HTMLDialogElement).showModal();
  }

  async saveProject() {
    if (this.projectForm.invalid || !this.isOwner()) {
        this.projectForm.markAllAsTouched();
        return;
    }
    this.loading.set(true);
    const formVal = this.projectForm.value;
    const techString = formVal.technologies || ''; 
    const techArray = techString.split(',').map(t => t.trim()).filter(t => t !== '');

    const projectData: any = {
        programmerId: this.visitedProfileId,
        title: formVal.title,
        description: formVal.description,
        category: formVal.category,
        role: formVal.role,
        technologies: techArray,
        repoUrl: formVal.repoUrl || '',
        demoUrl: formVal.demoUrl || ''
    };

    try {
        if (this.isEditing() && this.currentProjectId()) {
            const docRef = doc(this.firestore, 'projects', this.currentProjectId()!);
            await updateDoc(docRef, projectData);
        } else {
            await addDoc(collection(this.firestore, 'projects'), projectData);
        }
        (document.getElementById('project_modal') as HTMLDialogElement).close();
        this.projectForm.reset({ category: 'Academico' });
    } catch (e: any) {
        console.error(e);
        alert('Error: ' + e.message); 
    } finally {
        this.loading.set(false);
    }
  }

  async deleteProject(projectId: string) {
    if (!this.isOwner()) return;
    if (!confirm('¿Eliminar proyecto?')) return;
    try { await deleteDoc(doc(this.firestore, 'projects', projectId)); } catch (e) { console.error(e); }
  }
}