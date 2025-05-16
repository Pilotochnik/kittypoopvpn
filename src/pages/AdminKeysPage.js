import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FaCheck, FaRegCopy, FaTrash, FaPowerOff, FaDownload, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const PageContainer = styled.div`
  padding: 32px 16px;
  max-width: 1200px;
  margin: 0 auto;
  @media (max-width: 600px) {
    padding: 0 0 32px 0;
    min-width: 0;
    background: #10182a;
  }
`;
const Title = styled.h1`
  color: #229ED9;
  margin-bottom: 18px;
  font-size: 2.1rem;
  @media (max-width: 600px) {
    font-size: 1.1rem;
    margin-bottom: 8px;
    text-align: center;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
`;
const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
  background: #10182a;
  padding: 10px 0 8px 0;
  box-shadow: 0 2px 12px 0 rgba(34,158,217,0.10);
  @media (max-width: 600px) {
    gap: 6px;
    margin-bottom: 4px;
    overflow-x: auto;
    padding: 8px 2px 6px 2px;
    justify-content: flex-start;
    border-radius: 0 0 12px 12px;
    background: #10182a;
    box-shadow: 0 2px 12px 0 rgba(34,158,217,0.18);
  }
`;
const SearchInput = styled.input`
  padding: 10px 14px;
  border-radius: 10px;
  border: 2px solid #229ED9;
  font-size: 1.1rem;
  min-width: 120px;
  background: #fff;
  @media (max-width: 600px) {
    font-size: 1rem;
    padding: 8px 6px;
    border-radius: 8px;
    min-width: 90px;
    flex: 1 1 100px;
  }
`;
const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-bottom: 18px;
  scrollbar-width: thin;
  scrollbar-color: #229ED9 #e3f0ff;
  @media (max-width: 600px) {
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(34,158,217,0.18);
    background: #fff;
    padding-bottom: 4px;
    margin-bottom: 8px;
    -webkit-overflow-scrolling: touch;
    max-height: 60vh;
    overflow-y: auto;
  }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #f8fbff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px 0 rgba(34, 158, 217, 0.10), 0 2px 8px rgba(0,0,0,0.07);
  @media (max-width: 600px) {
    font-size: 0.92rem;
    min-width: 600px;
  }
`;
const Th = styled.th`
  background: #d0e6fa;
  color: #1a2a36;
  padding: 12px 8px;
  font-weight: 800;
  font-size: 1.05rem;
  @media (max-width: 600px) {
    font-size: 0.85rem;
    padding: 7px 4px;
  }
`;
const Td = styled.td`
  padding: 10px 8px;
  border-bottom: 1px solid #e3f0ff;
  font-size: 1.01rem;
  color: #1a2a36;
  background: #fff;
  word-break: break-word;
  @media (max-width: 600px) {
    font-size: 0.85rem;
    padding: 7px 4px;
    min-width: 60px;
  }
`;
const TableRow = styled.tr`
  &:nth-child(even) ${Td} {
    background: #f0f6fa;
  }
`;
const ActionBtn = styled.button`
  background: #229ED9;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  margin-right: 8px;
  cursor: pointer;
  font-size: 1.15rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(34,158,217,0.10);
  transition: background 0.15s, box-shadow 0.15s;
  &:hover { background: #60cfff; box-shadow: 0 2px 12px rgba(34,158,217,0.18); }
  @media (max-width: 600px) {
    font-size: 1.1rem;
    padding: 10px 10px;
    border-radius: 7px;
    margin-right: 3px;
    min-width: 36px;
  }
`;
const DangerBtn = styled(ActionBtn)`
  background: #ff4d4f;
  &:hover { background: #ff7875; }
`;
const ExportBtn = styled(ActionBtn)`
  background: #2ecc40;
  &:hover { background: #27ae60; }
`;

const AdminKeysPage = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Получение всех ключей
  const fetchKeys = async () => {
    setLoading(true);
    try {
      const headers = {};
      if (user && user.isAdmin && user.telegramId) {
        headers['x-admin-telegram-id'] = user.telegramId;
      }
      const res = await fetch('/api/vpn/all-keys', { headers });
      const data = await res.json();
      if (data.success) setKeys(data.keys);
      else toast.error(data.message || 'Ошибка загрузки ключей');
    } catch (e) {
      toast.error('Ошибка загрузки ключей');
    }
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, [user]);

  // Фильтрация и поиск
  const filteredKeys = keys.filter(key => {
    if (filter === 'active' && !key.isActive) return false;
    if (filter === 'inactive' && key.isActive) return false;
    if (filter === 'trial' && !key.isTrial) return false;
    if (filter === 'paid' && key.isTrial) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        (key.uuid && key.uuid.toLowerCase().includes(s)) ||
        (key.userId && key.userId.toString().includes(s)) ||
        (key.plan && key.plan.toLowerCase().includes(s))
      );
    }
    return true;
  });

  // Действия
  const handleActivate = async (uuid) => {
    try {
      const res = await fetch(`/api/vpn/key/${uuid}/activate`, { method: 'POST', headers: { 'x-admin-telegram-id': user?.telegramId || '' } });
      const data = await res.json();
      if (data.success) { toast.success('Ключ активирован'); fetchKeys(); }
      else toast.error(data.message);
    } catch { toast.error('Ошибка активации'); }
  };
  const handleDeactivate = async (uuid) => {
    try {
      const res = await fetch(`/api/vpn/key/${uuid}/deactivate`, { method: 'POST', headers: { 'x-admin-telegram-id': user?.telegramId || '' } });
      const data = await res.json();
      if (data.success) { toast.success('Ключ деактивирован'); fetchKeys(); }
      else toast.error(data.message);
    } catch { toast.error('Ошибка деактивации'); }
  };
  const handleDelete = async (uuid) => {
    if (!window.confirm('Удалить ключ безвозвратно?')) return;
    try {
      const res = await fetch(`/api/vpn/key/${uuid}/delete`, { method: 'DELETE', headers: { 'x-admin-telegram-id': user?.telegramId || '' } });
      const data = await res.json();
      if (data.success) { toast.success('Ключ удалён'); fetchKeys(); }
      else toast.error(data.message);
    } catch { toast.error('Ошибка удаления'); }
  };
  const handleCopy = (config) => {
    navigator.clipboard.writeText(config);
    toast.success('Ключ скопирован!');
  };
  const handleExportCSV = () => { window.open('/api/vpn/export', '_blank'); };
  const handleExportJSON = () => { window.open('/api/vpn/export-json', '_blank'); };

  return (
    <div className="container">
      <Title>Админ-панель: Управление VPN-ключами</Title>
      <Controls>
        <SearchInput placeholder="Поиск по UUID, пользователю, тарифу..." value={search} onChange={e => setSearch(e.target.value)} />
        <ActionBtn onClick={() => setFilter('all')}>Все</ActionBtn>
        <ActionBtn onClick={() => setFilter('active')}>Активные</ActionBtn>
        <ActionBtn onClick={() => setFilter('inactive')}>Неактивные</ActionBtn>
        <ActionBtn onClick={() => setFilter('trial')}>Пробные</ActionBtn>
        <ActionBtn onClick={() => setFilter('paid')}>Платные</ActionBtn>
        <ExportBtn onClick={handleExportCSV}><FaDownload /> Экспорт CSV</ExportBtn>
        <ExportBtn onClick={handleExportJSON}><FaDownload /> Экспорт JSON</ExportBtn>
        <ActionBtn onClick={fetchKeys}><FaSearch /> Обновить</ActionBtn>
      </Controls>
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Ключ (config)</Th>
              <Th>Пользователь</Th>
              <Th>План</Th>
              <Th>Пробный</Th>
              <Th>Дата создания</Th>
              <Th>Дата окончания</Th>
              <Th>Активен</Th>
              <Th>Действия</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><Td colSpan={8}>Загрузка...</Td></tr>
            ) : filteredKeys.length === 0 ? (
              <tr><Td colSpan={8}>Нет ключей</Td></tr>
            ) : filteredKeys.map((key, i) => (
              <TableRow key={key.uuid + '_' + i}>
                <Td style={{wordBreak:'break-all'}}>
                  <span style={{fontFamily:'monospace', fontSize:'0.97em'}}>{key.config}</span>
                  <ActionBtn style={{marginLeft:4}} onClick={() => handleCopy(key.config)} title="Скопировать ключ"><FaRegCopy /></ActionBtn>
                </Td>
                <Td>{key.userId}</Td>
                <Td><span style={{color:'#229ED9', fontWeight:600}}>{key.plan}</span></Td>
                <Td>{key.isTrial ? <span style={{color:'#229ED9', fontWeight:600}}>Да</span> : <span style={{color:'#888'}}>Нет</span>}</Td>
                <Td>{key.createdAt ? new Date(key.createdAt).toLocaleString() : '-'}</Td>
                <Td>{key.expiresAt ? new Date(key.expiresAt).toLocaleString() : '-'}</Td>
                <Td>{key.isActive ? <span style={{color:'#2ecc40', fontWeight:600}}>Да</span> : <span style={{color:'#ff4d4f', fontWeight:600}}>Нет</span>}</Td>
                <Td>
                  {key.isActive ? (
                    <ActionBtn onClick={() => handleDeactivate(key.uuid)} title="Деактивировать"><FaPowerOff /></ActionBtn>
                  ) : (
                    <ActionBtn onClick={() => handleActivate(key.uuid)} title="Активировать"><FaPowerOff /></ActionBtn>
                  )}
                  <DangerBtn onClick={() => handleDelete(key.uuid)} title="Удалить"><FaTrash /></DangerBtn>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
    </div>
  );
};

export default AdminKeysPage; 