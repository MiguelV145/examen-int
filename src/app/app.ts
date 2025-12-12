import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./features/Component/Navbar/Navbar";
import { Footer } from "./features/Component/Footer/Footer";
import { AuthService } from './core/services/firebase/authservice';
import { take } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('examen-int');
  private authService = inject(AuthService);
  
  // Señal para saber si ya terminamos de preguntar a Firebase
  authInitialized = signal(false);

  ngOnInit() {
    // Nos suscribimos a user$ UNA sola vez (take(1)).
    // Cuando Firebase responda (sea con un usuario o con null),
    // sabremos que la inicialización terminó.
    this.authService.user$.pipe(take(1)).subscribe(() => {
      this.authInitialized.set(true);
    });
  }
}
