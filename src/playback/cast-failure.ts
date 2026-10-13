export const CAST_FAILURE_CODES = ['CAST_NOT_CONNECTED', 'CAST_UNSUPPORTED_MEDIA', 'CAST_WIFI_REQUIRED',
  'CAST_LOAD_FAILED', 'CAST_LOAD_TIMEOUT', 'CAST_LOAD_CANCELLED', 'CAST_MEDIA_ERROR', 'CAST_LEASE_EXPIRED'] as const;
export type CastFailureCode = typeof CAST_FAILURE_CODES[number];

export function isCastFailureCode(code: unknown): code is CastFailureCode {
  return typeof code === 'string' && CAST_FAILURE_CODES.some(value => value === code);
}

export function castFailureNotice(code: unknown): string | null {
  switch (code) {
    case 'CAST_NOT_CONNECTED': return 'A TV está desconectada. Selecione o receptor em Transmitir.';
    case 'CAST_WIFI_REQUIRED': return 'Não foi possível acessar a TV pela rede local. Conecte os aparelhos à mesma rede Wi-Fi.';
    case 'CAST_UNSUPPORTED_MEDIA': return 'Este formato não pode ser transmitido pelo Google Cast. Use a reprodução neste aparelho.';
    case 'CAST_LOAD_TIMEOUT': return 'A TV não confirmou o carregamento do vídeo no tempo esperado. Confira o receptor e tente novamente.';
    case 'CAST_LOAD_CANCELLED': return 'A transmissão foi cancelada antes de iniciar.';
    case 'CAST_LOAD_FAILED': return 'O receptor não conseguiu iniciar a transmissão. Confira o AirScreen ou a TV e a rede Wi-Fi.';
    case 'CAST_MEDIA_ERROR': return 'O receptor interrompeu a transmissão com um erro de reprodução. Tente reproduzir neste aparelho.';
    case 'CAST_LEASE_EXPIRED': return 'A autorização da transmissão expirou. Inicie a reprodução novamente.';
    default: return null;
  }
}
