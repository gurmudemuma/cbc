import { body, ValidationChain } from 'express-validator';
import bcrypt from 'bcryptjs';

export class PasswordValidator {
  private static readonly DEFAULT_MIN_LENGTH = 12;
  private static readonly MAX_LENGTH = 128;
  
  // Common weak passwords to reject
  private static readonly WEAK_PASSWORDS = new Set([
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'password1', '123456789', '1234567890', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'sunshine',
    'princess', 'starwars', 'password1234', 'admin123', 'root',
    'test', 'test123', 'user', 'user123', 'demo', 'demo123'
  ]);

  /**
   * Validate password meets security requirements
   */
  public static validatePassword(): ValidationChain {
    const minLen = process.env['NODE_ENV'] === 'production' ? this.DEFAULT_MIN_LENGTH : 8;
    return body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: minLen, max: this.MAX_LENGTH })
      .withMessage(`Password must be between ${minLen} and ${this.MAX_LENGTH} characters`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      )
      .custom((value: string) => {
        // Check for common weak passwords
        if (this.WEAK_PASSWORDS.has(value.toLowerCase())) {
          throw new Error('Password is too common. Please choose a stronger password');
        }
        return true;
      })
      .custom((value: string) => {
        // Check for repeated characters (e.g., "aaa", "111")
        if (/(.)\1{2,}/.test(value)) {
          throw new Error('Password cannot contain more than 2 repeated characters in a row');
        }
        return true;
      })
      .custom((value: string) => {
        // In production, disallow simple sequential patterns (e.g., "123", "abc")
        if (process.env['NODE_ENV'] === 'production') {
          const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
          for (const seq of sequences) {
            for (let i = 0; i < seq.length - 2; i++) {
              const pattern = seq.substring(i, i + 3);
              if (value.toLowerCase().includes(pattern)) {
                throw new Error('Password cannot contain sequential characters');
              }
            }
          }
        }
        return true;
      });
  }

  /**
   * Validate password confirmation matches
   */
  public static validatePasswordConfirmation(): ValidationChain {
    return body('passwordConfirmation')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      });
  }

  /**
   * Hash password securely
   */
  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  public static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Check password strength and return score
   * @returns Score from 0-100
   */
  public static checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= this.DEFAULT_MIN_LENGTH) {
      score += 20;
    } else {
      feedback.push(`Password should be at least ${this.DEFAULT_MIN_LENGTH} characters`);
    }

    if (password.length >= 16) {
      score += 10;
    }

    // Complexity checks
    if (/[a-z]/.test(password)) {
      score += 15;
    } else {
      feedback.push('Add lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 15;
    } else {
      feedback.push('Add uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 15;
    } else {
      feedback.push('Add numbers');
    }

    if (/[@$!%*?&]/.test(password)) {
      score += 15;
    } else {
      feedback.push('Add special characters (@$!%*?&)');
    }

    // Variety check
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) {
      score += 10;
    } else {
      feedback.push('Use more varied characters');
    }

    // Check for common patterns
    if (this.WEAK_PASSWORDS.has(password.toLowerCase())) {
      score = Math.min(score, 30);
      feedback.push('Password is too common');
    }

    if (feedback.length === 0) {
      feedback.push('Strong password!');
    }

    return { score, feedback };
  }

  /**
   * Generate a strong random password
   */
  public static generateStrongPassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '@$!%*?&';
    const all = lowercase + uppercase + numbers + special;

    let password = '';
    
    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
