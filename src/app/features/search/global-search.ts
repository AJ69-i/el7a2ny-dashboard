import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AggregateService, SearchHit } from '../../core/services/aggregate.service';
import { IconComponent } from '../../shared/ui/icon/icon';

const META: Record<string, { label: string; icon: string; color: string }> = {
  customer: { label: 'Customer', icon: 'user', color: 'var(--brand-navy-600)' },
  emergency: { label: 'Emergency', icon: 'shield', color: 'var(--st-new)' },
  maintenance: { label: 'Maintenance', icon: 'wrench', color: 'var(--brand-red)' },
  amendment: { label: 'Amendment', icon: 'edit', color: 'var(--c-amber)' },
};

@Component({
  selector: 'app-global-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    @if (open()) {
      <div class="gs" (keydown.escape)="close.emit()">
        <button class="gs-backdrop" type="button" (click)="close.emit()" aria-label="Close search"></button>
        <div class="gs-panel" role="dialog" aria-label="Global search">
          <div class="gs-input">
            <app-icon name="search" />
            <input
              #box
              type="text"
              placeholder="Search customers, cars, phone, plate, VIN…"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
            <button class="gs-x" type="button" (click)="close.emit()" aria-label="Close">
              <app-icon name="x" />
            </button>
          </div>
          <div class="gs-results">
            @if (query().trim() === '') {
              <p class="hint">Type a name, phone, plate, or VIN to search every module.</p>
            } @else if (results().length === 0) {
              <p class="hint">No matches for “{{ query() }}”.</p>
            } @else {
              @for (h of results(); track $index) {
                <a class="hit" [routerLink]="linkFor(h)" (click)="close.emit()">
                  <span class="hit-ic" [style.color]="META[h.kind].color">
                    <app-icon [name]="META[h.kind].icon" />
                  </span>
                  <div class="hit-body">
                    <strong>{{ h.record.name || '—' }}</strong>
                    <span>{{ sub(h) }}</span>
                  </div>
                  <span class="hit-kind">{{ META[h.kind].label }}{{ h.archived ? ' · archived' : '' }}</span>
                </a>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .gs {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 12vh 16px 16px;
      }
      .gs-backdrop {
        position: fixed;
        inset: 0;
        border: none;
        background: rgba(13, 13, 16, 0.5);
        backdrop-filter: blur(3px);
        animation: fade 0.2s var(--ease);
      }
      .gs-panel {
        position: relative;
        z-index: 1;
        width: min(620px, 100%);
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        animation: pop 0.2s var(--ease);
      }
      .gs-input {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        height: 58px;
        border-bottom: 1px solid var(--border);
        color: var(--text-muted);
        font-size: 19px;
      }
      .gs-input input {
        flex: 1;
        border: none;
        outline: none;
        background: none;
        font: inherit;
        font-size: 1rem;
        color: var(--text-strong);
        min-width: 0;
      }
      .gs-x {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        color: var(--text-muted);
        font-size: 16px;
      }
      .gs-x:hover {
        background: var(--bg-muted);
        color: var(--text-strong);
      }
      .gs-results {
        max-height: 56vh;
        overflow-y: auto;
        padding: 6px;
      }
      .hint {
        padding: 22px 16px;
        color: var(--text-muted);
        font-size: var(--fs-sm);
        text-align: center;
      }
      .hit {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 11px 12px;
        border-radius: var(--r-md);
      }
      .hit:hover {
        background: color-mix(in srgb, var(--brand-red) 7%, transparent);
      }
      .hit-ic {
        width: 38px;
        height: 38px;
        flex: 0 0 auto;
        border-radius: 11px;
        display: grid;
        place-items: center;
        font-size: 18px;
        background: color-mix(in srgb, currentColor 13%, transparent);
      }
      .hit-body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }
      .hit-body strong {
        color: var(--text-strong);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hit-body span {
        font-size: var(--fs-sm);
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hit-kind {
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--text-muted);
        white-space: nowrap;
      }
      @keyframes fade {
        from { opacity: 0; }
      }
      @keyframes pop {
        from { transform: translateY(-8px); opacity: 0; }
      }
    `,
  ],
})
export class GlobalSearchComponent {
  private readonly agg = inject(AggregateService);

  readonly open = input(false);
  readonly close = output<void>();

  protected readonly META = META;
  protected readonly query = signal('');
  protected readonly results = computed<SearchHit[]>(() => this.agg.search(this.query()));

  private readonly box = viewChild<ElementRef<HTMLInputElement>>('box');

  constructor() {
    effect(() => {
      if (this.open()) {
        const el = this.box()?.nativeElement;
        if (el) setTimeout(() => el.focus());
      } else {
        this.query.set('');
      }
    });
  }

  protected linkFor(h: SearchHit): (string | number)[] {
    const id = h.record.id ?? h.record.key;
    return ['/customer', id];
  }

  protected sub(h: SearchHit): string {
    return [h.record.carModel, h.record.carPlateNumber, h.record.telephone, h.record.cityName]
      .filter(Boolean)
      .join(' · ');
  }
}
