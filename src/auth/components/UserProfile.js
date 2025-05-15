import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 25px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const Avatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  font-weight: 600;
`;

const AvatarImg = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-color);
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
`;

const UserEmail = styled.p`
  margin: 5px 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const ProfileDetails = styled.div`
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const DetailLabel = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const DetailValue = styled.span`
  color: var(--text-color);
  font-weight: 500;
`;

const LogoutButton = styled(motion.button)`
  margin-top: 20px;
  padding: 12px 15px;
  background: rgba(255, 76, 76, 0.8);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background: rgba(255, 76, 76, 1);
  }
`;

const KeysButton = styled(Link)`
  display: inline-block;
  margin: 25px auto 0 auto;
  padding: 16px 36px;
  background: linear-gradient(90deg, #ff66c4, #8a64ff);
  color: #fff;
  font-size: 1.15rem;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(140, 82, 255, 0.15);
  transition: background 0.3s, transform 0.2s;
  text-align: center;
  cursor: pointer;
  &:hover {
    background: linear-gradient(90deg, #8a64ff, #ff66c4);
    transform: translateY(-2px) scale(1.04);
  }
`;

// Список emoji-аватарок
const EMOJI_AVATARS = [
  '😺', // кот
  '🐶', // собака
  '💩', // какашка
  '🐱', // кошка
  '🐻', // медведь
  '🦊', // лиса
  '🐵', // обезьяна
  '🦄', // единорог
  '🐸', // лягушка
  '🐼', // панда
];

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    toast.success('Вы успешно вышли из системы');
    navigate('/login');
  };
  
  // Получаем инициалы пользователя для аватара
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    } else if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    } else if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };
  
  // Формируем ссылку на Telegram-профиль
  const tgProfileUrl = user?.username
    ? `https://t.me/${user.username}`
    : user?.telegramId
      ? `https://t.me/user?id=${user.telegramId}`
      : null;

  // Для совместимости: поддержка photo_url (если backend отдаёт)
  const photoUrl = user?.photo_url || user?.photoUrl;
  
  // Получаем emoji-аватар пользователя (или назначаем при первой регистрации)
  let avatarEmoji = user?.avatarEmoji;
  if (!avatarEmoji) {
    // Пробуем взять из localStorage (по Telegram ID)
    const emojiKey = `avatar_emoji_${user?.telegramId || user?.id}`;
    avatarEmoji = localStorage.getItem(emojiKey);
    if (!avatarEmoji) {
      // Если нет — выбираем случайную emoji и сохраняем
      avatarEmoji = EMOJI_AVATARS[Math.floor(Math.random() * EMOJI_AVATARS.length)];
      localStorage.setItem(emojiKey, avatarEmoji);
    }
  }
  
  if (!user) {
    return (
      <ProfileContainer>
        <p>Загрузка данных пользователя...</p>
      </ProfileContainer>
    );
  }
  
  return (
    <ProfileContainer>
      <ProfileHeader>
        {photoUrl ? (
          <AvatarImg src={photoUrl} alt="Аватар Telegram" />
        ) : (
          // Показываем emoji-аватар вместо цветного круга
          <Avatar style={{ fontSize: 40 }}>{avatarEmoji}</Avatar>
        )}
        <UserInfo>
          <UserName>
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || user.username || user.email?.split('@')[0] || 'Пользователь'}
            {user.username && (
              <span style={{ color: '#8a64ff', fontWeight: 400, marginLeft: 8 }}>
                @{user.username}
              </span>
            )}
          </UserName>
          {tgProfileUrl && (
            <a href={tgProfileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#24a1de', fontSize: '0.95rem', textDecoration: 'underline', marginTop: 2 }}>
              Открыть Telegram-профиль
            </a>
          )}
          <UserEmail>{user.email || 'Нет email'}</UserEmail>
        </UserInfo>
      </ProfileHeader>
      
      <ProfileDetails>
        <DetailRow>
          <DetailLabel>ID пользователя</DetailLabel>
          <DetailValue>{user.id}</DetailValue>
        </DetailRow>
        {user.telegramId && (
          <DetailRow>
            <DetailLabel>Telegram ID</DetailLabel>
            <DetailValue>{user.telegramId}</DetailValue>
          </DetailRow>
        )}
        {user.username && (
          <DetailRow>
            <DetailLabel>Username</DetailLabel>
            <DetailValue>@{user.username}</DetailValue>
          </DetailRow>
        )}
      </ProfileDetails>
      
      <LogoutButton 
        onClick={handleLogout}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Выйти из системы
      </LogoutButton>
      
      {/* Кнопка перехода к ключам */}
      <KeysButton to="/my-keys">
        🔑 Мои ключи VPN
      </KeysButton>
    </ProfileContainer>
  );
};

export default UserProfile; 