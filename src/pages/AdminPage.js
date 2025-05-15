import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Здесь будет загрузка данных при реальной реализации
    setLoading(false);
    // Пример данных для демонстрации
    setUsers([
      { id: 1, email: 'admin@example.com', telegramId: '123456789', isAdmin: true },
      { id: 2, email: 'user@example.com', telegramId: '987654321', isAdmin: false }
    ]);
    setKeys([
      { id: 1, userId: 2, status: 'active', expiresAt: '2024-06-30', name: 'Ключ 1' },
      { id: 2, userId: 2, status: 'expired', expiresAt: '2024-04-01', name: 'Ключ 2' }
    ]);
  }, []);

  if (!user || !user.isAdmin) {
    return (
      <div>
        <h1>Доступ запрещен</h1>
        <p>У вас нет прав доступа к этой странице.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Панель администратора</h1>
      
      {loading ? (
        <p>Загрузка данных...</p>
      ) : (
        <>
          <section className="admin-section">
            <h2>Пользователи ({users.length})</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Telegram ID</th>
                  <th>Админ</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.telegramId}</td>
                    <td>{user.isAdmin ? 'Да' : 'Нет'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          
          <section className="admin-section">
            <h2>VPN-ключи ({keys.length})</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пользователь ID</th>
                  <th>Статус</th>
                  <th>Действует до</th>
                  <th>Название</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(key => (
                  <tr key={key.id}>
                    <td>{key.id}</td>
                    <td>{key.userId}</td>
                    <td>{key.status === 'active' ? 'Активен' : 'Истек'}</td>
                    <td>{key.expiresAt}</td>
                    <td>{key.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminPage; 