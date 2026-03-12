const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const postgresService = require('../services/postgres');

// ==================== Legal Frameworks ====================

/**
 * List legal frameworks
 * GET /api/legal/frameworks
 */
router.get('/frameworks', authenticateToken, async (req, res) => {
  try {
    const { type, jurisdiction } = req.query;

    let query = 'SELECT * FROM legal_frameworks WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND framework_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (jurisdiction) {
      query += ` AND jurisdiction = $${paramCount}`;
      params.push(jurisdiction);
      paramCount++;
    }

    query += ' ORDER BY framework_name';

    const result = await postgresService.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      frameworks: result.rows
    });
  } catch (error) {
    console.error('Frameworks fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get framework details
 * GET /api/legal/frameworks/:frameworkId
 */
router.get('/frameworks/:frameworkId', authenticateToken, async (req, res) => {
  try {
    const { frameworkId } = req.params;

    const query = 'SELECT * FROM legal_frameworks WHERE framework_id = $1';
    const result = await postgresService.query(query, [frameworkId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Framework not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Framework fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Contract Clauses ====================

/**
 * List contract clauses
 * GET /api/legal/clauses
 */
router.get('/clauses', authenticateToken, async (req, res) => {
  try {
    const { type, frameworkId } = req.query;

    let query = 'SELECT * FROM contract_clauses WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND clause_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (frameworkId) {
      query += ` AND legal_framework_id = $${paramCount}`;
      params.push(frameworkId);
      paramCount++;
    }

    query += ' ORDER BY clause_type, clause_name';

    const result = await postgresService.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      clauses: result.rows
    });
  } catch (error) {
    console.error('Clauses fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get clauses by type
 * GET /api/legal/clauses/type/:clauseType
 */
router.get('/clauses/type/:clauseType', authenticateToken, async (req, res) => {
  try {
    const { clauseType } = req.params;

    const query = `
      SELECT c.*, f.framework_name
      FROM contract_clauses c
      LEFT JOIN legal_frameworks f ON c.legal_framework_id = f.framework_id
      WHERE c.clause_type = $1 AND c.is_active = true
      ORDER BY c.clause_name
    `;

    const result = await postgresService.query(query, [clauseType]);

    res.json({
      success: true,
      clauseType,
      clauses: result.rows
    });
  } catch (error) {
    console.error('Clauses fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get clause details
 * GET /api/legal/clauses/:clauseId
 */
router.get('/clauses/:clauseId', authenticateToken, async (req, res) => {
  try {
    const { clauseId } = req.params;

    const query = `
      SELECT c.*, f.framework_name, f.description as framework_description
      FROM contract_clauses c
      LEFT JOIN legal_frameworks f ON c.legal_framework_id = f.framework_id
      WHERE c.clause_id = $1
    `;

    const result = await postgresService.query(query, [clauseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clause not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Clause fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Render clause with variables
 * POST /api/legal/clauses/:clauseId/render
 */
router.post('/clauses/:clauseId/render', authenticateToken, async (req, res) => {
  try {
    const { clauseId } = req.params;
    const { variables } = req.body;

    // Get clause
    const clauseQuery = await postgresService.query(
      'SELECT * FROM contract_clauses WHERE clause_id = $1',
      [clauseId]
    );

    if (clauseQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Clause not found' });
    }

    const clause = clauseQuery.rows[0];
    let renderedText = clause.template_text;

    // Replace variables
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        renderedText = renderedText.replace(new RegExp(placeholder, 'g'), value);
      }
    }

    res.json({
      success: true,
      clauseId,
      clauseName: clause.clause_name,
      originalTemplate: clause.template_text,
      renderedText,
      variables: clause.variables
    });
  } catch (error) {
    console.error('Clause render error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Contract Templates ====================

/**
 * List contract templates
 * GET /api/legal/templates
 */
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;

    let query = 'SELECT * FROM contract_templates WHERE is_active = true';
    const params = [];

    if (type) {
      query += ' AND template_type = $1';
      params.push(type);
    }

    query += ' ORDER BY template_name';

    const result = await postgresService.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      templates: result.rows
    });
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get template details with clauses
 * GET /api/legal/templates/:templateId
 */
router.get('/templates/:templateId', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;

    // Get template
    const templateQuery = await postgresService.query(
      'SELECT * FROM contract_templates WHERE template_id = $1',
      [templateId]
    );

    if (templateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templateQuery.rows[0];

    // Get associated clauses
    let clauses = [];
    if (template.clause_ids && template.clause_ids.length > 0) {
      const clausesQuery = await postgresService.query(
        'SELECT * FROM contract_clauses WHERE clause_id = ANY($1)',
        [template.clause_ids]
      );
      clauses = clausesQuery.rows;
    }

    res.json({
      ...template,
      clauses
    });
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate contract from template
 * POST /api/legal/templates/:templateId/generate
 */
router.post('/templates/:templateId/generate', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { contractData, clauseVariables } = req.body;

    // Get template with clauses
    const templateQuery = await postgresService.query(
      'SELECT * FROM contract_templates WHERE template_id = $1',
      [templateId]
    );

    if (templateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templateQuery.rows[0];

    // Get clauses
    let clauses = [];
    if (template.clause_ids && template.clause_ids.length > 0) {
      const clausesQuery = await postgresService.query(
        `SELECT * FROM contract_clauses 
         WHERE clause_id = ANY($1)
         ORDER BY clause_type`,
        [template.clause_ids]
      );
      clauses = clausesQuery.rows;
    }

    // Render each clause
    const renderedClauses = clauses.map(clause => {
      let text = clause.template_text;
      
      // Replace variables if provided
      if (clauseVariables && clauseVariables[clause.clause_id]) {
        for (const [key, value] of Object.entries(clauseVariables[clause.clause_id])) {
          const placeholder = `{{${key}}}`;
          text = text.replace(new RegExp(placeholder, 'g'), value);
        }
      }

      return {
        clauseType: clause.clause_type,
        clauseName: clause.clause_name,
        text
      };
    });

    // Build contract structure
    const generatedContract = {
      templateName: template.template_name,
      templateType: template.template_type,
      governingLaw: template.default_governing_law,
      arbitrationLocation: template.default_arbitration_location,
      arbitrationRules: template.default_arbitration_rules,
      language: template.default_language,
      contractData,
      clauses: renderedClauses,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Contract generated from template',
      contract: generatedContract
    });
  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Clause Types Reference ====================

/**
 * Get available clause types
 * GET /api/legal/clause-types
 */
router.get('/clause-types', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT clause_type, COUNT(*) as count
      FROM contract_clauses
      WHERE is_active = true
      GROUP BY clause_type
      ORDER BY clause_type
    `;

    const result = await postgresService.query(query);

    const clauseTypes = {
      FORCE_MAJEURE: 'Force Majeure - Unexpected events',
      ARBITRATION: 'Arbitration - Dispute resolution',
      WARRANTY: 'Warranty - Quality guarantees',
      INSPECTION: 'Inspection - Quality inspection rights',
      PAYMENT: 'Payment - Payment terms and conditions',
      DELIVERY: 'Delivery - Delivery obligations',
      QUALITY: 'Quality - Quality standards',
      DISPUTE_RESOLUTION: 'Dispute Resolution - Conflict handling',
      CONFIDENTIALITY: 'Confidentiality - Information protection',
      TERMINATION: 'Termination - Contract termination',
      LIABILITY: 'Liability - Liability limitations',
      INSURANCE: 'Insurance - Insurance requirements'
    };

    res.json({
      success: true,
      clauseTypes: result.rows.map(row => ({
        type: row.clause_type,
        description: clauseTypes[row.clause_type] || row.clause_type,
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    console.error('Clause types fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
