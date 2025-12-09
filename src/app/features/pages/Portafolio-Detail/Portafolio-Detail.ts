import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { collection, collectionData, deleteDoc, doc, Firestore } from '@angular/fire/firestore';
import { AuthService, } from '../../../core/services/firebase/authservice';
import { Proyecto } from '../../share/Interfaces/Interfaces-Users';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-portafolio-detail',
  imports: [CommonModule],
  templateUrl: './Portafolio-Detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortafolioDetail {
private firestore = inject(Firestore);
  private auth = inject(AuthService);
  private router = inject(Router);

  proyectos = signal<Proyecto[]>([]);

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;

    const ref = collection(this.firestore, `users/${user.uid}/proyectos`);

    collectionData(ref, { idField: 'id' }).subscribe((data: any) => {
      this.proyectos.set(data);
    });
  }

  crearProyecto() {
    this.router.navigate(['/programmer/proyecto/nuevo']);
  }

  editarProyecto(id: string) {
    this.router.navigate([`/programmer/proyecto/${id}`]);
  }

 eliminarProyecto(id: string) {
  const user = this.auth.currentUser();
  if (!user) return; 

  const ref = doc(this.firestore, `users/${user.uid}/proyectos/${id}`);
  deleteDoc(ref);
}

}
