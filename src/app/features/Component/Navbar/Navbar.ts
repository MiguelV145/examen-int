import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './Navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar { }
