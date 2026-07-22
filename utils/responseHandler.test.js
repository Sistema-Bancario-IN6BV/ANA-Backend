'use strict';

import { describe, it, expect, vi } from 'vitest';
import { sendResponse } from './responseHandler.js';

const mockRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('sendResponse', () => {
    it('sets the status code and returns success/message', () => {
        const res = mockRes();

        sendResponse(res, 201, true, 'Creado exitosamente');

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Creado exitosamente',
        });
    });

    it('includes data in the payload when provided', () => {
        const res = mockRes();

        sendResponse(res, 200, true, 'OK', { id: 1 });

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'OK',
            data: { id: 1 },
        });
    });

    it('omits the data key entirely when data is null', () => {
        const res = mockRes();

        sendResponse(res, 400, false, 'Error');

        const payload = res.json.mock.calls[0][0];
        expect('data' in payload).toBe(false);
    });
});
