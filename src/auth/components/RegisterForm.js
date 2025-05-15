import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

// Стилизованные компоненты (аналогичны LoginForm)
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  color: var(--text-secondary);
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

const SubmitButton = styled(motion.button)`
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
    opacity: 0.7;
    cursor: not-allowed;
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

const RegisterForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверка совпадения паролей
    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    
    console.log('Отправка формы регистрации:', formData); // Для отладки
    
    const { success, message } = await register(formData.email, formData.password);
    
    if (success) {
      toast.success('Вы успешно зарегистрировались!');
      navigate('/login');
    } else {
      toast.error(message || 'Ошибка регистрации');
    }
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <FormGroup>
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email" 
          name="email" 
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          disabled={loading}
          required
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="password">Пароль</Label>
        <Input 
          id="password"
          type="password" 
          name="password" 
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          disabled={loading}
          required
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
        <Input 
          id="confirmPassword"
          type="password" 
          name="confirmPassword" 
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          disabled={loading}
          required
        />
      </FormGroup>
      
      <SubmitButton 
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
      >
        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
      </SubmitButton>
    </Form>
  );
};

export default RegisterForm; 