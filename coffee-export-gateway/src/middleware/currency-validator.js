/**
 * Currency Validation Middleware
 * Validates currency fields in shipment and payment requests
 */

const VALID_CURRENCIES = ['USD', 'EUR', 'ETB'];

/**
 * Validate currency in request body
 * @param {string} fieldName - Name of the currency field to validate (default: 'currency')
 */
function validateCurrency(fieldName = 'currency') {
  return (req, res, next) => {
    const currency = req.body[fieldName];
    
    // If currency is not provided, use default USD
    if (!currency) {
      req.body[fieldName] = 'USD';
      return next();
    }
    
    // Validate currency
    if (!VALID_CURRENCIES.includes(currency.toUpperCase())) {
      return res.status(400).json({
        error: `Invalid currency. Accepted currencies: ${VALID_CURRENCIES.join(', ')}`
      });
    }
    
    // Normalize to uppercase
    req.body[fieldName] = currency.toUpperCase();
    next();
  };
}

/**
 * Validate multiple currency fields in request body
 * @param {string[]} fieldNames - Array of currency field names to validate
 */
function validateMultipleCurrencies(fieldNames) {
  return (req, res, next) => {
    for (const fieldName of fieldNames) {
      const currency = req.body[fieldName];
      
      if (currency && !VALID_CURRENCIES.includes(currency.toUpperCase())) {
        return res.status(400).json({
          error: `Invalid ${fieldName}. Accepted currencies: ${VALID_CURRENCIES.join(', ')}`
        });
      }
      
      // Normalize to uppercase if present
      if (currency) {
        req.body[fieldName] = currency.toUpperCase();
      }
    }
    
    next();
  };
}

module.exports = {
  validateCurrency,
  validateMultipleCurrencies,
  VALID_CURRENCIES
};
