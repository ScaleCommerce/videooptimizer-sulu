// Test double for sulu-admin-bundle/services: every verb is a spy the tests script per case.
import {vi} from 'vitest';

export const Requester = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
};
