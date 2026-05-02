import {
  bytesToBase64Url,
  buildInviteUrl,
  generateInviteToken,
  type RandomBytes,
} from './inviteToken';

describe('bytesToBase64Url', () => {
  it('encodes empty input as empty string', () => {
    expect(bytesToBase64Url(new Uint8Array())).toBe('');
  });

  it('encodes 16 bytes to a 22-character string with no padding', () => {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i += 1) bytes[i] = i;
    const encoded = bytesToBase64Url(bytes);
    expect(encoded.length).toBe(22);
    expect(encoded).not.toContain('=');
  });

  it('uses URL-safe alphabet (no +, /, or =)', () => {
    const bytes = new Uint8Array([255, 255, 255]);
    const encoded = bytesToBase64Url(bytes);
    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe('generateInviteToken', () => {
  it('returns 22-character base64url string by default', () => {
    const token = generateInviteToken();
    expect(token.length).toBe(22);
  });

  it('uses the injected RandomBytes source', () => {
    const fixed: RandomBytes = (n) => {
      const out = new Uint8Array(n);
      for (let i = 0; i < n; i += 1) out[i] = 0;
      return out;
    };
    const token = generateInviteToken(fixed);
    expect(token).toBe('AAAAAAAAAAAAAAAAAAAAAA');
  });

  it('produces different tokens on subsequent calls (default source)', () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a).not.toBe(b);
  });
});

describe('buildInviteUrl', () => {
  it('embeds the token into the invite URL', () => {
    const token = generateInviteToken();
    expect(buildInviteUrl(token)).toBe(`https://nyamnyam.app/invite/${token}`);
  });
});
