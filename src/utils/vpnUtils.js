import { v4 as uuidv4 } from 'uuid';

// Функция для генерации VLESS ключей
export const generateVlessKey = (params = {}) => {
  // Настройки по умолчанию
  const defaults = {
    uuid: uuidv4(),
    serverDomain: '167.99.215.131',
    port: 4843,
    encryption: 'none',
    security: 'tls',
    type: 'ws',
    path: '/vless',
    name: 'KittyPoopVPN'
  };

  // Объединяем параметры по умолчанию с переданными параметрами
  const config = { ...defaults, ...params };

  // Формируем URL
  const host = `${config.serverDomain}`;
  const queryParams = `encryption=${config.encryption}&security=${config.security}&type=${config.type}&host=${config.serverDomain}&path=${encodeURIComponent(config.path)}`;
  const vlessUrl = `vless://${config.uuid}@${host}:${config.port}?${queryParams}#${encodeURIComponent(config.name)}`;

  return vlessUrl;
};

// Функция для анализа VLESS ключей
export const parseVlessKey = (key) => {
  try {
    const url = new URL(key);
    if (url.protocol !== 'vless:') {
      throw new Error('Invalid VLESS key format');
    }

    const params = new URLSearchParams(url.search);
    const requiredParams = ['encryption', 'security', 'type', 'host', 'path'];
    
    for (const param of requiredParams) {
      if (!params.has(param)) {
        throw new Error('Missing required parameters');
      }
    }

    return {
      uuid: url.username,
      host: url.hostname,
      port: url.port,
      encryption: params.get('encryption'),
      security: params.get('security'),
      type: params.get('type'),
      path: params.get('path'),
      name: url.hash.substring(1) || 'VPN Key'
    };
  } catch (error) {
    throw new Error('Invalid VLESS key format');
  }
};

// Функция для проверки статуса ключа
export const checkKeyStatus = async (keyData) => {
  try {
    const response = await fetch('/api/check-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(keyData)
    });

    if (!response.ok) {
      throw new Error('Failed to check key status');
    }

    return await response.json();
  } catch (error) {
    throw new Error('Failed to check key status');
  }
}; 