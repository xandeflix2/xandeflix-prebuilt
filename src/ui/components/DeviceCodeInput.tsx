import React, { useLayoutEffect, useRef } from 'react';
import { deviceCodeBody, formatDeviceCodeInput } from '../activation/device-code-input.ts';
import './DeviceCodeInput.css';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string; onValueChange: (value: string) => void;
};

export function DeviceCodeInput({ value, onValueChange, style, ...props }: Props) {
  const input = useRef<HTMLInputElement>(null), caret = useRef<number | null>(null);
  const body = deviceCodeBody(value);
  const displayed = body.slice(0, 4) + (body.length > 4 ? '-' + body.slice(4) : '');
  useLayoutEffect(() => {
    if (caret.current !== null) { input.current?.setSelectionRange(caret.current, caret.current); caret.current = null; }
  });
  return <span className="device-code-input" style={style}>
    <span aria-hidden="true" className="device-code-input__prefix">XF-</span>
    <input {...props} ref={input} value={displayed} placeholder="XXXX-XXXX" aria-label={props['aria-label'] || 'Código ID'}
      autoComplete="off" autoCapitalize="characters" spellCheck={false} pattern="[A-Za-z0-9]{4}-[A-Za-z0-9]{4}"
      title="Digite os 8 caracteres do código. XF e os separadores são preenchidos automaticamente."
      onChange={event => {
        const raw = event.target.value, position = event.target.selectionStart ?? raw.length;
        const next = formatDeviceCodeInput(raw);
        let count = deviceCodeBody(raw.slice(0, position)).length;
        if (/^XF[\s-]/i.test(raw)) count = deviceCodeBody(raw.slice(0, position)).length;
        caret.current = count + (count > 4 ? 1 : 0);
        onValueChange(next);
      }}
      onKeyDown={event => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const target = event.currentTarget;
        if (event.key === 'Backspace' && target.selectionStart === 5 && target.selectionEnd === 5 && displayed[4] === '-') {
          event.preventDefault(); caret.current = 3;
          onValueChange(formatDeviceCodeInput(body.slice(0, 3) + body.slice(4)));
        }
      }} />
  </span>;
}
