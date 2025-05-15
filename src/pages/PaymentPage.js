// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import CryptoPaymentSelector from '../components/CryptoPaymentSelector';
import CryptoPaymentDetails from '../components/CryptoPaymentDetails';
import QRCodeModal from '../components/QRCodeModal';
import TelegramLoginButton from '../components/TelegramLoginButton';
import { createPayment, getPayment, confirmPayment, confirmManualPayment } from '../utils/cryptoPaymentService';
import { useAuth } from '../context/AuthContext';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
`;

const Content = styled.div`
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 15px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 50px 0;
`;

const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--primary-color);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  background-color: rgba(255, 85, 85, 0.2);
  border: 1px solid var(--error-color);
  border-radius: 12px;
  padding: 20px;
  margin: 30px 0;
  text-align: center;
`;

const ErrorTitle = styled.h3`
  color: var(--error-color);
  margin-bottom: 10px;
`;

const ErrorMessage = styled.p`
  color: var(--text-secondary);
  margin-bottom: 15px;
`;

const Button = styled(motion.button)`
  padding: 12px 25px;
  background: transparent;
  border: 2px solid var(--accent-color);
  border-radius: 10px;
  color: var(--accent-color);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(51, 204, 255, 0.1);
  }
`;

// Новые стили для авторизации
const AuthContainer = styled(motion.div)`
  width: 100%;
  background-color: var(--card-background);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const AuthTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-color);
  text-align: center;
`;

const AuthDescription = styled.p`
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 25px;
  text-align: center;
  line-height: 1.5;
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: var(--text-secondary);
  
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  span {
    padding: 0 15px;
    font-size: 0.9rem;
  }
`;

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('auth');
  const [payment, setPayment] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrValue, setQrValue] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [isPolling, setIsPolling] = useState(false);
  
  const searchParams = new URLSearchParams(location.search);
  const planParam = searchParams.get('plan') || 'standard';
  const periodParam = searchParams.get('period') || 'monthly';
  const paymentId = searchParams.get('paymentId');
  
  // Эффект для загрузки платежа при монтировании
  useEffect(() => {
    if (user && !paymentId) {
      setStep('select-currency');
    }
    
    if (paymentId) {
      loadPayment(paymentId);
    }

    // Очищаем все интервалы при размонтировании
    return () => {
      if (window._paymentPollingInterval) {
        clearInterval(window._paymentPollingInterval);
        window._paymentPollingInterval = null;
      }
    };
  }, [paymentId, user]);

  // Эффект для управления опросом статуса
  useEffect(() => {
    let pollInterval = null;
    const controller = new AbortController();

    const pollStatus = async () => {
      if (!payment || !paymentId) return;

      try {
        const response = await fetch(`/api/payment/status/${paymentId}`, {
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error('Ошибка при получении статуса платежа');
        }
        
        const data = await response.json();
        console.log('Получены данные платежа:', {
          status: data.payment?.status,
          vpnKey: data.payment?.vpnKey,
          hasVpnKey: !!data.payment?.vpnKey,
          vpnKeyDetails: data.payment?.vpnKey ? {
            uuid: data.payment.vpnKey.uuid,
            hasConfig: !!data.payment.vpnKey.config,
            configType: typeof data.payment.vpnKey.config,
            configPreview: data.payment.vpnKey.config ? data.payment.vpnKey.config.substring(0, 50) + '...' : null
          } : null,
          fullPayment: JSON.stringify(data.payment, null, 2)
        });
        
        setPayment(data.payment);
      } catch (error) {
        console.error('Ошибка при получении статуса:', error);
      }
    };

    // Запускаем опрос только если есть активный платеж в ожидании
    if (payment && ['pending', 'waiting_confirmation'].includes(payment.status)) {
      // Первая проверка
      pollStatus();
      
      // Запускаем интервал только если его еще нет
      if (!pollInterval) {
        pollInterval = setInterval(pollStatus, 5000);
      }
    }

    // Очистка при размонтировании
    return () => {
      controller.abort();
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [payment, paymentId]);

  const loadPayment = async (paymentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const paymentData = await getPayment(paymentId);
      setPayment(paymentData);
      
      // Если платеж найден, переходим к отображению деталей
      setStep('payment-details');
    } catch (error) {
      console.error('Ошибка при загрузке платежа:', error);
      setError(error.message || 'Не удалось загрузить информацию о платеже');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCurrencySelect = async (currency) => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем ID пользователя из объекта пользователя или используем anonymous-user
      const userId = user?.id || 'anonymous-user';

      // --- КОРРЕКТНЫЙ РАСЧЁТ СУММЫ ---
      let amount = 500; // стандартный по умолчанию
      if (planParam === 'basic') amount = 200; // Пробный месяц - всегда 200р 
      if (planParam === 'standard') amount = 500; // Базовичок - всегда 500р за 3 месяца
      if (planParam === 'premium') amount = 1500; // Наш котяра - всегда 1500р за год
      // --- КОНЕЦ РАСЧЁТА ---

      const paymentData = {
        userId,
        plan: planParam,
        currency,
        period: periodParam,
        amount
      };
      
      const newPayment = await createPayment(paymentData);
      setPayment(newPayment);
      
      // Обновляем URL, чтобы можно было вернуться к платежу
      navigate(`/payment?paymentId=${newPayment.paymentId}`, { replace: true });
      
      // Переходим к шагу с отображением деталей платежа
      setStep('payment-details');
    } catch (error) {
      console.error('Ошибка при создании платежа:', error);
      setError(error.message || 'Не удалось создать платеж');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePaymentConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/payment/status/${payment.paymentId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Не удалось подтвердить платеж');
      }
      
      // Обновляем состояние платежа
      setPayment(data.payment);
      
      // Запускаем опрос статуса, если платеж в ожидании подтверждения
      if (data.payment.status === 'waiting_confirmation') {
        setIsPolling(false); // Сбрасываем флаг, чтобы запустить новый опрос
      }
      
    } catch (error) {
      console.error('Ошибка при подтверждении платежа:', error);
      setError(error.message || 'Не удалось подтвердить платеж');
    } finally {
      setLoading(false);
    }
  };
  
  const handleShowQRCode = (value) => {
    setQrValue(value);
    setShowQRModal(true);
  };
  
  const handleBack = () => {
    if (step === 'payment-details') {
      // Возвращаемся к выбору криптовалюты
      setStep('select-currency');
      // Удаляем параметр paymentId из URL
      navigate('/payment', { replace: true });
    } else {
      // Возвращаемся на страницу тарифов
      navigate('/pricing');
    }
  };
  
  const getStepTitle = () => {
    switch (step) {
      case 'auth':
        return 'Авторизация перед оплатой';
      case 'select-currency':
        return 'Оплата криптовалютой';
      case 'payment-details':
        return 'Детали платежа';
      default:
        return 'Оплата';
    }
  };
  
  const getStepDescription = () => {
    switch (step) {
      case 'auth':
        return 'Авторизуйтесь через Telegram для получения VPN-ключа после оплаты или продолжите без авторизации.';
      case 'select-currency':
        return 'Выберите криптовалюту для оплаты выбранного тарифного плана.';
      case 'payment-details':
        if (payment && payment.status === 'completed') {
          return 'Ваш платеж успешно обработан! Ваш VPN-ключ готов к использованию.';
        }
        return 'Отправьте точную сумму на указанный адрес кошелька. После подтверждения транзакции в сети ваш ключ будет активирован.';
      default:
        return '';
    }
  };
  
  // Компонент авторизации перед оплатой
  const renderAuthStep = () => {
    return (
      <AuthContainer>
        <AuthTitle>Авторизация перед оплатой</AuthTitle>
        <AuthDescription>
          Для получения VPN-ключа после оплаты, вам рекомендуется авторизоваться через Telegram.
          Это позволит нам отправить вам ключ напрямую в мессенджер.
          <br/>
          Вы также можете продолжить без авторизации.
        </AuthDescription>
        
        <TelegramLoginButton />
        
        <OrDivider>
          <span>или</span>
        </OrDivider>
        
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Button 
            onClick={() => setStep('select-currency')} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Продолжить без авторизации
          </Button>
        </div>
      </AuthContainer>
    );
  };

  return (
    <PageContainer>
      <Content>
        <HeaderSection>
          <Title>{getStepTitle()}</Title>
          <Description>{getStepDescription()}</Description>
        </HeaderSection>
        
        {loading && step !== 'auth' ? (
          <LoadingContainer>
            <Spinner />
            <p>Пожалуйста, подождите...</p>
          </LoadingContainer>
        ) : error ? (
          <ErrorContainer>
            <ErrorTitle>Произошла ошибка</ErrorTitle>
            <ErrorMessage>{error}</ErrorMessage>
            <Button 
              onClick={handleBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Вернуться назад
            </Button>
          </ErrorContainer>
        ) : (
          <>
            {step === 'auth' && renderAuthStep()}
            
            {step === 'select-currency' && (
              <CryptoPaymentSelector
                onCurrencySelect={handleCurrencySelect}
                onContinue={handleCurrencySelect}
              />
            )}
            
            {step === 'payment-details' && payment && (
              <CryptoPaymentDetails
                payment={payment}
                onConfirm={handlePaymentConfirm}
                onBack={handleBack}
                onCheckQR={handleShowQRCode}
              />
            )}
          </>
        )}
      </Content>
      
      {showQRModal && (
        <QRCodeModal
          value={qrValue}
          title="VPN Ключ"
          onClose={() => setShowQRModal(false)}
        />
      )}
    </PageContainer>
  );
};

export default PaymentPage;