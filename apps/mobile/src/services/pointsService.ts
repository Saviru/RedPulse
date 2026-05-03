import api from './api';

export interface Offer {
  _id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: string;
  hospitalId?: string;
}

export interface Fundraising {
  _id: string;
  title: string;
  description: string;
  goalLKR: number;
  currentPoints: number;
  organizationId: string;
}

export const pointsService = {
  // Offers (Hospitals & Users)
  getOffers: async (): Promise<Offer[]> => {
    const response = await api.get('/points/offers');
    return response.data;
  },
  
  createOffer: async (data: Partial<Offer>): Promise<Offer> => {
    const response = await api.post('/points/offers', data);
    return response.data;
  },
  
  updateOffer: async (id: string, data: Partial<Offer>): Promise<Offer> => {
    const response = await api.put(`/points/offers/${id}`, data);
    return response.data;
  },
  
  deleteOffer: async (id: string): Promise<void> => {
    await api.delete(`/points/offers/${id}`);
  },

  // Fundraising (Organizations & Users)
  getFundraisings: async (): Promise<Fundraising[]> => {
    const response = await api.get('/points/fundraising');
    return response.data;
  },
  
  createFundraising: async (data: Partial<Fundraising>): Promise<Fundraising> => {
    const response = await api.post('/points/fundraising', data);
    return response.data;
  },
  
  updateFundraising: async (id: string, data: Partial<Fundraising>): Promise<Fundraising> => {
    const response = await api.put(`/points/fundraising/${id}`, data);
    return response.data;
  },
  
  deleteFundraising: async (id: string): Promise<void> => {
    await api.delete(`/points/fundraising/${id}`);
  },

  // Transactions (Users)
  redeemOffer: async (offerId: string): Promise<{ currentPoints: number }> => {
    const response = await api.post('/points/redeem', { offerId });
    return response.data;
  },
  
  donatePoints: async (fundraisingId: string, pointsAmount: number): Promise<{ currentPoints: number }> => {
    const response = await api.post('/points/donate', { fundraisingId, pointsAmount });
    return response.data;
  },
  
  getTransactions: async (): Promise<any[]> => {
    const response = await api.get('/points/transactions');
    return response.data;
  },

  getHospitalRedemptions: async (): Promise<any[]> => {
    const response = await api.get('/points/hospital/redemptions');
    return response.data;
  },

  getOrganizationDonations: async (): Promise<any[]> => {
    const response = await api.get('/points/organization/donations');
    return response.data;
  }
};
