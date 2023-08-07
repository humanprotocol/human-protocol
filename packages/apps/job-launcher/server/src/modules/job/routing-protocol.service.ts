import { Injectable, Logger } from '@nestjs/common';
import { ChainId, NETWORKS } from '@human-protocol/sdk';

@Injectable()
export class RoutingProtocolService {
  public readonly logger = new Logger(RoutingProtocolService.name);
  private readonly chains: ChainId[];
  private currentIndex: number;
  private readonly priorityOrder: number[];

  constructor() {
    this.chains = Object.keys(NETWORKS).map((chainId) => +chainId);
    this.currentIndex = 0;
    this.priorityOrder = this.generatePriorityOrder();
  }

  private generatePriorityOrder() {
    const priorityOrder = Array.from(Array(this.chains.length).keys());
    for (let i = priorityOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [priorityOrder[i], priorityOrder[j]] = [
        priorityOrder[j],
        priorityOrder[i],
      ];
    }
    return priorityOrder;
  }

  public selectNetwork(): ChainId {
    const chainId = this.chains[this.priorityOrder[this.currentIndex]];
    this.currentIndex = (this.currentIndex + 1) % this.chains.length;
    return chainId;
  }
}
