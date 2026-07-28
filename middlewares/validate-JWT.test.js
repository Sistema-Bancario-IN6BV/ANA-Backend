'use strict';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { validateJWT } from './validate-JWT.js';

const mockRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('validateJWT', () => {
    const originalSecret = process.env.JWT_SECRET;

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
        process.env.JWT_SECRET = originalSecret;
    });

    it('rejects with 401 when no token is provided', () => {
        const req = { header: () => undefined };
        const res = mockRes();
        const next = vi.fn();

        validateJWT(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects with 401 for an invalid token', () => {
        const req = { header: (name) => (name === 'x-token' ? 'not-a-real-token' : undefined) };
        const res = mockRes();
        const next = vi.fn();

        validateJWT(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('populates req.user and calls next for a valid token', () => {
        const token = jwt.sign({ sub: 'user-1', role: 'ELDERLY_ROLE' }, 'test-secret');
        const req = { header: (name) => (name === 'x-token' ? token : undefined) };
        const res = mockRes();
        const next = vi.fn();

        validateJWT(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(req.user).toMatchObject({ id: 'user-1', role: 'ELDERLY_ROLE' });
    });

    it('defaults role to USER_ROLE when the token has no role claim', () => {
        const token = jwt.sign({ sub: 'user-2' }, 'test-secret');
        const req = { header: (name) => (name === 'x-token' ? token : undefined) };
        const res = mockRes();
        const next = vi.fn();

        validateJWT(req, res, next);

        expect(req.user.role).toBe('USER_ROLE');
    });
});
