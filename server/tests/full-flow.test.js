const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/User');
const sinon = require('sinon');
const blockchainService = require('../blockchainService');
const { connectDB } = require('../db');

describe('Full Flow: Регистрация, логин, оплата', () => {
  let token;
  let userId;
  let blockchainStub;

  before(async () => {
    await connectDB();
    // Мокаем блокчейн-сервис
    blockchainStub = sinon.stub(blockchainService, 'generatePaymentAddress').resolves('0x123456789');
    sinon.stub(blockchainService, 'checkPayment').resolves({ status: 'pending' });
  });

  after(() => {
    // Восстанавливаем оригинальные методы
    blockchainStub.restore();
    sinon.restore();
  });

  it('Регистрирует нового пользователя', async () => {
    const email = `testuser_${Date.now()}@test.com`;
    const password = 'testpass123';

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password });

    expect(res.status).to.equal(201);

    // Логин сразу после регистрации
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(loginRes.status).to.equal(200);
    expect(loginRes.body).to.have.property('token');
    token = loginRes.body.token;

    // Получаем профиль
    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    console.log('Ответ /api/auth/me:', profileRes.body);
    expect(profileRes.status).to.equal(200);
    expect(profileRes.body).to.have.property('id');
    userId = profileRes.body.id;
    console.log('userId из профиля:', userId);
    if (!userId) throw new Error('userId не получен из профиля!');
  });

  it('Создаёт платеж для пользователя', async () => {
    const paymentData = {
      amount: 10.0,
      currency: 'eth',
      plan: 'basic',
      period: 30, // 30 дней для monthly
      userId: userId
    };

    const res = await request(app)
      .post('/api/payment/create')
      .set('Authorization', `Bearer ${token}`)
      .send(paymentData);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('payment');
    expect(res.body.payment).to.have.property('paymentId');
    expect(res.body.payment).to.have.property('cryptoAddress');
    expect(res.body.payment.cryptoAddress).to.equal('0x123456789');
  });
}); 