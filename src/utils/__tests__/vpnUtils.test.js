import { generateVlessKey, parseVlessKey, checkKeyStatus } from '../vpnUtils';

describe('VPN Utils', () => {
  describe('generateVlessKey', () => {
    test('генерирует валидный VLESS ключ с параметрами по умолчанию', () => {
      const key = generateVlessKey();
      
      expect(key).toMatch(/^vless:\/\/[0-9a-f-]+@pilotochnik\.duckdns\.org:443\?encryption=none&security=tls&type=ws&host=pilotochnik\.duckdns\.org&path=%2Fvless#KittyPoopVPN$/);
    });

    test('генерирует VLESS ключ с пользовательскими параметрами', () => {
      const customParams = {
        uuid: 'test-uuid',
        serverDomain: 'test.com',
        port: 8080,
        name: 'Test VPN'
      };
      
      const key = generateVlessKey(customParams);
      
      expect(key).toMatch(/^vless:\/\/test-uuid@test\.com:8080\?encryption=none&security=tls&type=ws&host=test\.com&path=%2Fvless#Test%20VPN$/);
    });
  });

  describe('parseVlessKey', () => {
    test('корректно парсит валидный VLESS ключ', () => {
      const validKey = 'vless://62bc8aba-1979-4918-85ca-0e2eea1df559@pilotochnik.duckdns.org:443?encryption=none&security=tls&type=ws&host=pilotochnik.duckdns.org&path=%2Fvless#KittyPoopVPN-1';
      
      const result = parseVlessKey(validKey);
      
      expect(result).toEqual({
        uuid: '62bc8aba-1979-4918-85ca-0e2eea1df559',
        host: 'pilotochnik.duckdns.org',
        port: '443',
        encryption: 'none',
        security: 'tls',
        type: 'ws',
        path: '/vless',
        name: 'KittyPoopVPN-1'
      });
    });

    test('выбрасывает ошибку при невалидном ключе', () => {
      const invalidKey = 'invalid-key';
      
      expect(() => parseVlessKey(invalidKey)).toThrow('Invalid VLESS key format');
    });

    test('выбрасывает ошибку при отсутствии обязательных параметров', () => {
      const incompleteKey = 'vless://62bc8aba-1979-4918-85ca-0e2eea1df559@pilotochnik.duckdns.org:443';
      
      expect(() => parseVlessKey(incompleteKey)).toThrow('Missing required parameters');
    });
  });

  describe('checkKeyStatus', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch.mockClear();
    });

    test('возвращает статус активного ключа', async () => {
      const mockResponse = {
        active: true,
        expires: new Date(Date.now() + 3600000).toISOString()
      };

      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockResponse)
        })
      );

      const keyData = {
        uuid: 'test-uuid',
        host: 'test-host'
      };

      const result = await checkKeyStatus(keyData);

      expect(result).toEqual({
        active: true,
        expires: expect.any(String)
      });
      expect(global.fetch).toHaveBeenCalledWith('/api/check-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(keyData)
      });
    });

    test('возвращает статус неактивного ключа', async () => {
      const mockResponse = {
        active: false,
        expires: new Date(Date.now() - 3600000).toISOString()
      };

      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockResponse)
        })
      );

      const keyData = {
        uuid: 'test-uuid',
        host: 'test-host'
      };

      const result = await checkKeyStatus(keyData);

      expect(result).toEqual({
        active: false,
        expires: expect.any(String)
      });
    });

    test('обрабатывает ошибку при проверке статуса', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      const keyData = {
        uuid: 'test-uuid',
        host: 'test-host'
      };

      await expect(checkKeyStatus(keyData)).rejects.toThrow('Failed to check key status');
    });
  });
}); 