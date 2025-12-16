import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

describe('National Bank FX Rates API', () => {
  describe('GET /api/fx-rates', () => {
    it('should return current FX rates', async () => {
      const res = await request(app)
        .get('/api/fx-rates')
        .set('Authorization', 'Bearer valid-token');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rates');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/fx-rates');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/approvals', () => {
    it('should approve valid transaction', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', 'Bearer valid-token')
        .send({
          exportId: 'EXP001',
          amount: 50000,
          currency: 'USD'
        });
      
      expect(res.status).toBe(201);
    });
  });
});
