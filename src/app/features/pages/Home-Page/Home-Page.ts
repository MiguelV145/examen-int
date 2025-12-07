import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  imports: [],
  templateUrl: './Home-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage { }
