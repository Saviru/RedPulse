import request from 'supertest';
import app from '../../app';

describe('Auth Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
    role: 'USER',
    fullName: 'John Doe',
    phone: '0711234567',
  };



  it('should register a new user normally', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    
    const mongoose = require('mongoose');
    const otpRecord = await mongoose.connection.collection('otps').findOne({ email: testUser.email, purpose: 'REGISTER' });
    expect(otpRecord).toBeDefined();

    const verifyRes = await request(app)
      .post('/auth/verify-registration')
      .send({ email: testUser.email, otp: otpRecord.otp });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body).toHaveProperty('accessToken');
    expect(verifyRes.body.user).toHaveProperty('email', testUser.email);
  });

  it('should login an existing user normally', async () => {
    await request(app).post('/auth/register').send(testUser);
    
    const mongoose = require('mongoose');
    const otpRecord = await mongoose.connection.collection('otps').findOne({ email: testUser.email, purpose: 'REGISTER' });
    if (otpRecord) {
        await request(app).post('/auth/verify-registration').send({ email: testUser.email, otp: otpRecord.otp });
    }

    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should register an organization with PKCE flow', async () => {
    const pkceOrg = {
      email: 'org@example.com',
      username: 'pkceorg',
      password: 'password123',
      role: 'ORGANIZATION',
      organizationName: 'RedCross',
      registrationNumber: '123456',
      contactNumber: '00000000',
      phone: '0721234567',
      codeChallenge: 'example_challenge_hash'
    };



    const res = await request(app)
      .post('/auth/register')
      .send(pkceOrg);

    expect(res.status).toBe(201);

    const mongoose = require('mongoose');
    const otpRecord = await mongoose.connection.collection('otps').findOne({ email: pkceOrg.email, purpose: 'REGISTER' });
    expect(otpRecord).toBeDefined();

    const verifyRes = await request(app)
      .post('/auth/verify-registration')
      .send({ email: pkceOrg.email, otp: otpRecord.otp, codeChallenge: pkceOrg.codeChallenge });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body).toHaveProperty('authorizationCode');
    expect(verifyRes.body).not.toHaveProperty('accessToken'); // prevent sending access token
  });

  it('should get current user info on /auth/me', async () => {
    // Register
    await request(app).post('/auth/register').send(testUser);

    const mongoose = require('mongoose');
    const otpRecord = await mongoose.connection.collection('otps').findOne({ email: testUser.email, purpose: 'REGISTER' });
    if (otpRecord) {
        await request(app).post('/auth/verify-registration').send({ email: testUser.email, otp: otpRecord.otp });
    }

    // Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const token = loginRes.body.accessToken;

    const meRes = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe(testUser.email);
  });
});
