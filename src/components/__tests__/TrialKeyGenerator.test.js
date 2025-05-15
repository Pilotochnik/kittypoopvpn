import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrialKeyGenerator from '../TrialKeyGenerator';

// Мокаем fetch
global.fetch = jest.fn();

describe('TrialKeyGenerator', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    fetch.mockClear();
  });

  test('рендерит основной интерфейс', () => {
    render(<TrialKeyGenerator />);
    
    expect(screen.getByText('Пробный ключ на 1 час')).toBeInTheDocument();
    expect(screen.getByText(/Хотите попробовать наш VPN перед покупкой/)).toBeInTheDocument();
    expect(screen.getByText('Получить пробный ключ')).toBeInTheDocument();
  });

  test('показывает предупреждение о времени действия ключа', () => {
    render(<TrialKeyGenerator />);
    
    expect(screen.getByText(/Ключ будет активен только в течение 1 часа/)).toBeInTheDocument();
  });

  test('генерирует ключ при нажатии кнопки', async () => {
    const mockResponse = {
      success: true,
      config: 'vless://test-key',
      expires: new Date(Date.now() + 3600000).toISOString()
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse)
      })
    );

    render(<TrialKeyGenerator />);
    
    const generateButton = screen.getByText('Получить пробный ключ');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Ваш пробный VLESS ключ:')).toBeInTheDocument();
      expect(screen.getByText('vless://test-key')).toBeInTheDocument();
    });
  });

  test('показывает ошибку при неудачной генерации ключа', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: false, message: 'Ошибка генерации' })
      })
    );

    render(<TrialKeyGenerator />);
    
    const generateButton = screen.getByText('Получить пробный ключ');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Ошибка при получении тестового ключа')).toBeInTheDocument();
    });
  });

  test('показывает QR-код после генерации ключа', async () => {
    const mockResponse = {
      success: true,
      config: 'vless://test-key',
      expires: new Date(Date.now() + 3600000).toISOString()
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse)
      })
    );

    render(<TrialKeyGenerator />);
    
    const generateButton = screen.getByText('Получить пробный ключ');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Отсканируйте QR-код в вашем VPN-приложении:')).toBeInTheDocument();
    });
  });

  test('показывает таймер после генерации ключа', async () => {
    const mockResponse = {
      success: true,
      config: 'vless://test-key',
      expires: new Date(Date.now() + 3600000).toISOString()
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse)
      })
    );

    render(<TrialKeyGenerator />);
    
    const generateButton = screen.getByText('Получить пробный ключ');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Осталось времени:/)).toBeInTheDocument();
    });
  });
}); 