import React from 'react';

export interface TrialExpiredBlockPageProps {
  onActivateLicense?: () => void;
  onRefreshStatus?: () => void;
  supportContactValue?: string;
}

export const TrialExpiredBlockPage: React.FC<TrialExpiredBlockPageProps> = ({
  onActivateLicense,
  onRefreshStatus,
  supportContactValue = '+55 11 99999-9999',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#f0f0f5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          backgroundColor: '#14141f',
          border: '1px solid #28283d',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '1rem',
          }}
        >
          ⏳
        </div>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '1rem',
            color: '#ff4d4f',
          }}
        >
          Seu período de teste terminou.
        </h1>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: '#a0a0b5',
            marginBottom: '2rem',
          }}
        >
          Aguarde a ativação da licença ou conclua o pagamento.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={onActivateLicense}
            style={{
              padding: '0.85rem 1.5rem',
              backgroundColor: '#e50914',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            Ativar licença
          </button>

          <button
            type="button"
            onClick={onRefreshStatus}
            style={{
              padding: '0.85rem 1.5rem',
              backgroundColor: '#222233',
              color: '#d0d0e0',
              border: '1px solid #3a3a52',
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Já paguei
          </button>
        </div>

        <div
          style={{
            fontSize: '0.85rem',
            color: '#707085',
            borderTop: '1px solid #202030',
            paddingTop: '1rem',
          }}
        >
          Precisa de suporte? Entre em contato: <strong>{supportContactValue}</strong>
        </div>
      </div>
    </div>
  );
};
