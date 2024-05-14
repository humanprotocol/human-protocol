import axios from 'axios';
import { verifyToken, registerLabeler, getLabelerData } from './hcaptcha';

jest.mock('axios');

describe('hCaptchaService', () => {
  describe('verifyToken', () => {
    it('should verify hCaptcha token successfully', async () => {
      const mockData = {
        url: 'https://example.com',
        secret: 'secret-key',
        sitekey: 'site-key',
        ip: '127.0.0.1',
        token: 'token',
      };

      const mockResponseData = { success: true };

      (axios.post as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const result = await verifyToken(mockData);

      expect(result).toEqual(mockResponseData);
      expect(axios.post).toHaveBeenCalledWith(
        `${mockData.url}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });

    it('should verify hCaptcha token successfully without IP', async () => {
      const mockData = {
        url: 'https://example.com',
        secret: 'secret-key',
        sitekey: 'site-key',
        token: 'token',
      };

      const mockResponseData = { success: true };

      (axios.post as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const result = await verifyToken(mockData);

      expect(result).toEqual(mockResponseData);
      expect(axios.post).toHaveBeenCalledWith(
        `${mockData.url}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });

    it('should return false if API response status is not 200', async () => {
      const mockData = {
        url: 'https://example.com',
        secret: 'secret-key',
        sitekey: 'site-key',
        token: 'token',
      };

      const mockResponseData = { success: false };

      (axios.post as jest.Mock).mockResolvedValueOnce({
        status: 400,
        data: mockResponseData,
      });

      const result = await verifyToken(mockData);

      expect(result).toEqual(false);
      expect(axios.post).toHaveBeenCalledWith(
        `${mockData.url}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });

    it('should return false if API response does not contain data', async () => {
      const mockData = {
        url: 'https://example.com',
        secret: 'secret-key',
        sitekey: 'site-key',
        token: 'token',
      };

      (axios.post as jest.Mock).mockResolvedValueOnce({ status: 200 });

      const result = await verifyToken(mockData);

      expect(result).toEqual(false);
      expect(axios.post).toHaveBeenCalledWith(
        `${mockData.url}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });

    it('should return false if API request fails', async () => {
      const mockData = {
        url: 'https://example.com',
        secret: 'secret-key',
        sitekey: 'site-key',
        token: 'token',
      };

      (axios.post as jest.Mock).mockRejectedValueOnce(
        new Error('Network Error'),
      );

      const result = await verifyToken(mockData);

      expect(result).toEqual(false);
      expect(axios.post).toHaveBeenCalledWith(
        `${mockData.url}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });
  });

  describe('registerLabeler', () => {
    it('should register labeler successfully', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        ip: '127.0.0.1',
        email: 'test@example.com',
        language: 'en',
        country: 'US',
        address: '0xabcdef1234567890',
      };

      (axios.post as jest.Mock).mockResolvedValueOnce({ status: 200 });

      const result = await registerLabeler(mockData);

      expect(result).toEqual(true);
      expect(axios.post).toHaveBeenCalledWith(
        `${mockData.url}/labeler/register`,
        expect.any(Object),
        { params: expect.any(Object) },
      );
    });

    it('should register labeler successfully without IP', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        email: 'test@example.com',
        language: 'en',
        country: 'US',
        address: '0xabcdef1234567890',
      };

      (axios.post as jest.Mock).mockResolvedValueOnce({ status: 200 });

      const result = await registerLabeler(mockData);

      expect(result).toEqual(true);
      expect(axios.post).toHaveBeenCalledWith(
        `${mockData.url}/labeler/register`,
        expect.any(Object),
        { params: expect.any(Object) },
      );
    });

    it('should return false if API response status is not 200', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        ip: '127.0.0.1',
        email: 'test@example.com',
        language: 'en',
        country: 'US',
        address: '0xabcdef1234567890',
      };

      (axios.post as jest.Mock).mockResolvedValueOnce({ status: 400 });

      const result = await registerLabeler(mockData);

      expect(result).toEqual(false);
      expect(axios.post).toHaveBeenCalledWith(
        `${mockData.url}/labeler/register`,
        expect.any(Object),
        { params: expect.any(Object) },
      );
    });

    it('should return false if API request fails', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        ip: '127.0.0.1',
        email: 'test@example.com',
        language: 'en',
        country: 'US',
        address: '0xabcdef1234567890',
      };

      (axios.post as jest.Mock).mockRejectedValueOnce(
        new Error('Network Error'),
      );

      const result = await registerLabeler(mockData);

      expect(result).toEqual(false);
      expect(axios.post).toHaveBeenCalledWith(
        `${mockData.url}/labeler/register`,
        expect.any(Object),
        { params: expect.any(Object) },
      );
    });
  });

  describe('getLabelerData', () => {
    it('should retrieve labeler data successfully', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        email: 'test@example.com',
      };

      const mockResponseData = { labelerData: 'data' };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const result = await getLabelerData(mockData);

      expect(result).toEqual(mockResponseData);
      expect(axios.get).toHaveBeenCalledWith(`${mockData.url}/support/users`, {
        params: expect.any(Object),
      });
    });

    it('should return null if API response status is not 200', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        email: 'test@example.com',
      };

      const mockResponseData = { labelerData: 'data' };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        status: 400,
        data: mockResponseData,
      });

      const result = await getLabelerData(mockData);

      expect(result).toEqual(null);
      expect(axios.get).toHaveBeenCalledWith(`${mockData.url}/support/users`, {
        params: expect.any(Object),
      });
    });

    it('should return null if API response does not contain data', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        email: 'test@example.com',
      };

      (axios.get as jest.Mock).mockResolvedValueOnce({ status: 200 });

      const result = await getLabelerData(mockData);

      expect(result).toEqual(null);
      expect(axios.get).toHaveBeenCalledWith(`${mockData.url}/support/users`, {
        params: expect.any(Object),
      });
    });

    it('should return null if API request fails', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        email: 'test@example.com',
      };

      (axios.get as jest.Mock).mockRejectedValueOnce(
        new Error('Network Error'),
      );

      const result = await getLabelerData(mockData);

      expect(result).toEqual(null);
      expect(axios.get).toHaveBeenCalledWith(`${mockData.url}/support/users`, {
        params: expect.any(Object),
      });
    });
  });
});
