import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class SignatureGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Verify signature
    // Get escrow.recording_oracle_address = signature payload recording_oracle_address in Escrow
    // Get escrow.recording_oracle_url = origin url using recording_oracle_address in KVStore
    // signature data equal payload

    return true;
  }
}
