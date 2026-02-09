import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./features/Component/Navbar/Navbar";
import { Footer } from "./features/Component/Footer/Footer";
import { AuthService } from './core/services/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('examen-int');
  private authService = inject(AuthService);
  // Esta señal empieza en TRUE (el AuthService carga dato de localStorage en constructor)
  authInitialized = signal(true);
}
