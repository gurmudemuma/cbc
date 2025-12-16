import crypto from 'crypto';
import { envValidator } from '../env.validator';

/**
 * Data Encryption Service
 * Provides encryption/decryption for sensitive data
 */

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private encryptionKey: Buffer;
  private saltLength = 16;
  private tagLength = 16;
  private ivLength = 12;

  constructor() {
    const config = envValidator.getConfig();
    const keyString = config.ENCRYPTION_KEY || 'default-key-change-in-production';

    // Derive a 32-byte key from the provided key string
    this.encryptionKey = crypto.createHash('sha256').update(keyString).digest();
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = (cipher as crypto.CipherGCM).getAuthTag();

      // Combine IV, auth tag, and encrypted data
      const combined = iv.toString('hex') + authTag.toString('hex') + encrypted;

      return combined;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(ciphertext: string): string {
    try {
      // Extract IV, auth tag, and encrypted data
      const iv = Buffer.from(ciphertext.slice(0, this.ivLength * 2), 'hex');
      const authTag = Buffer.from(
        ciphertext.slice(this.ivLength * 2, this.ivLength * 2 + this.tagLength * 2),
        'hex'
      );
      const encrypted = ciphertext.slice(this.ivLength * 2 + this.tagLength * 2);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash password using bcrypt-like approach
   */
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  /**
   * Verify password
   */
  verifyPassword(password: string, hash: string): boolean {
    try {
      const parts = hash.split(':');
      const salt = Buffer.from(parts[0], 'hex');
      const storedHash = parts[1];

      const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');

      return computedHash.toString('hex') === storedHash;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Generate random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash data (one-way)
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate HMAC
   */
  generateHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data: string, secret: string, signature: string): boolean {
    const computed = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  }

  /**
   * Encrypt object
   */
  encryptObject(obj: Record<string, any>): string {
    const json = JSON.stringify(obj);
    return this.encrypt(json);
  }

  /**
   * Decrypt object
   */
  decryptObject(ciphertext: string): Record<string, any> {
    const json = this.decrypt(ciphertext);
    return JSON.parse(json);
  }

  /**
   * Encrypt sensitive fields in object
   */
  encryptSensitiveFields(obj: Record<string, any>, sensitiveFields: string[]): Record<string, any> {
    const encrypted = { ...obj };

    sensitiveFields.forEach((field) => {
      if (field in encrypted && encrypted[field]) {
        encrypted[field] = this.encrypt(String(encrypted[field]));
      }
    });

    return encrypted;
  }

  /**
   * Decrypt sensitive fields in object
   */
  decryptSensitiveFields(obj: Record<string, any>, sensitiveFields: string[]): Record<string, any> {
    const decrypted = { ...obj };

    sensitiveFields.forEach((field) => {
      if (field in decrypted && decrypted[field]) {
        try {
          decrypted[field] = this.decrypt(decrypted[field]);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
        }
      }
    });

    return decrypted;
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }

    const visible = data.slice(-visibleChars);
    const masked = '*'.repeat(data.length - visibleChars);

    return masked + visible;
  }

  /**
   * Generate API key
   */
  generateAPIKey(): { key: string; hash: string } {
    const key = crypto.randomBytes(32).toString('hex');
    const hash = this.hash(key);

    return { key, hash };
  }

  /**
   * Verify API key
   */
  verifyAPIKey(key: string, hash: string): boolean {
    const computedHash = this.hash(key);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  }
}

/**
 * Singleton instance
 */
let encryptionServiceInstance: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new EncryptionService();
  }
  return encryptionServiceInstance;
}

/**
 * Export singleton
 */
export const encryptionService = getEncryptionService();
