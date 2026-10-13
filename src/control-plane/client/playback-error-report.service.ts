import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import { DeviceIdentityService } from '../../device/device-identity.service.ts';
import { formatPlaybackDiagnostic, parsePlaybackDiagnostic } from '../../playback/playback-support-diagnostic.ts';

interface RpcRequest extends PromiseLike<{ data: unknown; error?: unknown }> {
  abortSignal?: (signal: AbortSignal) => RpcRequest;
}
interface RpcClient { rpc(name: string, params: Record<string, unknown>): RpcRequest; }
interface DeviceProof { deviceId: string; deviceAuthToken?: string; status: string; }
export interface ManagerPlaybackReport {
  id: string; receivedAt: string; displayCode: string; deviceLabel: string; deviceType: string;
  customerName: string; diagnostic: string; read: boolean;
}
export interface PlaybackReportInbox { unreadCount: number; reports: ManagerPlaybackReport[]; hasMore: boolean; }
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function createPlaybackReportRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export class PlaybackErrorReportService {
  constructor(private readonly client: RpcClient | undefined,
    private readonly loadProof: () => Promise<DeviceProof | null> = () => DeviceIdentityService.loadActivationState(),
    private readonly timeoutMs = 10_000) {}

  private async call(name: string, params: Record<string, unknown>, signal?: AbortSignal): Promise<Record<string, unknown>> {
    if (!this.client) throw new Error('REPORT_UNAVAILABLE');
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancel: (() => void) | undefined;
    try {
      const stopped = new Promise<never>((_, reject) => {
        cancel = () => { controller.abort(); reject(new Error('REPORT_UNAVAILABLE')); };
        signal?.addEventListener('abort', cancel, { once: true });
        timer = setTimeout(cancel, this.timeoutMs);
      });
      if (signal?.aborted) { cancel!(); return await stopped; }
      let request = this.client.rpc(name, params);
      if (request.abortSignal) request = request.abortSignal(controller.signal);
      const result = await Promise.race([Promise.resolve(request), stopped]);
      if (result.error || !record(result.data) || result.data.success !== true) {
        if (record(result.data) && result.data.code === 'REPORT_RATE_LIMIT') throw new Error('REPORT_RATE_LIMIT');
        throw new Error('REPORT_UNAVAILABLE');
      }
      return result.data;
    } catch (error) {
      throw new Error(error instanceof Error && error.message === 'REPORT_RATE_LIMIT' ? 'REPORT_RATE_LIMIT' : 'REPORT_UNAVAILABLE');
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (cancel) signal?.removeEventListener('abort', cancel);
    }
  }

  async send(diagnostic: string, requestId: string, signal?: AbortSignal): Promise<string> {
    const fields = parsePlaybackDiagnostic(diagnostic);
    if (!fields || !uuid(requestId)) throw new Error('REPORT_UNAVAILABLE');
    const proof = await this.loadProof();
    if (!proof || proof.status !== 'AUTHORIZED' || !proof.deviceAuthToken || signal?.aborted) throw new Error('REPORT_UNAVAILABLE');
    const data = await this.call('rpc_device_report_playback_error', {
      p_device_id: proof.deviceId, p_device_token: proof.deviceAuthToken, p_request_id: requestId, p_diagnostic: fields,
    }, signal);
    if (!uuid(data.reportId)) throw new Error('REPORT_UNAVAILABLE');
    return data.reportId;
  }

  async inbox(beforeId?: string, signal?: AbortSignal): Promise<PlaybackReportInbox> {
    if (beforeId !== undefined && !uuid(beforeId)) throw new Error('REPORT_UNAVAILABLE');
    const data = await this.call('rpc_manager_list_playback_errors', { p_before_id: beforeId ?? null }, signal);
    if (!Number.isSafeInteger(data.unreadCount) || Number(data.unreadCount) < 0 || typeof data.hasMore !== 'boolean'
      || !Array.isArray(data.reports) || data.reports.length > 50) throw new Error('REPORT_UNAVAILABLE');
    const reports = data.reports.map(item => {
      if (!record(item) || !uuid(item.id) || typeof item.read !== 'boolean'
        || typeof item.receivedAt !== 'string' || !Number.isFinite(Date.parse(item.receivedAt))) throw new Error('REPORT_UNAVAILABLE');
      const diagnostic = formatPlaybackDiagnostic(item.diagnostic);
      if (!diagnostic) throw new Error('REPORT_UNAVAILABLE');
      const label = (key: string, max: number): string => {
        if (typeof item[key] !== 'string' || item[key].length > max) throw new Error('REPORT_UNAVAILABLE');
        return item[key];
      };
      return { id: item.id, read: item.read, receivedAt: item.receivedAt, diagnostic,
        displayCode: label('displayCode', 32), deviceLabel: label('deviceLabel', 100),
        deviceType: label('deviceType', 20), customerName: label('customerName', 100) };
    });
    return { unreadCount: Number(data.unreadCount), reports, hasMore: data.hasMore };
  }

  async markRead(reportId: string, signal?: AbortSignal): Promise<void> {
    if (!uuid(reportId)) throw new Error('REPORT_UNAVAILABLE');
    await this.call('rpc_manager_mark_playback_error_read', { p_report_id: reportId }, signal);
  }
}

export function getPlaybackErrorReportService(): PlaybackErrorReportService {
  return new PlaybackErrorReportService(getSupabaseBrowserClient());
}
