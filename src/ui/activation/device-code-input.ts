export function deviceCodeBody(value: string): string {
  const upper = value.trim().toUpperCase();
  const body = /^XF[\s-]/.test(upper) || /^XF[A-Z0-9]{8}$/.test(upper) ? upper.slice(2) : upper;
  return body.replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function formatDeviceCodeInput(value: string): string {
  const body = deviceCodeBody(value);
  return body ? `XF-${body.slice(0, 4)}${body.length > 4 ? '-' + body.slice(4) : ''}` : '';
}

export function validDeviceCode(value: string): boolean { return /^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(value); }
