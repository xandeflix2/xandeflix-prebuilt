import { Share } from '@capacitor/share';
import { copyActivationText } from './activation-clipboard.ts';
import { validDeviceCode } from './device-code-input.ts';

export function activationShareText(displayCode: string, key: string): string {
  if (!validDeviceCode(displayCode) || !/^[0-9]{6}$/.test(key)) throw new Error('ACTIVATION_DATA_NOT_READY');
  return `Ativação Xandeflix\nCódigo ID: ${displayCode}\nChave de 6 dígitos: ${key}`;
}

export async function shareActivation(displayCode: string, key: string): Promise<'shared' | 'copied' | 'cancelled'> {
  const text = activationShareText(displayCode, key);
  if ((await Share.canShare()).value) {
    try { await Share.share({ title: 'Ativação Xandeflix', text, dialogTitle: 'Enviar dados ao gestor' }); return 'shared'; }
    catch (error) {
      if (error instanceof Error && /cancel|dismiss|abort/i.test(error.message)) return 'cancelled';
      throw new Error('SHARE_UNAVAILABLE');
    }
  }
  await copyActivationText(text);
  return 'copied';
}
