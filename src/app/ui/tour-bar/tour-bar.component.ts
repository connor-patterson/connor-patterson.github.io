import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-tour-bar',
  standalone: true,
  templateUrl: './tour-bar.component.html',
  styleUrl: './tour-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourBarComponent {
  readonly label = input.required<string>();
  readonly prompt = input.required<string>();
  readonly step = input.required<number>();
  readonly total = input.required<number>();
  readonly previousRequested = output<void>();
  readonly nextRequested = output<void>();
  readonly endRequested = output<void>();
}
