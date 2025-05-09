import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TelegramLoginButton from '../components/TelegramLoginButton';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background-color: var(--card-background);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-align: center;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 30px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 15px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  font-family: 'Montserrat', sans-serif;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 102, 196, 0.2);
  }
`;

const Button = styled(motion.button)`
  padding: 15px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 10px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(140, 82, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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

const TelegramButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
`;

const QRLoginButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--text-secondary);
  margin-top: 10px;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    color: var(--accent-color);
    text-decoration: underline;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: 30px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  
  a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 85, 85, 0.2);
  color: var(--error-color);
  padding: 10px 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
`;

const TermsCheckbox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 10px;
  
  input {
    margin-top: 4px;
  }
  
  label {
    color: var(--text-secondary);
    font-size: 0.85rem;
    
    a {
      color: var(--accent-color);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Пожалуйста, заполните все поля');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    
    if (!acceptTerms) {
      setError('Вы должны принять условия использования');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      await register(formData.email, formData.password, formData.name);
      navigate('/dashboard');
    } catch (err) {
      setError('Ошибка при регистрации аккаунта');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <FormContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>Регистрация</Title>
        <Subtitle>Создайте аккаунт и присоединитесь к Kitty Poop VPN</Subtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Имя</Label>
            <Input
              type="text"
              name="name"
              placeholder="Ваше имя"
              value={formData.name}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Email</Label>
            <Input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Пароль</Label>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Подтвердите пароль</Label>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </FormGroup>
          
          <TermsCheckbox>
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={() => setAcceptTerms(!acceptTerms)}
            />
            <label htmlFor="terms">
              Я принимаю <a href="/terms">условия использования</a> и <a href="/privacy">политику конфиденциальности</a>
            </label>
          </TermsCheckbox>
          
          <Button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </Form>
        
        <OrDivider>
          <span>или</span>
        </OrDivider>
        
        <TelegramButtonContainer>
          <TelegramLoginButton />
        </TelegramButtonContainer>
        
        <FooterText>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </FooterText>
      </FormContainer>
    </PageContainer>
  );
};

export default RegisterPage; 