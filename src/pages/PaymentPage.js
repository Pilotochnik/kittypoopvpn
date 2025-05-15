// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import QRCodeModal from '../components/QRCodeModal';
import TelegramLoginButton from '../components/TelegramLoginButton';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaCreditCard, FaCoins } from 'react-icons/fa';

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

// Добавляю стили для карточек выбора способа оплаты
const PaymentMethodsWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto 40px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ManualPayCard = styled(motion.div)`
  width: 100%;
  max-width: 700px;
  margin-bottom: 32px;
  background: linear-gradient(120deg, rgba(255,102,196,0.32) 60%, rgba(255,230,250,0.22) 100%);
  border-radius: 20px;
  box-shadow: 0 4px 24px #ff66c433;
  text-align: center;
  border: 1.5px solid #ff66c4;
  padding: 32px 0 32px 0;
  font-size: 1.18rem;
  font-weight: 600;
  color: #a03a7c;
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: linear-gradient(120deg, rgba(255,102,196,0.45) 60%, rgba(255,230,250,0.32) 100%);
    box-shadow: 0 8px 32px #ff66c455;
  }
  @media (max-width: 700px) {
    padding: 18px 0;
    font-size: 1rem;
    max-width: 98vw;
  }
`;

const PaymentMethodsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28px;
  width: 100%;
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

const MethodCard = styled(motion.div)`
  background: linear-gradient(120deg, #2b2d42 60%, #8c52ff 100%);
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(140,82,255,0.10);
  padding: 28px 32px;
  min-width: 220px;
  max-width: 340px;
  display: flex;
  align-items: center;
  gap: 18px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border 0.2s, box-shadow 0.2s;
  color: #fff;
  font-weight: 600;
  font-size: 1.15rem;
  &:hover, &:focus {
    border: 2px solid var(--primary-color);
    box-shadow: 0 8px 32px rgba(140,82,255,0.18);
    background: linear-gradient(120deg, #8c52ff 60%, #ff66c4 100%);
  }
  @media (max-width: 600px) {
    min-width: 0;
    width: 100%;
    padding: 18px 12px;
    font-size: 1rem;
  }
`;

const MethodIcon = styled.div`
  font-size: 2.2rem;
  margin-right: 10px;
`;

const MethodInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const MethodTitle = styled.div`
  font-size: 1.18rem;
  font-weight: 700;
  margin-bottom: 4px;
`;

const MethodDesc = styled.div`
  font-size: 0.98rem;
  color: #e0e0e0;
  font-weight: 400;
`;

const getCryptoIcon = (name) => {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return <img src={`/${name}.svg`} alt={name} style={{width: 32, height: 32}} />;
  } catch {
    return <FaCoins />;
  }
};

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
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  
  const searchParams = new URLSearchParams(location.search);
  const planParam = searchParams.get('plan') || 'standard';
  const periodParam = searchParams.get('period') || 'monthly';
  const paymentId = searchParams.get('paymentId');
  
  // Эффект для загрузки платежа при монтировании
  useEffect(() => {
    if (user && !paymentId) {
      setStep('select-method');
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
      
      const response = await fetch(`/api/payment/status/${paymentId}`);
      const data = await response.json();
      setPayment(data.payment);
      
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
      const userId = user?.id || 'anonymous-user';
      let amount = 500;
      if (planParam === 'basic') amount = 200;
      if (planParam === 'standard') amount = 500;
      if (planParam === 'premium') amount = 1500;
      const paymentData = {
        userId,
        plan: planParam,
        currency,
        period: periodParam,
        amount
      };
      const response = await fetch(`/api/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      const data = await response.json();
      if (!data.success || !data.payment) {
        setError(data.message || 'Не удалось создать платеж. Попробуйте выбрать другую валюту или повторить позже.');
        setPayment(null);
        return;
      }
      setPayment(data.payment);
      navigate(`/payment?paymentId=${data.payment.paymentId}`, { replace: true });
      setStep('payment-details');
    } catch (error) {
      console.error('Ошибка при создании платежа:', error);
      setError(error.message || 'Не удалось создать платеж. Попробуйте позже.');
      setPayment(null);
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
      setStep('select-method');
      // Удаляем параметр paymentId из URL
      navigate('/payment', { replace: true });
    } else {
      // Возвращаемся на страницу тарифов
      navigate('/pricing');
    }
  };
  
  const handleShowInstructions = () => {
    navigate('/faq');
  };
  
  const getStepTitle = () => {
    switch (step) {
      case 'auth':
        return 'Авторизация перед оплатой';
      case 'select-method':
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
      case 'select-method':
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
  
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    if (method === 'crypto') {
      handleCurrencySelect('TON');
    } else if (method === 'manual_tinkoff') {
      handleCurrencySelect('manual_tinkoff');
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
            onClick={() => setStep('select-method')}
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
            
            {step === 'select-method' && (
              <PaymentMethodsWrapper>
                <ManualPayCard
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  onClick={() => handleMethodSelect('manual_tinkoff')}
                  style={{ cursor: 'pointer' }}
                >
                  <MethodIcon><FaCreditCard /></MethodIcon>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#ff66c4', marginBottom: 6 }}>Карта Тинькофф</div>
                  <div style={{ color: '#8c52ff', fontSize: 16, marginBottom: 4 }}>Оплата по реквизитам, подтверждение вручную</div>
                  <div style={{ color: '#b36ad6', fontSize: 14 }}>Нажмите для выбора</div>
                </ManualPayCard>
                <PaymentMethodsGrid>
                  <MethodCard
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    tabIndex={0}
                    style={{
                      border: selectedCurrency === 'TON' ? '2px solid #00ffd0' : '2px solid transparent',
                      background: selectedCurrency === 'TON' ? 'linear-gradient(120deg, #00ffd0 60%, #8c52ff 100%)' : undefined,
                      boxShadow: selectedCurrency === 'TON' ? '0 0 16px #00ffd055' : undefined
                    }}
                    onClick={() => { setSelectedCurrency('TON'); handleCurrencySelect('TON'); }}
                  >
                    <MethodIcon>{getCryptoIcon('ton')}</MethodIcon>
                    <MethodInfo>
                      <MethodTitle>TON</MethodTitle>
                      <MethodDesc>Toncoin — быстро, анонимно, без комиссии</MethodDesc>
                    </MethodInfo>
                  </MethodCard>
                  <MethodCard
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    tabIndex={0}
                    style={{
                      border: selectedCurrency === 'USDT_TRC20' ? '2px solid #00ffd0' : '2px solid transparent',
                      background: selectedCurrency === 'USDT_TRC20' ? 'linear-gradient(120deg, #00ffd0 60%, #26a17b 100%)' : undefined,
                      boxShadow: selectedCurrency === 'USDT_TRC20' ? '0 0 16px #00ffd055' : undefined
                    }}
                    onClick={() => { setSelectedCurrency('USDT_TRC20'); handleCurrencySelect('USDT_TRC20'); }}
                  >
                    <MethodIcon>{getCryptoIcon('usdt')}</MethodIcon>
                    <MethodInfo>
                      <MethodTitle>USDT <span style={{fontSize: '0.9em', color: '#26a17b'}}>TRC20</span></MethodTitle>
                      <MethodDesc>USDT в сети Tron (TRC20)</MethodDesc>
                    </MethodInfo>
                  </MethodCard>
                  <MethodCard
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    tabIndex={0}
                    style={{
                      border: selectedCurrency === 'USDT_ERC20' ? '2px solid #00ffd0' : '2px solid transparent',
                      background: selectedCurrency === 'USDT_ERC20' ? 'linear-gradient(120deg, #00ffd0 60%, #627eea 100%)' : undefined,
                      boxShadow: selectedCurrency === 'USDT_ERC20' ? '0 0 16px #00ffd055' : undefined
                    }}
                    onClick={() => { setSelectedCurrency('USDT_ERC20'); handleCurrencySelect('USDT_ERC20'); }}
                  >
                    <MethodIcon>{getCryptoIcon('usdt')}</MethodIcon>
                    <MethodInfo>
                      <MethodTitle>USDT <span style={{fontSize: '0.9em', color: '#627eea'}}>ERC20</span></MethodTitle>
                      <MethodDesc>USDT в сети Ethereum (ERC20)</MethodDesc>
                    </MethodInfo>
                  </MethodCard>
                  <MethodCard
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    tabIndex={0}
                    style={{
                      border: selectedCurrency === 'BTC' ? '2px solid #ffb300' : '2px solid transparent',
                      background: selectedCurrency === 'BTC' ? 'linear-gradient(120deg, #ffb300 60%, #8c52ff 100%)' : undefined,
                      boxShadow: selectedCurrency === 'BTC' ? '0 0 16px #ffb30055' : undefined
                    }}
                    onClick={() => { setSelectedCurrency('BTC'); handleCurrencySelect('BTC'); }}
                  >
                    <MethodIcon>{getCryptoIcon('btc')}</MethodIcon>
                    <MethodInfo>
                      <MethodTitle>BTC</MethodTitle>
                      <MethodDesc>Bitcoin — классика крипто</MethodDesc>
                    </MethodInfo>
                  </MethodCard>
                </PaymentMethodsGrid>
              </PaymentMethodsWrapper>
            )}
            
            {step === 'payment-details' && payment && payment.cryptopayPayUrl && (
              <div style={{
                background: '#181828',
                borderRadius: 12,
                padding: 24,
                margin: '0 auto 30px',
                maxWidth: 420,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                textAlign: 'center',
                border: '1px solid #444'
              }}>
                <h2 style={{color: '#ff66c4', marginBottom: 18}}>Оплата криптовалютой</h2>
                <div style={{marginBottom: 18, fontSize: 18}}>
                  Отсканируйте QR-код или перейдите по ссылке для оплаты:<br/>
                  <a href={payment.cryptopayPayUrl} target="_blank" rel="noopener noreferrer" style={{color: '#8c52ff', wordBreak: 'break-all'}}>
                    {payment.cryptopayPayUrl}
                  </a>
                </div>
                <div style={{margin: '0 auto 18px', width: 200, background: '#23234a', borderRadius: 8, padding: 10}}>
                  <QRCodeSVG value={payment.cryptopayPayUrl} size={180} />
                </div>
                <div style={{color: '#aaa', fontSize: 15, marginBottom: 18}}>
                  После оплаты ключ будет выдан автоматически.<br/>
                  <b>Сумма:</b> {payment.amount} ₽<br/>
                  <b>Валюта:</b> {(() => {
                    if (payment.currency === 'USDT_TRC20') return 'USDT (TRC20)';
                    if (payment.currency === 'USDT_ERC20') return 'USDT (ERC20)';
                    if (payment.currency === 'TON') return 'TON';
                    if (payment.currency === 'BTC') return 'BTC';
                    return payment.currency;
                  })()}
                </div>
                {payment.status === 'pending' && (
                  <div style={{color: '#ffb300', fontSize: 16, marginTop: 16}}>
                    Ожидание оплаты...
                  </div>
                )}
                {payment.status === 'completed' && (
                  <div style={{color: '#2ecc40', fontSize: 18, marginTop: 16}}>
                    Оплата прошла успешно! Ваш ключ выдан.<br/>
                    {payment.vpnKey && payment.vpnKey.config && (
                      <div style={{
                        background: '#23234a',
                        border: '1px solid #2ecc40',
                        borderRadius: 8,
                        marginTop: 14,
                        padding: 10,
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        color: '#fff',
                        fontSize: 14,
                        textAlign: 'left'
                      }}>
                        <div style={{fontWeight: 700, color: '#2ecc40', marginBottom: 4}}>VPN-ключ:</div>
                        <div>{payment.vpnKey.config}</div>
                        <div style={{marginTop: 8, color: '#aaa', fontSize: 13}}>
                          Скопируйте ключ и используйте в приложении V2rayNG/V2rayTUN.<br/>Инструкция по настройке — в разделе FAQ.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {step === 'payment-details' && payment && !payment.cryptopayPayUrl && (
              <div style={{
                background: 'linear-gradient(120deg, #ff66c4 60%, #ffe6fa 100%)',
                borderRadius: 16,
                padding: 24,
                margin: '0 auto 30px',
                maxWidth: 420,
                boxShadow: '0 4px 24px #ff66c455',
                textAlign: 'center',
                border: '1.5px solid #ff66c4',
                transition: 'all 0.3s',
                '@media (max-width: 600px)': {
                  padding: 12,
                  maxWidth: '98vw',
                  fontSize: 15
                }
              }}>
                <h2 style={{color: '#ff66c4', marginBottom: 18}}>Оплата картой</h2>
                <div style={{marginBottom: 18, fontSize: 18}}>
                  Переведите <b>{payment.amount} ₽</b> на карту:<br/>
                  <span style={{fontWeight: 700, fontSize: 22, color: '#8c52ff'}}>2200 7007 7450 0382</span>
                </div>
                <div style={{color: '#aaa', fontSize: 15, marginBottom: 18}}>
                  В комментарии к платежу укажите: <b>{payment.paymentId}</b>
                </div>
                <button
                  style={{
                    background: '#8c52ff',
                    color: '#fff',
                    fontWeight: 700,
                    borderRadius: 8,
                    padding: '12px 28px',
                    fontSize: 17,
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 10
                  }}
                  onClick={handlePaymentConfirm}
                >Я оплатил</button>
                {payment.status === 'waiting_confirmation' && (
                  <div style={{color: '#ff66c4', fontSize: 16, marginTop: 16}}>
                    Ожидание подтверждения администратором...
                  </div>
                )}
                {payment.status === 'completed' && (
                  <div style={{color: '#2ecc40', fontSize: 18, marginTop: 16}}>
                    Оплата прошла успешно! Ваш ключ выдан.<br/>
                    {payment.vpnKey && payment.vpnKey.config && (
                      <div style={{
                        background: '#23234a',
                        border: '1px solid #2ecc40',
                        borderRadius: 8,
                        marginTop: 14,
                        padding: 10,
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        color: '#fff',
                        fontSize: 14,
                        textAlign: 'left'
                      }}>
                        <div style={{fontWeight: 700, color: '#2ecc40', marginBottom: 4}}>VPN-ключ:</div>
                        <div>{payment.vpnKey.config}</div>
                        <div style={{marginTop: 8, color: '#aaa', fontSize: 13}}>
                          Скопируйте ключ и используйте в приложении V2rayNG/V2rayTUN.<br/>Инструкция по настройке — в разделе FAQ.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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