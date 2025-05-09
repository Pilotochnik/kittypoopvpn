import { v4 as uuidv4 } from 'uuid';

// Функция для генерации VLESS ключей
export const generateVlessKey = (params = {}) => {
  // Настройки по умолчанию
  const defaults = {
    uuid: uuidv4(),
    serverDomain: 'pilotochnik.duckdns.org',
    port: 443,
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
export const parseVlessKey = (vlessUrl) => {
  try {
    // Удаляем протокол 'vless://'
    const protocolRemoved = vlessUrl.replace('vless://', '');
    
    // Разделяем на основную часть и метку (#)
    const [mainPart, name] = protocolRemoved.split('#');
    
    // Разделяем основную часть на UUID@domain:port?params
    const [uuidWithServer, queryString] = mainPart.split('?');
    
    // Извлекаем UUID и сервер
    const [uuid, serverWithPort] = uuidWithServer.split('@');
    
    // Разделяем сервер и порт
    const [serverDomain, port] = serverWithPort.split(':');
    
    // Преобразуем параметры запроса в объект
    const params = {};
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      params[key] = decodeURIComponent(value);
    });
    
    return {
      uuid,
      serverDomain,
      port: parseInt(port, 10),
      name: decodeURIComponent(name || ''),
      encryption: params.encryption || 'none',
      security: params.security || 'tls',
      type: params.type || 'ws',
      host: params.host || serverDomain,
      path: params.path || '/vless'
    };
  } catch (error) {
    console.error('Ошибка при разборе VLESS ключа:', error);
    return null;
  }
};

// Функция для проверки статуса ключа
export const checkKeyStatus = async (keyData) => {
  // В реальном приложении здесь будет запрос к API для проверки статуса
  // Сейчас просто имитируем результат
  return {
    active: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    trafficUsed: Math.floor(Math.random() * 10000), // случайное значение трафика в МБ
    maxTraffic: 100000 // 100 ГБ в МБ
  };
}; 