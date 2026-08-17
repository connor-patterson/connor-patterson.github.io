import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ACCESSIBILITY_COPY, CONTACT_COPY, CONTACT_LINKS } from '../../../data/portfolio.data';

@Component({
  selector: 'app-contact-panel',
  standalone: true,
  templateUrl: './contact-panel.component.html',
  styleUrl: './contact-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPanelComponent {
  readonly copy = CONTACT_COPY;
  readonly links = CONTACT_LINKS;
  readonly accessibility = ACCESSIBILITY_COPY;
}
