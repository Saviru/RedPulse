import request from 'supertest';
import app from '../../app';

describe('User Endpoints', () => {
  let token: string;

  beforeEach(async () => {
    // Register and login a user before each test to get the token
    const res = await request(app).post('/auth/register').send({
      email: 'user_test@example.com',
      username: 'usertest',
      password: 'password123',
      role: 'USER',
      fullName: 'Test User',
      phone: '0711234568',
    });

    const mongoose = require('mongoose');
    const otpRecord = await mongoose.connection.collection('otps').findOne({ email: 'user_test@example.com', purpose: 'REGISTER' });
    
    if (otpRecord) {
      const verifyRes = await request(app).post('/auth/verify-registration').send({ email: 'user_test@example.com', otp: otpRecord.otp });
      token = verifyRes.body.accessToken;
    } else {
      token = res.body.accessToken; // fallback just in case
    }
  });

  it('should update user profile', async () => {
    const res = await request(app)
      .put('/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Updated Name',
      });

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Updated Name');
  });


  it('should delete user profile', async () => {
    const requestDeleteRes = await request(app)
      .post('/users/request-delete')
      .set('Authorization', `Bearer ${token}`);

    expect(requestDeleteRes.status).toBe(200);

    const mongoose = require('mongoose');
    const otpRecord = await mongoose.connection.collection('otps').findOne({ email: 'user_test@example.com', purpose: 'DELETE' });
    expect(otpRecord).toBeDefined();

    const deleteRes = await request(app)
      .post('/users/confirm-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ otp: otpRecord.otp });

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe('Account deleted successfully');

    // Try fetching me after deleting
    const meRes = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(404);
  });
});
