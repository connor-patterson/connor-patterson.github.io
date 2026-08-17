import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface SystemLayer {
  readonly id: 'client' | 'service' | 'delivery';
  readonly label: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly decisions: readonly string[];
  readonly proof: string;
  readonly tools: readonly string[];
}

const SYSTEM_LAYERS: readonly SystemLayer[] = [
  {
    id: 'client',
    label: 'Client',
    eyebrow: 'Browser layer',
    title: 'Fast interfaces with fewer surprises',
    summary:
      'I treat the browser as part of the system, not a coat of paint over it. State, accessibility, and network behavior are designed together.',
    decisions: [
      'Cache stable reads and invalidate them after writes.',
      'Skip no-op updates instead of sending work the server does not need.',
      'Keep complex form state explicit so retrieval and editing behave the same way.',
    ],
    proof:
      'Moved shared UI code through multiple Angular versions while keeping consuming applications working.',
    tools: ['Angular', 'TypeScript', 'RxJS', 'Accessibility', 'Component design'],
  },
  {
    id: 'service',
    label: 'Services',
    eyebrow: 'Application layer',
    title: 'Clear boundaries, boring failure modes',
    summary:
      'Service code should make ownership obvious. I focus on translation boundaries, request scope, safe identifiers, and useful diagnostics.',
    decisions: [
      'Build invariant graphs once per request instead of once per item.',
      'Resolve sensitive data behind the service boundary.',
      'Keep fallbacks observable and test the odd paths, not only the happy one.',
    ],
    proof:
      'Completed a coordinated feature across UI, API, rules, and configuration with a smaller acceptance suite.',
    tools: ['Java', 'Node.js', 'REST', 'Caching', 'Contract testing'],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    eyebrow: 'Release layer',
    title: 'Confidence before cleverness',
    summary:
      'The work is not done when it compiles. Pipelines, rollback paths, diagnostics, and useful test coverage are part of the design.',
    decisions: [
      'Validate an upstream artifact inside the downstream pipeline before release.',
      'Gate risky behavior so it can be disabled without a scramble.',
      'Revert early when evidence says a change is unsafe, then restore it with focused coverage.',
    ],
    proof:
      'Raised the reliability of a long-running acceptance suite and stabilized a flaky sign-in path.',
    tools: ['CI/CD', 'AAT', 'Feature flags', 'Observability', 'Release planning'],
  },
];

@Component({
  selector: 'app-systems-panel',
  templateUrl: './systems-panel.component.html',
  styleUrl: './systems-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemsPanelComponent {
  protected readonly layers = SYSTEM_LAYERS;
  protected readonly selectedId = signal<SystemLayer['id']>('client');

  protected selectedLayer(): SystemLayer {
    return this.layers.find(({ id }) => id === this.selectedId()) ?? this.layers[0]!;
  }
}
