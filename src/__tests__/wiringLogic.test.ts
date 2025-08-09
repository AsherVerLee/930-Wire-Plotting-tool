import { canConnect } from "@/utils/validation";

describe('wiring validation', () => {
  it('allows identical types', () => {
    expect(canConnect('canH', 'canH')).toBe(true);
    expect(canConnect('ethernet', 'ethernet')).toBe(true);
    expect(canConnect('power+', 'power+')).toBe(true);
  });
  it('blocks mismatched types', () => {
    expect(canConnect('canH', 'canL')).toBe(false);
    expect(canConnect('usb', 'ethernet')).toBe(false);
    expect(canConnect('signal+', 'signal-')).toBe(false);
  });
});
