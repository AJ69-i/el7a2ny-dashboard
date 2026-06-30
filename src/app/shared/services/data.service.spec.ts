import { TestBed } from '@angular/core/testing';
import { Database } from '@angular/fire/database';
import { DataService } from './data.service';

describe('DataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      // Stub the Firebase Database token so the service can be created without a live app.
      providers: [{ provide: Database, useValue: {} as Database }],
    });
  });

  it('is created', () => {
    expect(TestBed.inject(DataService)).toBeTruthy();
  });
});
