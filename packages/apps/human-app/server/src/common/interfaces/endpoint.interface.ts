import { ExternalApiName } from '../enums/external-api-name';

export interface GatewayEndpointConfig {
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  params?: Record<string, string | boolean | number>;
}

export interface GatewayConfig {
  url: string;
  endpoints: Record<string, GatewayEndpointConfig>;
}

export interface Gateways {
  gateways: Record<ExternalApiName, GatewayConfig>;
}
