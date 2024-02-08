import { EndpointName } from '../enums/endpoint-name';
import { ExternalApiName } from '../enums/external-api-name';

export interface GatewayEndpointConfig {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
}

export interface GatewayConfig {
  url: string;
  endpoints: Record<EndpointName, GatewayEndpointConfig>;
}

export interface Gateways {
  gateways: Record<ExternalApiName, GatewayConfig>;
}
