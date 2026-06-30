import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { EmergencyService, SortKey } from '../../../../core/services/emergency.service';
import { IEmergencyView } from '../../../../shared/interfaces/emergency';
import { initials, timeAgo, formatDateTime } from '../../../../shared/utils/ui';
import { IconComponent } from '../../../../shared/ui/icon/icon';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-requests-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, StatusBadgeComponent],
  templateUrl: './requests-table.html',
  styleUrl: './requests-table.scss',
})
export class RequestsTableComponent {
  protected readonly em = inject(EmergencyService);

  readonly rows = input<IEmergencyView[]>([]);
  readonly sortable = input<boolean>(true);
  readonly select = output<IEmergencyView>();

  protected readonly initials = initials;
  protected readonly timeAgo = timeAgo;
  protected readonly formatDateTime = formatDateTime;

  protected onSort(key: SortKey): void {
    if (this.sortable()) this.em.setSort(key);
  }

  protected sortIcon(key: SortKey): string {
    if (!this.sortable() || this.em.sortKey() !== key) return '';
    return this.em.sortDir() === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  protected trackKey(_: number, r: IEmergencyView): string {
    return r.key;
  }
}
