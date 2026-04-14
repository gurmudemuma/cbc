// Fixed submissions endpoint
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    const { status, exportId } = req.query;
    
    let query = `
      SELECT 
        ns.*,
        e.exporter_name,
        e.coffee_type,
        e.quantity,
        e.total_value,
        (
          SELECT COUNT(*) 
          FROM network_member_approvals nma 
          WHERE nma.submission_id = ns.submission_id 
          AND nma.approval_status = 'APPROVED'
        ) as approved_agencies_count
      FROM network_submissions ns
      LEFT JOIN exports e ON ns.export_id = e.export_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND ns.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (exportId) {
      query += ` AND ns.export_id = $${paramCount}`;
      params.push(exportId);
      paramCount++;
    }
    
    query += ' ORDER BY ns.submitted_at DESC';
    
    const result = await pool.query(query, params);
    
    // Format the data for frontend
    const formattedData = result.rows.map(row => ({
      submissionId: row.submission_id,
      exportId: row.export_id,
      networkReferenceNumber: row.network_reference_number,
      status: row.status,
      submittedAt: row.submitted_at,
      approvedAt: row.approved_at,
      rejectedAt: row.rejected_at,
      exporterName: row.exporter_name,
      coffeeType: row.coffee_type,
      quantity: row.quantity,
      totalValue: row.total_value,
      approvedAgencies: Array(parseInt(row.approved_agencies_count || 0)).fill(null)
    }));
    
    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
