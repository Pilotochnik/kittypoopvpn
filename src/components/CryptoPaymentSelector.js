import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Container = styled.div`
  width: 100%;
  background-color: var(--card-background);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Title = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-color);
  text-align: center;
`;

const CurrencyOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const CurrencyOption = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border-radius: 12px;
  cursor: pointer;
  background-color: ${props => props.selected ? 'rgba(80, 120, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.selected ? 'var(--primary-color)' : 'transparent'};
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(80, 120, 255, 0.1);
  }
`;

const CurrencyIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  background-color: ${props => {
    if (props.type === 'btc') return 'rgba(247, 147, 26, 0.2)';
    if (props.type === 'eth') return 'rgba(98, 126, 234, 0.2)';
    if (props.type === 'usdt') return 'rgba(38, 161, 123, 0.2)';
    if (props.type === 'ton') return 'rgba(0, 136, 204, 0.2)';
    if (props.type === 'tinkoff') return 'rgba(255, 255, 255, 0.1)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  
  svg {
    width: 24px;
    height: 24px;
    fill: ${props => {
      if (props.type === 'btc') return '#F7931A';
      if (props.type === 'eth') return '#627EEA';
      if (props.type === 'usdt') return '#26A17B';
      if (props.type === 'ton') return '#0088CC';
      if (props.type === 'tinkoff') return 'white';
      return 'white';
    }};
  }
`;

const CurrencyName = styled.div`
  font-size: 0.9rem;
  color: var(--text-color);
  font-weight: 500;
`;

const CurrencyNetwork = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 3px;
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: 15px 0;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(140, 82, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CryptoPaymentSelector = ({ onCurrencySelect, onContinue }) => {
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  
  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    if (onCurrencySelect) {
      onCurrencySelect(currency);
    }
  };
  
  const handleContinue = () => {
    if (selectedCurrency && onContinue) {
      onContinue(selectedCurrency);
    }
  };
  
  return (
    <Container>
      <Title>Выберите способ оплаты</Title>
      
      <CurrencyOptions>
        <CurrencyOption 
          selected={selectedCurrency === 'ton'}
          onClick={() => handleCurrencySelect('ton')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CurrencyIcon type="ton">
            <svg viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.22 5.55c4.15.22 7.46 3.5 7.68 7.65.06 1.18-.16 2.32-.63 3.35-.08.18-.32.24-.48.12-1.15-.89-5.1-3.96-5.1-3.96-.28-.22-.28-.63 0-.85.48-.38.9-.7 1.23-.96.28-.22.28-.65 0-.87-1.26-.98-2.33-1.8-3.05-2.35-1.03-.79-2.53-.08-2.51 1.27.02 1.51.02 2.35 0 4.55 0 .36.22.67.55.79l2.5.89c.28.1.28.5 0 .6-2.2.79-3.52 1.26-4.11 1.47-.2.06-.4-.02-.52-.18C7.04 15.45 6.4 13.7 6.4 11.8c0-4.31 3.22-7.85 7.33-8.25.24-.02.45 0 .49 0z" />
            </svg>
          </CurrencyIcon>
          <CurrencyName>TON</CurrencyName>
          <CurrencyNetwork>Toncoin</CurrencyNetwork>
        </CurrencyOption>
        
        <CurrencyOption 
          selected={selectedCurrency === 'eth'}
          onClick={() => handleCurrencySelect('eth')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CurrencyIcon type="eth">
            <svg viewBox="0 0 24 24">
              <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
            </svg>
          </CurrencyIcon>
          <CurrencyName>Ethereum</CurrencyName>
          <CurrencyNetwork>ETH</CurrencyNetwork>
        </CurrencyOption>
        
        <CurrencyOption 
          selected={selectedCurrency === 'usdt'}
          onClick={() => handleCurrencySelect('usdt')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CurrencyIcon type="usdt">
            <svg viewBox="0 0 24 24">
              <path d="M12.24 0l-.4.02H5.34l-.4-.02H4.5v7.78h1.22V1.3h12.54v6.47H19.5V0h-.45l-.4.02h-6.4zm4.45 8.63v2.44c-.16.04-1.16.15-2.98.15-2.32 0-3.5-.12-3.72-.15v-2.4h-4.1v3.4c0 .23.04.27.18.35.2.13 1.4.96 7.66.96 6.2 0 7.48-.8 7.68-.95.13-.1.16-.15.16-.37v-3.4h-4.87zm-.13 2.8v7.77c-.14.02-.72.06-1.5.06-1.08 0-1.82-.05-1.88-.06v-7.77H11.2v7.76c-.02 0-.8.03-1.6.03-.67 0-1.28-.03-1.53-.05v-7.76h-4v7.63c0 .23.03.4.16.53.2.16.97 1.03 7.63 1.03 6.5 0 7.4-.8 7.62-1 .14-.1.2-.3.2-.58v-7.6h-4.15z" />
            </svg>
          </CurrencyIcon>
          <CurrencyName>USDT</CurrencyName>
          <CurrencyNetwork>TRC20</CurrencyNetwork>
        </CurrencyOption>
        
        <CurrencyOption 
          selected={selectedCurrency === 'usdt_eth'}
          onClick={() => handleCurrencySelect('usdt_eth')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CurrencyIcon type="usdt">
            <svg viewBox="0 0 24 24">
              <path d="M12.24 0l-.4.02H5.34l-.4-.02H4.5v7.78h1.22V1.3h12.54v6.47H19.5V0h-.45l-.4.02h-6.4zm4.45 8.63v2.44c-.16.04-1.16.15-2.98.15-2.32 0-3.5-.12-3.72-.15v-2.4h-4.1v3.4c0 .23.04.27.18.35.2.13 1.4.96 7.66.96 6.2 0 7.48-.8 7.68-.95.13-.1.16-.15.16-.37v-3.4h-4.87zm-.13 2.8v7.77c-.14.02-.72.06-1.5.06-1.08 0-1.82-.05-1.88-.06v-7.77H11.2v7.76c-.02 0-.8.03-1.6.03-.67 0-1.28-.03-1.53-.05v-7.76h-4v7.63c0 .23.03.4.16.53.2.16.97 1.03 7.63 1.03 6.5 0 7.4-.8 7.62-1 .14-.1.2-.3.2-.58v-7.6h-4.15z" />
            </svg>
          </CurrencyIcon>
          <CurrencyName>USDT</CurrencyName>
          <CurrencyNetwork>ERC20</CurrencyNetwork>
        </CurrencyOption>
        
        <CurrencyOption 
          selected={selectedCurrency === 'manual_tinkoff'}
          onClick={() => handleCurrencySelect('manual_tinkoff')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CurrencyIcon type="tinkoff">
            <svg viewBox="0 0 24 24">
              <path d="M20.5 4.5h-17A1.5 1.5 0 002 6v12a1.5 1.5 0 001.5 1.5h17a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5zM4 7.5h16v1H4v-1zm0 4h4v1H4v-1zm0 4h6v1H4v-1z" />
            </svg>
          </CurrencyIcon>
          <CurrencyName>Карта Тинькофф</CurrencyName>
          <CurrencyNetwork>Ручной перевод</CurrencyNetwork>
        </CurrencyOption>
      </CurrencyOptions>
      
      <Button 
        onClick={handleContinue}
        disabled={!selectedCurrency}
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }}
      >
        Продолжить
      </Button>
    </Container>
  );
};

export default CryptoPaymentSelector; 