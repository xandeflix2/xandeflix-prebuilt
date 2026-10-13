import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';

export interface MultiDeviceContact { whatsapp: string; }
interface ContactRpcRequest extends PromiseLike<{ data: unknown; error?: unknown }> {
  abortSignal?: (signal: AbortSignal) => ContactRpcRequest;
}
export interface ContactRpcClient { rpc(name: string, params: Record<string, unknown>): ContactRpcRequest; }

export function normalizeWhatsapp(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (!/^\+?[0-9 ()-]+$/.test(trimmed)) throw new Error('INVALID_WHATSAPP');
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (!/^[1-9][0-9]{7,14}$/.test(digits)) throw new Error('INVALID_WHATSAPP');
  return digits;
}

export function whatsappContactUrl(contact: MultiDeviceContact | null): string | null {
  return contact && /^[1-9][0-9]{7,14}$/.test(contact.whatsapp) ? `https://wa.me/${contact.whatsapp}` : null;
}

function parseContact(data: unknown): MultiDeviceContact {
  if (typeof data !== 'object' || data === null) throw new Error('CONTACT_UNAVAILABLE');
  const result = data as Record<string, unknown>;
  if (result.success !== true || typeof result.whatsapp !== 'string' ||
    (result.whatsapp !== '' && !/^[1-9][0-9]{7,14}$/.test(result.whatsapp))) throw new Error('CONTACT_UNAVAILABLE');
  // Public UI receives only this administrative, published field.
  return { whatsapp: result.whatsapp };
}

export class MultiDeviceContactService {
  constructor(private readonly client: ContactRpcClient | undefined, private readonly timeoutMs = 8000) {}

  private async call(name: string, params: Record<string, unknown>, signal?: AbortSignal): Promise<MultiDeviceContact> {
    if (!this.client) throw new Error('CONTACT_UNAVAILABLE');
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;
    try {
      const cancelled = new Promise<never>((_, reject) => {
        onAbort = () => { controller.abort(); reject(new Error('CONTACT_UNAVAILABLE')); };
        if (signal?.aborted) onAbort();
        else signal?.addEventListener('abort', onAbort, { once: true });
        timer = setTimeout(onAbort, this.timeoutMs);
      });
      if (signal?.aborted) return await cancelled;
      let request = this.client.rpc(name, params);
      if (request.abortSignal) request = request.abortSignal(controller.signal);
      const result = await Promise.race([Promise.resolve(request), cancelled]);
      if (result.error) {
        const message = (result.error as { message?: unknown }).message;
        if (message === 'MASTER_MANAGER_NOT_AUTHORIZED' || message === 'MANAGER_AUTH_REQUIRED') throw new Error('MASTER_MANAGER_NOT_AUTHORIZED');
        if (message === 'INVALID_WHATSAPP') throw new Error('INVALID_WHATSAPP');
        throw new Error('CONTACT_UNAVAILABLE');
      }
      return parseContact(result.data);
    } catch (error) {
      if (error instanceof Error && ['MASTER_MANAGER_NOT_AUTHORIZED', 'INVALID_WHATSAPP'].includes(error.message)) throw error;
      throw new Error('CONTACT_UNAVAILABLE');
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (onAbort) signal?.removeEventListener('abort', onAbort);
    }
  }
  readPublic(signal?: AbortSignal): Promise<MultiDeviceContact> { return this.call('rpc_public_get_multi_device_contact', {}, signal); }
  readForMaster(signal?: AbortSignal): Promise<MultiDeviceContact> { return this.call('rpc_manager_get_multi_device_contact', {}, signal); }
  saveForMaster(whatsapp: string, signal?: AbortSignal): Promise<MultiDeviceContact> {
    return this.call('rpc_manager_set_multi_device_contact', { p_whatsapp: normalizeWhatsapp(whatsapp) }, signal);
  }
}

export function getMultiDeviceContactService(): MultiDeviceContactService {
  return new MultiDeviceContactService(getSupabaseBrowserClient());
}
