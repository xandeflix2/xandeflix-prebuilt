import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import { ensurePendingDeviceActivationRequest } from './device-activation-sync.service.ts';
import { getDeviceActivationService } from './device-activation.service.ts';
import { validDeviceCode } from '../../ui/activation/device-code-input.ts';

export type ActivationTvPlatform = 'ANDROID_TV' | 'FIRE_TV' | 'TIZEN' | 'WEBOS';
export const tvPlatformLabels: Record<ActivationTvPlatform, string> = { ANDROID_TV: 'Android TV / TV Box', FIRE_TV: 'Fire TV', TIZEN: 'Samsung Tizen', WEBOS: 'LG webOS' };
export interface ActivationNotification {
  id: string; displayCode: string; nickname: string; platform: ActivationTvPlatform;
  receivedAt: string; read: boolean; available: boolean;
}
export interface ActivationNotificationClaim { id: string; displayCode: string; nickname: string; platform: ActivationTvPlatform; expiresAt: string; }
export interface ActivationNotificationInbox { unreadCount: number; notifications: ActivationNotification[]; hasMore: boolean; }
export const uuidValue = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const platformValue = (value: unknown): value is ActivationTvPlatform => typeof value === 'string' && Object.hasOwn(tvPlatformLabels, value);
export function validActivationNickname(value: string): boolean { return value.trim().length >= 2 && value.trim().length <= 80 && !/[\x00-\x1f\x7f<>]|https?:|www\./i.test(value); }
interface RpcRequest extends PromiseLike<{ data: unknown; error?: unknown }> { abortSignal?: (signal: AbortSignal) => RpcRequest; }
interface RpcClient { rpc(name: string, params: Record<string, unknown>): RpcRequest; }
interface Proof { activationId: string; deviceId: string; activationStatusSecret: string; }
async function loadProof(): Promise<Proof | null> {
  if (!await ensurePendingDeviceActivationRequest()) return null;
  return getDeviceActivationService().getPendingActivation();
}
export class ActivationHandoffService {
  constructor(private readonly client: RpcClient | undefined, private readonly proof: () => Promise<Proof | null> = loadProof, private readonly timeout = 10_000) {}
  private async call(name: string, params: Record<string, unknown>, signal?: AbortSignal): Promise<Record<string, unknown>> {
    if (!this.client || signal?.aborted) throw new Error('HANDOFF_UNAVAILABLE');
    const controller = new AbortController(); let cancel: (() => void) | undefined, timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const stopped = new Promise<never>((_, reject) => { cancel = () => { controller.abort(); reject(new Error('HANDOFF_UNAVAILABLE')); }; signal?.addEventListener('abort', cancel, { once: true }); timer = setTimeout(cancel, this.timeout); });
      let request = this.client.rpc(name, params); if (request.abortSignal) request = request.abortSignal(controller.signal);
      const result = await Promise.race([Promise.resolve(request), stopped]);
      if (result.error || !record(result.data) || result.data.success !== true) {
        const code = record(result.data) ? result.data.code : '';
        throw new Error(['HANDOFF_RATE_LIMIT', 'HANDOFF_ROUTING_INVALID', 'HANDOFF_EXPIRED'].includes(String(code)) ? String(code) : 'HANDOFF_UNAVAILABLE');
      }
      return result.data;
    } finally { if (timer) clearTimeout(timer); if (cancel) signal?.removeEventListener('abort', cancel); }
  }
  async send(nickname: string, platform: ActivationTvPlatform, managerCode: string, signal?: AbortSignal): Promise<string> {
    const routing = managerCode.trim().toUpperCase();
    if (!validActivationNickname(nickname) || !platformValue(platform) || (routing && !/^[A-Z0-9]{8}$/.test(routing))) throw new Error('HANDOFF_DATA_INVALID');
    const proof = await this.proof(); if (!proof || signal?.aborted) throw new Error('HANDOFF_UNAVAILABLE');
    const data = await this.call('rpc_device_send_activation_notification', { p_activation_id: proof.activationId, p_device_id: proof.deviceId, p_status_secret: proof.activationStatusSecret, p_nickname: nickname.trim(), p_platform: platform, p_manager_code: routing || null }, signal);
    if (!uuidValue(data.notificationId)) throw new Error('HANDOFF_UNAVAILABLE'); return data.notificationId;
  }
  async routingCode(signal?: AbortSignal): Promise<string> {
    const data = await this.call('rpc_manager_activation_routing_code', {}, signal);
    if (typeof data.code !== 'string' || !/^[A-Z0-9]{8}$/.test(data.code)) throw new Error('HANDOFF_UNAVAILABLE'); return data.code;
  }
  async inbox(beforeId?: string, signal?: AbortSignal): Promise<ActivationNotificationInbox> {
    if (beforeId !== undefined && !uuidValue(beforeId)) throw new Error('HANDOFF_UNAVAILABLE');
    const data = await this.call('rpc_manager_activation_notifications', { p_before_id: beforeId ?? null }, signal);
    if (!Number.isSafeInteger(data.unreadCount) || Number(data.unreadCount) < 0 || typeof data.hasMore !== 'boolean' || !Array.isArray(data.notifications) || data.notifications.length > 50) throw new Error('HANDOFF_UNAVAILABLE');
    const notifications = data.notifications.map(item => {
      if (!record(item) || !uuidValue(item.id) || typeof item.displayCode !== 'string' || !validDeviceCode(item.displayCode) || typeof item.nickname !== 'string' || !validActivationNickname(item.nickname) || !platformValue(item.platform) || typeof item.read !== 'boolean' || typeof item.available !== 'boolean' || typeof item.receivedAt !== 'string' || !Number.isFinite(Date.parse(item.receivedAt))) throw new Error('HANDOFF_UNAVAILABLE');
      return { id: item.id, displayCode: item.displayCode, nickname: item.nickname, platform: item.platform, read: item.read, available: item.available, receivedAt: item.receivedAt };
    });
    return { unreadCount: Number(data.unreadCount), hasMore: data.hasMore, notifications };
  }
  async open(id: string, signal?: AbortSignal): Promise<ActivationNotificationClaim> {
    if (!uuidValue(id)) throw new Error('HANDOFF_UNAVAILABLE');
    const data = await this.call('rpc_manager_open_activation_notification', { p_notification_id: id }, signal);
    if (data.id !== id || typeof data.displayCode !== 'string' || !validDeviceCode(data.displayCode) || typeof data.nickname !== 'string' || !validActivationNickname(data.nickname) || !platformValue(data.platform) || typeof data.expiresAt !== 'string' || !Number.isFinite(Date.parse(data.expiresAt))) throw new Error('HANDOFF_UNAVAILABLE');
    return { id, displayCode: data.displayCode, nickname: data.nickname, platform: data.platform, expiresAt: data.expiresAt };
  }
}
export const getActivationHandoffService = () => new ActivationHandoffService(getSupabaseBrowserClient());
