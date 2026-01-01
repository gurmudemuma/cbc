export class SecurityConfig {
  private static validateJWTSecret(secret: string | undefined): string {
    if (!secret) {
      throw new Error(
        'SECURITY ERROR: JWT_SECRET environment variable is required. Generate with: openssl rand -base64 64'
      );
    }

    if (process.env['NODE_ENV'] === 'production') {
      if (secret.length < 64) {
        throw new Error(
          'SECURITY ERROR: JWT_SECRET must be at least 64 characters in production'
        );
      }
      
      if (secret.includes('dev') || secret.includes('test') || secret.includes('change') || secret.includes('example')) {
        throw new Error(
          'SECURITY ERROR: JWT_SECRET appears to be a development/example secret. Use a production-grade secret.'
        );
      }
    } else {
      // Even in development, warn about weak secrets
      if (secret.length < 32) {
        console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long');
      }
    }

    return secret;
  }

  public static getJWTSecret(): string {
    return this.validateJWTSecret(process.env['JWT_SECRET']);
  }

  public static getJWTExpiresIn(): string {
    return process.env['JWT_EXPIRES_IN'] || '1h'; // Reduced from 24h for security
  }

  public static getJWTRefreshExpiresIn(): string {
    return process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';
  }
}
