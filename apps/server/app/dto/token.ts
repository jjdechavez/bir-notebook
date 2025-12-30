import { AccessToken } from '@adonisjs/auth/access_tokens'

export class AccessTokenDto {
  constructor(private token: AccessToken) {}

  toJson() {
    return {
      type: this.token.type,
      name: this.token.name,
      token: this.token.value,
      abilities: this.token.abilities,
      lastUsedAt: this.token.lastUsedAt,
      expiresAt: this.token.expiresAt,
    }
  }
}
