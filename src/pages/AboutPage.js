import React from 'react';

const AboutPage = () => {
  return (
    <div className="about-page">
      <h1>О сервисе Kitty Poop VPN</h1>
      
      <section className="about-section">
        <h2>Наша миссия</h2>
        <p>
          Мы создаем простой и надежный VPN-сервис, который помогает пользователям
          сохранять приватность в сети и получать доступ к контенту без ограничений.
          Наш приоритет — обеспечение высокой скорости соединения и безопасности ваших данных.
        </p>
      </section>
      
      <section className="about-section">
        <h2>Преимущества нашего сервиса</h2>
        <ul>
          <li>
            <strong>Высокая скорость:</strong> Наши серверы оптимизированы для быстрого 
            и стабильного соединения.
          </li>
          <li>
            <strong>Защита данных:</strong> Мы используем современные протоколы шифрования 
            для обеспечения безопасности вашего трафика.
          </li>
          <li>
            <strong>Простота использования:</strong> Наше приложение интуитивно понятно 
            и не требует специальных технических знаний.
          </li>
          <li>
            <strong>Доступность:</strong> Мы предлагаем доступные тарифы с разными сроками 
            подписки.
          </li>
        </ul>
      </section>
      
      <section className="about-section">
        <h2>Используемые технологии</h2>
        <p>
          Наш VPN-сервис работает на базе протокола VLESS с дополнительным слоем 
          защиты REALITY. Это обеспечивает как высокую скорость соединения, так и 
          надежную защиту от блокировок и обнаружения.
        </p>
      </section>
      
      <section className="about-section">
        <h2>Наши контакты</h2>
        <p>
          Email: support@kittypoop.vpn<br />
          Telegram: <a href="https://t.me/kittypoop_vpn">@kittypoop_vpn</a>
        </p>
      </section>
    </div>
  );
};

export default AboutPage; 