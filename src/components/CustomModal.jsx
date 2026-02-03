import React from 'react';
import { AlertCircle, CheckCircle, X, AlertTriangle } from 'lucide-react';

const COLORS = {
  primary: '#f9ab2d',
  bg: '#2a2b2c',
  bgDark: '#1a1b1c',
  border: '#3a3b3c',
  muted: '#999',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b'
};

export const CustomAlert = ({ message, type = 'info', onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={32} color={COLORS.success} />;
      case 'error':
        return <AlertCircle size={32} color={COLORS.danger} />;
      case 'warning':
        return <AlertTriangle size={32} color={COLORS.warning} />;
      default:
        return <AlertCircle size={32} color={COLORS.primary} />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Sucesso';
      case 'error':
        return 'Erro';
      case 'warning':
        return 'Atenção';
      default:
        return 'Informação';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.danger;
      case 'warning':
        return COLORS.warning;
      default:
        return COLORS.primary;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: COLORS.bg,
        padding: '2rem',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '450px',
        border: `2px solid ${getColor()}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
        animation: 'slideIn 0.2s ease-out'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          {getIcon()}

          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              color: getColor(),
              margin: '0 0 0.75rem 0',
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}>
              {getTitle()}
            </h3>
            <p style={{
              color: '#fff',
              margin: 0,
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: getColor(),
              color: type === 'success' || type === 'error' ? '#fff' : COLORS.bgDark,
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            OK
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export const CustomConfirm = ({ message, title = 'Confirmar ação', onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', isDanger = false }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: COLORS.bg,
        padding: '2rem',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '450px',
        border: `2px solid ${isDanger ? COLORS.danger : COLORS.primary}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
        animation: 'slideIn 0.2s ease-out'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {isDanger ? (
              <AlertTriangle size={32} color={COLORS.danger} />
            ) : (
              <AlertCircle size={32} color={COLORS.primary} />
            )}
            <h3 style={{
              color: isDanger ? COLORS.danger : COLORS.primary,
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}>
              {title}
            </h3>
          </div>

          <p style={{
            color: '#fff',
            margin: 0,
            fontSize: '1rem',
            lineHeight: '1.5'
          }}>
            {message}
          </p>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '0.5rem'
          }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.875rem',
                backgroundColor: 'transparent',
                color: COLORS.muted,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.muted;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.muted;
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '0.875rem',
                backgroundColor: isDanger ? COLORS.danger : COLORS.primary,
                color: isDanger ? '#fff' : COLORS.bgDark,
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export const useCustomModal = () => {
  const [alertState, setAlertState] = React.useState(null);
  const [confirmState, setConfirmState] = React.useState(null);

  const showAlert = (message, type = 'info') => {
    return new Promise((resolve) => {
      setAlertState({ message, type, resolve });
    });
  };

  const showConfirm = (message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        title: options.title || 'Confirmar ação',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        isDanger: options.isDanger || false,
        resolve
      });
    });
  };

  const closeAlert = () => {
    if (alertState?.resolve) {
      alertState.resolve();
    }
    setAlertState(null);
  };

  const handleConfirm = () => {
    if (confirmState?.resolve) {
      confirmState.resolve(true);
    }
    setConfirmState(null);
  };

  const handleCancel = () => {
    if (confirmState?.resolve) {
      confirmState.resolve(false);
    }
    setConfirmState(null);
  };

  const modalJSX = (
    <>
      {alertState && (
        <CustomAlert
          message={alertState.message}
          type={alertState.type}
          onClose={closeAlert}
        />
      )}
      {confirmState && (
        <CustomConfirm
          message={confirmState.message}
          title={confirmState.title}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          isDanger={confirmState.isDanger}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );

  return {
    showAlert,
    showConfirm,
    ModalComponents: modalJSX
  };
};
