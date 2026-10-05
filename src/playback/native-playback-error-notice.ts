import type { NativePlayerResumeEvent } from './native-android-player.bridge.ts';

/** Only controlled categories/numbers enter UI text; raw native messages are never rendered. */
export function getNativePlaybackErrorNotice(event: NativePlayerResumeEvent): string | null {
  if (typeof event.errorCode !== 'string' || !event.errorCode.trim()) return null;

  switch (event.errorCategory) {
    case 'HTTP_ERROR': {
      const status = event.httpStatus;
      if (typeof status !== 'number' || !Number.isInteger(status) || status < 400 || status > 599) {
        return 'A fonte do vídeo retornou um erro de acesso. Tente novamente.';
      }
      if (status === 404) return 'A fonte não encontrou o vídeo solicitado (HTTP 404). Tente novamente mais tarde.';
      if (status === 401 || status === 403) return `A fonte recusou o acesso ao vídeo (HTTP ${status}).`;
      if (status >= 500) return `A fonte do vídeo está temporariamente indisponível (HTTP ${status}).`;
      return `A fonte recusou a requisição do vídeo (HTTP ${status}).`;
    }
    case 'NETWORK_TIMEOUT':
      return 'Falha de conexão ou tempo esgotado ao acessar o vídeo. Verifique sua conexão e tente novamente.';
    case 'DECODER_ERROR':
      return 'Não foi possível decodificar este vídeo no dispositivo.';
    case 'SOURCE_UNAVAILABLE':
      return 'Não foi possível ler o vídeo da fonte. Tente novamente.';
    case 'MEDIA_PARSER_FAILURE':
      return 'O formato do vídeo não pôde ser interpretado pelo player.';
    case 'MEDIA_ERROR':
      return 'O player não conseguiu processar este vídeo.';
    default:
      return 'Não foi possível reproduzir este conteúdo. Tente novamente.';
  }
}

export async function handleNativePlayerReturn(
  event: NativePlayerResumeEvent,
  stopPlayback: (reason: string) => Promise<void>,
  reportNotice: (message: string | null) => void,
): Promise<void> {
  const notice = getNativePlaybackErrorNotice(event);
  // Show the reason immediately, even if the existing lease cleanup is slow/fails.
  reportNotice(notice);
  try {
    await stopPlayback(notice ? 'MEDIA_ERROR' : event.ended ? 'COMPLETION' : 'USER_EXIT');
  } catch {
    // Best-effort cleanup must not hide the media error or expose a raw rejection.
  }
}
