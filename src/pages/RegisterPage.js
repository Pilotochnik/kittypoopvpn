import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import RegisterForm from '../auth/components/RegisterForm';
import { motion } from 'framer-motion';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
`;

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 400px;
  padding: 30px;
  background: rgba(15, 15, 25, 0.7);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Logo = styled.div`
  margin-bottom: 30px;
  text-align: center;
  
  h1 {
    color: #fff;
    font-size: 2rem;
    margin: 0;
    font-weight: 700;
    background: linear-gradient(90deg, #ff66c4, #8a64ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: rgba(255, 255, 255, 0.6);
    margin: 10px 0 0;
    font-size: 0.9rem;
  }
`;

const Footer = styled.div`
  margin-top: 20px;
  text-align: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  
  a {
    color: #ff66c4;
    text-decoration: none;
    transition: color 0.3s ease;
    
    &:hover {
      color: #ff88d1;
    }
  }
`;

const RegisterPage = () => {
  return (
    <PageContainer>
      <FormContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo>
          <h1>KittyPoopVPN</h1>
          <p>Зарегистрируйтесь, чтобы начать пользоваться сервисом</p>
        </Logo>
        
        <RegisterForm />
        
        <Footer>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </Footer>
      </FormContainer>
    </PageContainer>
  );
};

export default RegisterPage; 