import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('email service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })
    );

    process.env.RESEND_API_KEY = 're_test_123';
    process.env.EMAIL_FROM = 'no-reply@marlonperez.me';
    process.env.EMAIL_FROM_NAME = 'ANA';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_FROM_NAME;
  });

  it('sends verification emails through Resend', async () => {
    const { sendVerificationEmail } = await import('./email-service.js');

    await sendVerificationEmail('user@example.com', 'Marlon', 'token-123');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];

    expect(url).toBe('https://api.resend.com/emails');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer re_test_123');

    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      from: 'ANA <no-reply@marlonperez.me>',
      to: ['user@example.com'],
      subject: 'Verify your email address',
    });
  });
});
