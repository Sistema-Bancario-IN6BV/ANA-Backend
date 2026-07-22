'use strict';

import { describe, it, expect } from 'vitest';
import Medication from './medications.model.js';

const baseDoc = { elderly: 'elder-1', name: 'Metformina', dose: '500mg' };

describe('Medication model validation', () => {
    it('accepts valid HH:mm times', () => {
        const doc = new Medication({ ...baseDoc, times: ['08:00', '20:30'] });
        expect(doc.validateSync()).toBeUndefined();
    });

    it('rejects an empty times array', () => {
        const doc = new Medication({ ...baseDoc, times: [] });
        expect(doc.validateSync()?.errors?.times).toBeDefined();
    });

    it('rejects malformed time strings', () => {
        const doc = new Medication({ ...baseDoc, times: ['8am'] });
        expect(doc.validateSync()?.errors?.times).toBeDefined();
    });

    it('rejects out-of-range hours', () => {
        const doc = new Medication({ ...baseDoc, times: ['25:00'] });
        expect(doc.validateSync()?.errors?.times).toBeDefined();
    });

    it('requires name and dose', () => {
        const doc = new Medication({ elderly: 'elder-1', times: ['08:00'] });
        const error = doc.validateSync();
        expect(error.errors.name).toBeDefined();
        expect(error.errors.dose).toBeDefined();
    });
});
