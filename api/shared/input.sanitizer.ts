import DOMPurify from 'isomorphic-dompurify';

export class InputSanitizer {
  private static readonly MAX_STRING_LENGTH = 1000;
  private static readonly MAX_TEXT_LENGTH = 10000;
  private static readonly MAX_NUMBER = 1000000000;

  /**
   * Sanitize string input to prevent XSS and injection attacks
   */
  public static sanitizeString(input: string, maxLength?: number): string {
    if (!input) return '';
    
    const limit = maxLength || this.MAX_STRING_LENGTH;
    
    // Trim and limit length
    let sanitized = String(input).trim().substring(0, limit);
    
    // Remove HTML tags and scripts using DOMPurify
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
    
    // Remove null bytes and control characters except newlines and tabs
    sanitized = sanitized.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Remove any remaining script-like patterns
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    return sanitized;
  }

  /**
   * Sanitize text input (allows newlines)
   */
  public static sanitizeText(input: string, maxLength?: number): string {
    if (!input) return '';
    
    const limit = maxLength || this.MAX_TEXT_LENGTH;
    let sanitized = String(input).trim().substring(0, limit);
    
    // Remove HTML but keep newlines
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
    
    // Remove null bytes and dangerous control characters
    sanitized = sanitized.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return sanitized;
  }

  /**
   * Sanitize numeric input
   */
  public static sanitizeNumber(input: any, options?: { min?: number; max?: number }): number {
    const num = parseFloat(input);
    
    if (isNaN(num) || !isFinite(num)) {
      throw new Error('Invalid number format');
    }
    
    const min = options?.min ?? -this.MAX_NUMBER;
    const max = options?.max ?? this.MAX_NUMBER;
    
    if (num < min) {
      throw new Error(`Number must be at least ${min}`);
    }
    
    if (num > max) {
      throw new Error(`Number must not exceed ${max}`);
    }
    
    return num;
  }

  /**
   * Sanitize and validate positive number
   */
  public static sanitizePositiveNumber(input: any, max?: number): number {
    return this.sanitizeNumber(input, { min: 0.01, max: max || this.MAX_NUMBER });
  }

  /**
   * Sanitize integer
   */
  public static sanitizeInteger(input: any, options?: { min?: number; max?: number }): number {
    const num = parseInt(String(input), 10);
    
    if (isNaN(num) || !isFinite(num)) {
      throw new Error('Invalid integer format');
    }
    
    const min = options?.min ?? -this.MAX_NUMBER;
    const max = options?.max ?? this.MAX_NUMBER;
    
    if (num < min || num > max) {
      throw new Error(`Integer must be between ${min} and ${max}`);
    }
    
    return num;
  }

  /**
   * Sanitize export request data
   */
  public static sanitizeExportRequest(data: any): any {
    return {
      exporterName: this.sanitizeString(data.exporterName, 200),
      coffeeType: this.sanitizeString(data.coffeeType, 50),
      quantity: this.sanitizePositiveNumber(data.quantity, 1000000),
      destinationCountry: this.sanitizeString(data.destinationCountry, 100),
      estimatedValue: this.sanitizePositiveNumber(data.estimatedValue, 1000000000),
    };
  }

  /**
   * Sanitize ID format (alphanumeric with hyphens)
   */
  public static sanitizeId(id: string): string {
    const sanitized = this.sanitizeString(id, 100);
    
    if (!/^[A-Z0-9-]+$/i.test(sanitized)) {
      throw new Error('Invalid ID format. Only alphanumeric characters and hyphens allowed');
    }
    
    return sanitized;
  }

  /**
   * Sanitize email
   */
  public static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email, 254).toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }

  /**
   * Sanitize username
   */
  public static sanitizeUsername(username: string): string {
    const sanitized = this.sanitizeString(username, 30);
    
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }
    
    if (sanitized.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    
    return sanitized;
  }

  /**
   * Sanitize date string
   */
  public static sanitizeDate(dateString: string): string {
    const sanitized = this.sanitizeString(dateString, 30);
    const date = new Date(sanitized);
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    
    return date.toISOString();
  }

  /**
   * Sanitize URL
   */
  public static sanitizeUrl(url: string): string {
    const sanitized = this.sanitizeString(url, 2048);
    
    try {
      const urlObj = new URL(sanitized);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol. Only HTTP and HTTPS allowed');
      }
      
      return urlObj.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Sanitize filename
   */
  public static sanitizeFilename(filename: string): string {
    let sanitized = this.sanitizeString(filename, 255);
    
    // Remove path traversal attempts
    sanitized = sanitized.replace(/\.\./g, '');
    sanitized = sanitized.replace(/[\/\\]/g, '');
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, '');
    
    // Ensure filename is not empty after sanitization
    if (!sanitized || sanitized.length === 0) {
      throw new Error('Invalid filename');
    }
    
    return sanitized;
  }

  /**
   * Sanitize object recursively
   */
  public static sanitizeObject(obj: any, maxDepth: number = 5): any {
    if (maxDepth <= 0) {
      throw new Error('Maximum object depth exceeded');
    }

    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        return this.sanitizeString(obj);
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      if (obj.length > 1000) {
        throw new Error('Array too large');
      }
      return obj.map(item => this.sanitizeObject(item, maxDepth - 1));
    }

    const sanitized: any = {};
    const keys = Object.keys(obj);
    
    if (keys.length > 100) {
      throw new Error('Object has too many keys');
    }
    
    for (const key of keys) {
      const sanitizedKey = this.sanitizeString(key, 100);
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = this.sanitizeNumber(value);
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey] = this.sanitizeObject(value, maxDepth - 1);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize SQL-like input (for rich queries)
   */
  public static sanitizeSqlLike(input: string): string {
    let sanitized = this.sanitizeString(input, 500);
    
    // Escape SQL special characters
    sanitized = sanitized.replace(/'/g, "''");
    sanitized = sanitized.replace(/;/g, '');
    sanitized = sanitized.replace(/--/g, '');
    sanitized = sanitized.replace(/\/\*/g, '');
    sanitized = sanitized.replace(/\*\//g, '');
    
    return sanitized;
  }

  /**
   * Validate and sanitize pagination parameters
   */
  public static sanitizePagination(params: any): { page: number; limit: number; offset: number } {
    const page = this.sanitizeInteger(params.page || 1, { min: 1, max: 10000 });
    const limit = this.sanitizeInteger(params.limit || 10, { min: 1, max: 100 });
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  }

  /**
   * Sanitize search query
   */
  public static sanitizeSearchQuery(query: string): string {
    let sanitized = this.sanitizeString(query, 200);
    
    // Remove special regex characters that could cause issues
    sanitized = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    return sanitized;
  }

  /**
   * Sanitize sort parameters
   */
  public static sanitizeSortParams(params: any, allowedFields: string[]): { field: string; order: 'asc' | 'desc' } {
    const field = this.sanitizeString(params.sortBy || allowedFields[0], 50);
    
    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid sort field. Allowed: ${allowedFields.join(', ')}`);
    }
    
    const order = this.sanitizeString(params.order || 'asc', 4).toLowerCase();
    
    if (!['asc', 'desc'].includes(order)) {
      throw new Error('Sort order must be "asc" or "desc"');
    }
    
    return { field, order: order as 'asc' | 'desc' };
  }
}

// Export validator middleware for Express
export const inputValidator = {
  sanitizeBody: (req: any, res: any, next: any) => {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = InputSanitizer.sanitizeObject(req.body);
      }
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  },
};
