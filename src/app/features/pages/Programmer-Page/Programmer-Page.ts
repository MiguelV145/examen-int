import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { collection, collectionData, deleteDoc, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import { Observable } from 'rxjs';
import { UserProfile } from '../../share/Interfaces/Interfaces-Users';

@Component({
  selector: 'app-programmer-page',
  imports: [],
  templateUrl: './Programmer-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgrammerPage { 

  private firestore = inject(Firestore);
  public authService = inject(AuthService);

  users$: Observable<UserProfile[]>;

  constructor() {
    const usersCollection = collection(this.firestore, 'users');
    this.users$ = collectionData(usersCollection, { idField: 'uid' }) as Observable<UserProfile[]>;
  }

  addProyecto(user: UserProfile) {
    const userRef = doc(this.firestore, 'users', user.uid);
    return updateDoc(userRef, { hasProyecto: true });
  } 
}
