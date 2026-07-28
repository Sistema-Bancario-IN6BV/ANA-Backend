'use strict';

import { describe, it, expect, vi } from 'vitest';
import { requireRole } from './validate-role.js';

const mockRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('requireRole', () => {
    it('rejects with 401 when req.user is missing', () => {
        const req = {};
        const res = mockRes();
        const next = vi.fn();

        requireRole('ADMIN_ROLE')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects with 403 when the role is not allowed', () => {
        const req = { user: { role: 'ELDERLY_ROLE' } };
        const res = mockRes();
        const next = vi.fn();

        requireRole('ADMIN_ROLE')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next when the role is allowed', () => {
        const req = { user: { role: 'ADMIN_ROLE' } };
        const res = mockRes();
        const next = vi.fn();

        requireRole('ADMIN_ROLE', 'CAREGIVER_ROLE')(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });
});
