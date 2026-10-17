import { clearPublicWebSession, installPublicWebSession, type WebSessionResponse } from './session-context.ts';
import { installWebStorageScope } from './session-storage.ts';
import { WEB_ACCESS_ERROR, webAccessRequest, webSessionRequest } from './web-access.client.ts';
import './login.css';

export function requireWebLogin(): Promise<void> {
  const root = document.getElementById('root');
  if (!root) return Promise.reject(new Error('WEB_ROOT_REQUIRED'));
  root.innerHTML = `<main class="web-login"><form class="web-login-card" aria-labelledby="web-login-title" autocomplete="off">
    <div class="web-login-brand">XANDE<span>FLIX</span></div><h1 id="web-login-title">Acessar minha conta</h1>
    <p>Use os dados de um aparelho já ativado. O PIN de acesso deve estar cadastrado pelo responsável ou gestor.</p>
    <label>Código do dispositivo<input name="displayCode" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" placeholder="XF-XXXX-XXXX" required pattern="XF-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}"></label>
    <label>Chave de acesso<input name="accessKey" type="password" autocomplete="off" inputmode="numeric" maxlength="6" required pattern="[0-9]{6}"></label>
    <label>PIN de acesso<input name="pin" type="password" autocomplete="off" inputmode="numeric" maxlength="6" required pattern="[0-9]{6}"></label>
    <p class="web-login-message" role="status" aria-live="polite"></p><button type="submit">Entrar</button>
  </form></main>`;
  const form = root.querySelector('form')!, button = form.querySelector('button')!, status = form.querySelector('[role="status"]')!;
  const code = form.elements.namedItem('displayCode') as HTMLInputElement;
  const accessKey = form.elements.namedItem('accessKey') as HTMLInputElement, pin = form.elements.namedItem('pin') as HTMLInputElement;
  code.addEventListener('input', () => { code.value = code.value.toUpperCase(); });
  code.focus();
  return new Promise(resolve => {
    let pending = false;
    form.addEventListener('submit', event => {
      event.preventDefault(); if (pending || !form.reportValidity()) return;
      pending = true; button.disabled = true; status.textContent = 'Conferindo seu acesso…';
      void (async () => {
        let token: string | undefined;
        try {
          const response = await webAccessRequest('LOGIN', { displayCode: code.value, accessKey: accessKey.value, pin: pin.value });
          const session = response as unknown as WebSessionResponse;
          token = session.sessionToken;
          installPublicWebSession(session);
          installWebStorageScope(session.activation.deviceId);
          installSessionLifecycle(session.sessionToken);
          resolve();
        } catch {
          clearPublicWebSession();
          if (token) void webSessionRequest('rpc_web_logout', token, true).catch(() => {});
          status.textContent = WEB_ACCESS_ERROR;
        } finally {
          accessKey.value = ''; pin.value = ''; pending = false; button.disabled = false;
        }
      })();
    });
  });
}
function installSessionLifecycle(token: string): void {
  let closed = false, checking = false;
  const stop = () => document.querySelectorAll('video,audio').forEach(media => { (media as HTMLMediaElement).pause(); media.removeAttribute('src'); (media as HTMLMediaElement).load(); });
  const logout = () => {
    if (closed) return; closed = true;
    stop(); clearPublicWebSession();
    void webSessionRequest('rpc_web_logout', token, true).catch(() => {});
    window.location.replace('/app');
  };
  const verify = async () => {
    if (closed || checking) return; checking = true;
    try {
      const context = await webSessionRequest('rpc_web_session_context', token);
      if (!closed) installPublicWebSession({ ...context, sessionToken: token } as unknown as WebSessionResponse);
    } catch { logout(); } finally { checking = false; }
  };
  window.setInterval(() => { void verify(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void verify(); });
  window.addEventListener('xandeflix:web-signout', logout);
  window.addEventListener('pagehide', () => { closed = true; stop(); clearPublicWebSession(); void webSessionRequest('rpc_web_logout', token, true).catch(() => {}); });
  const button = document.createElement('button'); button.type = 'button'; button.className = 'web-account-signout';
  button.textContent = 'Sair'; button.title = 'Encerrar acesso web'; button.setAttribute('aria-label', 'Encerrar acesso web');
  button.addEventListener('click', logout); document.body.appendChild(button);
}
