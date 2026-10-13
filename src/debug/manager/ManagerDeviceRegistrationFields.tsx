import React from 'react';
import './ManagerDeviceRegistrationFields.css';

export interface ManagerDeviceRegistrationFieldsProps {
  label: string;
  maxDevices: string;
  maxSessions: string;
  deviceRole: '' | 'PRIMARY' | 'SECONDARY';
  onDeviceRole: (value: '' | 'PRIMARY' | 'SECONDARY') => void;
  secondaryOnly?: boolean;
  readOnlyLimits?: boolean;
  onLabel: (value: string) => void;
  onMaxDevices: (value: string) => void;
  onMaxSessions: (value: string) => void;
  disabled?: boolean;
}

export function ManagerDeviceRegistrationFields(props: ManagerDeviceRegistrationFieldsProps) {
  const suggestions = React.useId();
  return <fieldset className="manager-device-registration" disabled={props.disabled}>
    <legend>Identificação e quantidade de aparelhos</legend>
    <div>
      <label>Vínculo do novo aparelho
        <select required value={props.deviceRole} onChange={event => props.onDeviceRole(event.target.value as typeof props.deviceRole)}>
          <option value="">Selecione o vínculo...</option>
          {!props.secondaryOnly && <option value="PRIMARY">Principal</option>}
          <option value="SECONDARY">Secundário</option>
        </select>
      </label>
      <label>Local/Tipo do novo aparelho
        <input required maxLength={100} list={suggestions} value={props.label} onChange={event => props.onLabel(event.target.value)} placeholder="Ex.: Sala, Quarto, Celular de João" />
        <datalist id={suggestions}>{['Sala', 'Quarto', 'Celular', 'Tablet', 'Outro'].map(value => <option key={value} value={value} />)}</datalist>
      </label>
      <label>Quantidade permitida de aparelhos
        <input required readOnly={props.readOnlyLimits} type="number" min={1} max={100} step={1} value={props.maxDevices} onChange={event => props.onMaxDevices(event.target.value)} />
      </label>
      <label>Reproduções simultâneas permitidas
        <input required readOnly={props.readOnlyLimits} type="number" min={1} max={Math.min(50, Number(props.maxDevices) || 1)} step={1} value={props.maxSessions} onChange={event => props.onMaxSessions(event.target.value)} />
      </label>
    </div>
    <p>A quantidade define as vagas do cliente. Um novo aparelho precisa de código e chave; para um já cadastrado, selecione seu código. O limite simultâneo define quantos podem assistir ao mesmo tempo e não pode exceder a quantidade permitida.</p>
    {props.readOnlyLimits && <p>Limites vigentes da licença. Para ampliar a capacidade contratada, acesse Licenças → Editar licença antes de vincular.</p>}
    {props.deviceRole === 'SECONDARY' && <p>Selecione o cliente já ativo e informe o aparelho principal. O secundário usará a mesma fonte e as vagas dessa licença.</p>}
  </fieldset>;
}
