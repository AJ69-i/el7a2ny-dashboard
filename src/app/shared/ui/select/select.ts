import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { IconComponent } from '../icon/icon';

export interface SelectOption {
  value: string;
  label: string;
}

/** Dependency-free, brand-themed dropdown (replaces native &lt;select&gt;). */
@Component({
  selector: 'app-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button type="button" class="trigger" [class.compact]="compact()" [class.open]="open()" (click)="toggle()">
      @if (label()) {
        <span class="pre">{{ label() }}</span>
      }
      <span class="val" [class.placeholder]="!selectedLabel()">{{ selectedLabel() || placeholder() }}</span>
      <app-icon name="chevron-down" class="chev" />
    </button>

    @if (open()) {
      <div class="pop" role="listbox">
        @for (o of options(); track o.value) {
          <button
            type="button"
            class="opt"
            role="option"
            [class.sel]="o.value === value()"
            [attr.aria-selected]="o.value === value()"
            (click)="choose(o.value)"
          >
            <span>{{ o.label }}</span>
            @if (o.value === value()) {
              <app-icon name="check" />
            }
          </button>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: inline-block;
        position: relative;
      }
      .trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 44px;
        padding: 0 12px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--bg-app);
        color: var(--text-strong);
        font: inherit;
        cursor: pointer;
        max-width: 100%;
      }
      .trigger.compact {
        height: 34px;
        padding: 0 10px;
        border-radius: 8px;
      }
      .trigger:hover {
        border-color: var(--brand-red-300);
      }
      .pre {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        flex: 0 0 auto;
      }
      .val {
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-transform: capitalize;
      }
      .val.placeholder {
        font-weight: 400;
        color: var(--text-muted);
        text-transform: none;
      }
      .chev {
        margin-left: auto;
        color: var(--text-muted);
        font-size: 16px;
        transition: transform var(--t-fast);
        flex: 0 0 auto;
      }
      .trigger.open .chev {
        transform: rotate(180deg);
      }
      .pop {
        position: absolute;
        z-index: 50;
        top: calc(100% + 6px);
        left: 0;
        min-width: 100%;
        width: max-content;
        max-width: 260px;
        max-height: 280px;
        overflow-y: auto;
        padding: 6px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        box-shadow: var(--shadow-lg);
        animation: sel-in 0.16s var(--ease);
      }
      .opt {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        padding: 8px 10px;
        border-radius: 8px;
        font: inherit;
        color: var(--text);
        text-align: left;
        text-transform: capitalize;
      }
      .opt:hover {
        background: color-mix(in srgb, var(--brand-red) 8%, transparent);
      }
      .opt.sel {
        color: var(--brand-red-600);
        font-weight: 700;
      }
      .opt app-icon {
        font-size: 14px;
        flex: 0 0 auto;
      }
      @keyframes sel-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
      }
    `,
  ],
})
export class SelectComponent {
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  readonly options = input<SelectOption[]>([]);
  readonly value = input<string>('');
  readonly label = input<string>('');
  readonly placeholder = input<string>('Select');
  readonly compact = input(false);
  readonly valueChange = output<string>();

  protected readonly open = signal(false);

  protected readonly selectedLabel = computed(
    () => this.options().find((o) => o.value === this.value())?.label ?? '',
  );

  protected toggle(): void {
    this.open.update((o) => !o);
  }

  protected choose(v: string): void {
    this.valueChange.emit(v);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(e: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }
}
