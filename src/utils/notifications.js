// Sistema Global de Notificações Customizadas do Ametist (Zero Emojis, 100% Integrado com Temas)

let listeners = new Set();

export function subscribeNotifications(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function emitNotification(notification) {
  listeners.forEach(cb => {
    try {
      cb(notification);
    } catch (e) {
      console.error('Notification error:', e);
    }
  });
}

function parseArgs(arg1, arg2, defaultTitle) {
  if (arg2 !== undefined && typeof arg2 === 'string') {
    return { title: arg1, message: arg2 };
  }
  return { title: defaultTitle, message: typeof arg1 === 'string' ? arg1 : JSON.stringify(arg1) };
}

export const notify = {
  success(arg1, arg2, options = {}) {
    const { title, message } = parseArgs(arg1, arg2, 'Sucesso');
    const id = options.id || 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    emitNotification({
      id,
      type: 'success',
      title,
      message,
      duration: options.duration || 3200
    });
    return id;
  },

  error(arg1, arg2, options = {}) {
    const { title, message } = parseArgs(arg1, arg2, 'Atenção');
    const id = options.id || 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    emitNotification({
      id,
      type: 'error',
      title,
      message,
      duration: options.duration || 4000
    });
    return id;
  },

  info(arg1, arg2, options = {}) {
    const { title, message } = parseArgs(arg1, arg2, 'Informação');
    const id = options.id || 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    emitNotification({
      id,
      type: 'info',
      title,
      message,
      duration: options.duration || 3500
    });
    return id;
  },

  warning(arg1, arg2, options = {}) {
    const { title, message } = parseArgs(arg1, arg2, 'Aviso');
    const id = options.id || 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    emitNotification({
      id,
      type: 'warning',
      title,
      message,
      duration: options.duration || 3800
    });
    return id;
  },

  loading(arg1, options = {}) {
    const message = typeof arg1 === 'string' ? arg1 : 'Carregando...';
    const id = options.id || 'toast-loading-' + Date.now();
    emitNotification({
      id,
      type: 'loading',
      title: 'Aguarde',
      message,
      duration: 0 // não auto-remove até ser substituído ou dispensado
    });
    return id;
  },

  custom(title, message, iconType = 'palette', options = {}) {
    const id = options.id || 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    emitNotification({
      id,
      type: iconType,
      title,
      message,
      duration: options.duration || 3200
    });
    return id;
  },

  dismiss(id) {
    emitNotification({
      action: 'dismiss',
      id
    });
  }
};

// Exportamos também como `toast` para retrocompatibilidade direta
export const toast = notify;
export default notify;
