import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import type { CdkDragEnd } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import type {
  AppId,
  DesktopAppDefinition,
  DesktopWindowState,
  Point,
  WindowSize,
} from '../../core/portfolio.models';
import { AppIconComponent } from '../app-icon/app-icon.component';

interface ResizeSession {
  readonly pointerId: number;
  readonly x: number;
  readonly y: number;
  readonly size: WindowSize;
}

@Component({
  selector: 'app-window-frame',
  imports: [CdkDrag, CdkDragHandle, AppIconComponent],
  templateUrl: './window-frame.component.html',
  styleUrl: './window-frame.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowFrameComponent {
  readonly app = input.required<DesktopAppDefinition>();
  readonly state = input.required<DesktopWindowState>();
  readonly compact = input(false);
  readonly active = input(false);

  readonly closeRequested = output<AppId>();
  readonly minimizeRequested = output<AppId>();
  readonly maximizeRequested = output<AppId>();
  readonly shareRequested = output<AppId>();
  readonly focused = output<AppId>();
  readonly moved = output<{ id: AppId; position: Point }>();
  readonly resized = output<{ id: AppId; size: WindowSize }>();

  readonly titleId = computed(() => `window-title-${this.app().id}`);
  readonly resizing = signal(false);
  private resizeSession: ResizeSession | null = null;

  onFocus(): void {
    this.focused.emit(this.app().id);
  }

  onDragStart(): void {
    this.onFocus();
  }

  onDragEnd(event: CdkDragEnd): void {
    this.moved.emit({
      id: this.app().id,
      position: event.source.getFreeDragPosition(),
    });
  }

  startResize(event: PointerEvent): void {
    if (this.compact() || this.state().isMaximized) return;

    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    this.resizeSession = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      size: this.state().size,
    };
    this.resizing.set(true);
    this.onFocus();
    event.preventDefault();
    event.stopPropagation();
  }

  continueResize(event: PointerEvent): void {
    const session = this.resizeSession;
    if (!session || event.pointerId !== session.pointerId) return;

    this.emitBoundedSize({
      width: session.size.width + event.clientX - session.x,
      height: session.size.height + event.clientY - session.y,
    });
  }

  finishResize(event: PointerEvent): void {
    if (!this.resizeSession || event.pointerId !== this.resizeSession.pointerId) return;
    this.resizeSession = null;
    this.resizing.set(false);
  }

  resizeWithKeyboard(event: KeyboardEvent): void {
    const direction = {
      ArrowRight: { width: 1, height: 0 },
      ArrowLeft: { width: -1, height: 0 },
      ArrowDown: { width: 0, height: 1 },
      ArrowUp: { width: 0, height: -1 },
    }[event.key];
    if (!direction) return;

    const amount = event.shiftKey ? 64 : 24;
    const size = this.state().size;
    this.emitBoundedSize({
      width: size.width + direction.width * amount,
      height: size.height + direction.height * amount,
    });
    event.preventDefault();
    event.stopPropagation();
  }

  selectSizePreset(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const app = this.app();
    const available = this.availableSize();
    const presets: Readonly<Record<string, WindowSize>> = {
      cozy: { width: 600, height: 460 },
      default: app.defaultSize,
      wide: { width: 980, height: 660 },
      fit: available,
    };
    const chosen = presets[select.value];
    select.value = '';
    if (chosen) this.emitBoundedSize(chosen);
  }

  closeTools(event: Event, restoreFocus = false): void {
    const source = event.currentTarget;
    if (!(source instanceof Element)) return;
    const details = source.closest('details');
    if (!(details instanceof HTMLDetailsElement)) return;

    details.open = false;
    if (restoreFocus) {
      event.preventDefault();
      details.querySelector<HTMLElement>('summary')?.focus();
    }
  }

  reposition(): void {
    const app = this.app();
    const size = this.state().size;
    const right = Math.max(16, globalThis.innerWidth - size.width - 16);
    const bottom = Math.max(16, globalThis.innerHeight - size.height - 124);
    const positions = [
      { x: 16, y: 16 },
      { x: right, y: 16 },
      { x: right, y: bottom },
      { x: 16, y: bottom },
    ] as const;
    const current = this.state().position;
    const index = positions.findIndex(({ x, y }) => x === current.x && y === current.y);

    this.moved.emit({
      id: app.id,
      position: positions[(index + 1) % positions.length] ?? positions[0],
    });
  }

  private emitBoundedSize(size: WindowSize): void {
    const available = this.availableSize();
    this.resized.emit({
      id: this.app().id,
      size: {
        width: Math.min(Math.max(size.width, Math.min(360, available.width)), available.width),
        height: Math.min(Math.max(size.height, Math.min(280, available.height)), available.height),
      },
    });
  }

  private availableSize(): WindowSize {
    const position = this.state().position;
    return {
      width: Math.max(240, globalThis.innerWidth - position.x - 12),
      height: Math.max(180, globalThis.innerHeight - position.y - 124),
    };
  }
}
