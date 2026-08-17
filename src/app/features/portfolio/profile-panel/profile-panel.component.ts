import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CAPABILITY_GROUPS, PROFILE_COPY, PROFILE_FACTS } from '../../../data/portfolio.data';

@Component({
  selector: 'app-profile-panel',
  standalone: true,
  templateUrl: './profile-panel.component.html',
  styleUrl: './profile-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePanelComponent {
  readonly copy = PROFILE_COPY;
  readonly capabilityGroups = CAPABILITY_GROUPS;
  readonly facts = PROFILE_FACTS;
}
