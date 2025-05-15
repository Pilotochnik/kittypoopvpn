const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/User');

describe('Authentication Tests', () => {
  let testUser;
  let authToken;

  before(async () => {
    // Создаем тестового пользователя
    const email = `test_${Date.now()}@test.com`;
    const password = 'testpass123';
    testUser = await User.create({
      email,
      password: await require('bcrypt').hash(password, 10)
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrongpass' });
      expect(res.status).to.equal(401);
    });

    it('should return 200 and token for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'testpass123' });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      authToken = res.body.token;
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).to.equal(401);
    });

    it('should return 200 for valid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
    });
  });
}); 