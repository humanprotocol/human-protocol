export interface GatewayEndpointConfig {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
}

export interface GatewayConfig {
  url: string;
  endpoints: Record<string, GatewayEndpointConfig>;
}

export interface Gateways {
  gateways: Record<string, GatewayConfig>;
}