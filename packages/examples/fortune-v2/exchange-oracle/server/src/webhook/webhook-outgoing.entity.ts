import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";

import { NS } from "../common/constants";
import { BaseEntity } from "../database/base.entity";
import { IWebhook, WebhookStatus } from "../common/decorators";

@Entity({ schema: NS, name: "webhook_incoming" })
export class WebhookOutgoingEntity extends BaseEntity implements IWebhook {
  @Column({ type: "text" })
  public signature: string;

  @Column({ type: "int" })
  public chainId: number;

  @Column({ type: "varchar" })
  public escrowAddress: string;

  @Column({ type: "varchar" })
  public s3Url: string;

  @Column({ type: "timestamptz" })
  public waitUntil: Date;
}
