import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './Footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer { 

 currentYear: number = new Date().getFullYear();
}
