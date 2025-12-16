import request from 'supertest';

describe('API Integration Tests', () => {
  const COMMERCIAL_BANK_URL = process.env.COMMERCIAL_BANK_URL || 'http://localhost:3001';
  const NATIONAL_BANK_URL = process.env.NATIONAL_BANK_URL || 'http://localhost:3002';
  
  let authToken: string;
  let exportId: string;

  describe('End-to-End Export Flow', () => {
    it('should authenticate user', async () => {
      const res = await request(COMMERCIAL_BANK_URL)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('should create export request', async () => {
      const res = await request(COMMERCIAL_BANK_URL)
        .post('/api/exports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          exporterId: 'EXP001',
          coffeeType: 'Arabica',
          quantity: 1000,
          destination: 'USA',
          estimatedValue: 50000
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('exportId');
      exportId = res.body.exportId;
    });

    it('should retrieve export details', async () => {
      const res = await request(COMMERCIAL_BANK_URL)
        .get(`/api/exports/${exportId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.exportId).toBe(exportId);
    });

    it('should approve export at National Bank', async () => {
      const res = await request(NATIONAL_BANK_URL)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          exportId,
          approved: true
        });
      
      expect(res.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid authentication', async () => {
      const res = await request(COMMERCIAL_BANK_URL)
        .get('/api/exports')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await request(COMMERCIAL_BANK_URL)
        .post('/api/exports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(res.status).toBe(400);
    });
  });
});
