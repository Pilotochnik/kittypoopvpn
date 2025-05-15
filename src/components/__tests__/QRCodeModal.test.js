import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import QRCodeModal from '../QRCodeModal';

describe('QRCodeModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    qrValue: 'test-qr-value',
    title: 'Test QR Code',
    description: 'Test Description'
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('не рендерится когда isOpen = false', () => {
    render(<QRCodeModal {...mockProps} isOpen={false} />);
    expect(screen.queryByText('Test QR Code')).not.toBeInTheDocument();
  });

  test('рендерит все основные элементы', () => {
    render(<QRCodeModal {...mockProps} />);
    
    expect(screen.getByText('Test QR Code')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Закрыть')).toBeInTheDocument();
  });

  test('показывает таймер', () => {
    render(<QRCodeModal {...mockProps} />);
    expect(screen.getByText('5:00')).toBeInTheDocument();
  });

  test('таймер уменьшается каждую секунду', () => {
    render(<QRCodeModal {...mockProps} />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText('4:59')).toBeInTheDocument();
  });

  test('закрывается по истечении времени', () => {
    render(<QRCodeModal {...mockProps} />);
    
    act(() => {
      jest.advanceTimersByTime(300000); // 5 минут
    });
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('закрывается при нажатии кнопки закрытия', () => {
    render(<QRCodeModal {...mockProps} />);
    
    const closeButton = screen.getByText('Закрыть');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('закрывается при клике на оверлей', () => {
    render(<QRCodeModal {...mockProps} />);
    
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('не закрывается при клике на контент', () => {
    render(<QRCodeModal {...mockProps} />);
    
    const content = screen.getByTestId('modal-content');
    fireEvent.click(content);
    
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });
}); 