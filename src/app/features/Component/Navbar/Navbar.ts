import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './Navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar { 
  
}
