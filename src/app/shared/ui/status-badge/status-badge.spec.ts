import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge';

describe('StatusBadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('renders the human-readable status label', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', 'en_route');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('En route');
  });
});
