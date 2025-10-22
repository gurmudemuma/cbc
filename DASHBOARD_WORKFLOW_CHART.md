# Dashboard Blockchain Workflow Visualization

## Overview
Added a comprehensive line/area chart to the dashboard that tracks and visualizes export requests through all blockchain stages in real-time.

## Chart Features

### Visual Representation
- **Area Chart**: Shows the number of exports at each workflow stage
- **Line Chart Overlay**: Shows completion percentage at each stage
- **Gradient Fill**: Beautiful gradient visualization of the funnel effect
- **Interactive Tooltips**: Hover to see exact numbers, percentages, AND who took action
- **Actor Tracking**: Shows which users approved each stage (blockchain accountability)
- **Recent Activity**: Displays approver names for each transaction
- **Responsive Design**: Adapts to all screen sizes

### Workflow Stages Tracked

The chart displays 7 key blockchain stages:

1. **Created** (`FX_PENDING`)
   - Initial export request creation by portal
   - Submitted through National Bank

2. **FX Approved** (`FX_APPROVED`)
   - National Bank validates export license & FX compliance
   - First consortium approval

3. **Banking** (`BANKING_APPROVED`)
   - Exporter Bank validates financial documents
   - Commercial invoice & sales contract review

4. **Quality** (`QUALITY_CERTIFIED`)
   - NCAT certifies coffee quality
   - Issues quality certificates

5. **Customs** (`EXPORT_CUSTOMS_CLEARED`)
   - Customs authorities clear for export
   - Final regulatory compliance

6. **Shipped** (`SHIPPED`)
   - Shipping Line confirms departure
   - In transit to destination

7. **Completed** (`COMPLETED`)
   - Delivered and payment received
   - Export cycle complete

## Data Calculation

### Export Counting Logic
```javascript
// Counts exports that reached each stage or beyond
const statusOrder = {
  'FX_PENDING': 1,
  'FX_APPROVED': 2,
  'BANKING_PENDING': 2,
  'BANKING_APPROVED': 3,
  'QUALITY_PENDING': 3,
  'QUALITY_CERTIFIED': 4,
  'EXPORT_CUSTOMS_PENDING': 4,
  'EXPORT_CUSTOMS_CLEARED': 5,
  'SHIPMENT_SCHEDULED': 5,
  'SHIPPED': 6,
  'ARRIVED': 6,
  'COMPLETED': 7
};
```

### Metrics Displayed
- **Count**: Number of exports that reached this stage
- **Percentage**: Completion rate relative to total exports
- **Organization**: Which consortium member handles this stage
- **Actors**: List of users who approved exports at this stage
- **Actor Count**: Total number of unique approvers
- **Funnel Effect**: Visual drop-off as exports progress through stages

## Actor/Approver Tracking

### Tooltip Information
When you hover over any stage in the chart, the tooltip displays:

```
Stage: FX Approved
━━━━━━━━━━━━━━━━━━━━━
Organization: National Bank
Exports: 25
Completion: 83%
━━━━━━━━━━━━━━━━━━━━━
Approved by (3):
  • John Doe
  • Jane Smith
  • Ahmed Ali
```

### Actor Fields by Stage

| Stage | Organization | Actor Field | Description |
|-------|--------------|-------------|-------------|
| Created | Portal | - | Submitted by exporter |
| FX Approved | National Bank | `fxApprovedBy` | Officer who approved FX |
| Banking | Exporter Bank | `bankingApprovedBy` | Who validated financial docs |
| Quality | NCAT | `qualityCertifiedBy` | Inspector who certified |
| Customs | Customs Authority | `exportCustomsClearedBy` | Officer who cleared |
| Shipped | Shipping Line | `shippingLineId` | Shipping company |
| Completed | System | - | Automatic completion |

### Recent Activity Display

The "Recent Blockchain Activity" section now shows:
- Export ID and current status
- Coffee details and value
- **WHO took action** at each stage:
  - `FX: John Doe`
  - `Quality: Ahmed Hassan`
  - `Customs: Sarah Ahmed`

### Benefits of Actor Tracking

✅ **Accountability** - Know exactly who approved each stage  
✅ **Audit Trail** - Complete history of all actions  
✅ **Performance Metrics** - Track which officers are most active  
✅ **Dispute Resolution** - Identify responsible parties  
✅ **Compliance** - Meet regulatory requirements for traceability  
✅ **Transparency** - All consortium members see who did what  

## Blockchain Best Practices Implemented

### ✅ Real-Time Updates
- Dashboard refreshes every 30 seconds
- Shows live blockchain activity
- Immediate reflection of state changes

### ✅ Immutable Audit Trail
- Each stage represents a blockchain transaction
- All stages visible to all consortium members
- Complete transparency

### ✅ Status Validation
- Sequential workflow enforcement
- Cannot skip stages
- MSP-based access control

### ✅ Funnel Visualization
- Shows drop-off rates at each stage
- Identifies bottlenecks
- Performance metrics for consortium

## Chart Components

### Technologies Used
- **Recharts** - React charting library
- **Material-UI** - Theming and styling
- **Lucide Icons** - GitBranch icon for workflow
- **React Hooks** - State management

### Chart Configuration
```javascript
<AreaChart data={workflowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="stage" angle={-15} textAnchor="end" height={60} />
  <YAxis label={{ value: 'Number of Exports', angle: -90 }} />
  <Tooltip />
  <Legend />
  <Area 
    type="monotone" 
    dataKey="count" 
    stroke={primary} 
    fill="url(#colorCount)" 
    name="Exports"
  />
  <Line 
    type="monotone" 
    dataKey="percentage" 
    stroke={success} 
    name="Completion %"
  />
</AreaChart>
```

## Installation

### 1. Install Dependencies
```bash
cd /home/gu-da/cbc/frontend
npm install
```

This will install the new `recharts` dependency added to package.json.

### 2. Start Frontend
```bash
npm run dev
```

### 3. View Dashboard
Navigate to: `http://localhost:5173/dashboard`

## Visual Example

```
📊 Export Workflow Progress (Blockchain Stages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Exports ▲
         │    ╱╲
     100 │   ╱  ╲___
         │  ╱       ╲___
      50 │ ╱            ╲___
         │╱                  ╲___
       0 └─────────────────────────────→ Stages
          Created  FX  Banking  Quality  Customs  Shipped  Completed
          
          Area = Total exports at stage
          Line = Completion percentage
```

## Benefits for Consortium Members

### For All Organizations
- **Visibility**: See all exports and their current stage
- **Performance**: Identify workflow bottlenecks
- **Trends**: Track completion rates over time
- **Transparency**: Full blockchain audit trail

### For National Bank
- See how many exports require FX approval
- Track approval efficiency

### For Exporter Bank
- Monitor financial validation queue
- Track banking approval rates

### For NCAT
- View quality certification workload
- Monitor certification completion rates

### For Customs
- Track clearance queue
- Monitor processing times

### For Shipping Line
- See upcoming shipments
- Track delivery performance

## Data Refresh Strategy

### Automatic Updates
- Dashboard polls every 30 seconds
- Uses `setInterval` for continuous updates
- No manual refresh needed

### State Management
```javascript
useEffect(() => {
  fetchDashboardData();
  const interval = setInterval(fetchDashboardData, 30000);
  return () => clearInterval(interval);
}, []);
```

## Future Enhancements

### Potential Additions
1. **Time-based Filtering**
   - Last 7 days, 30 days, 90 days
   - Custom date range selection

2. **Organization-specific View**
   - Filter by exporter
   - Filter by destination country

3. **Average Time per Stage**
   - Show typical duration at each stage
   - Identify delays

4. **Export Details on Click**
   - Click chart point to see export list
   - Drill-down functionality

5. **Export to PDF/CSV**
   - Download chart as image
   - Export data for reporting

6. **Real-time WebSocket Updates**
   - Push notifications for status changes
   - Live chart animation

---

## Blockchain Integration

### How It Works
1. Exporter creates request → Portal → National Bank API
2. National Bank submits to blockchain → **ALL nodes receive**
3. Each stage change creates new block → **Chart updates**
4. Dashboard queries blockchain → **Shows current state**
5. Chart visualizes the complete journey

### Data Flow
```
Blockchain Transaction
        ↓
All Consortium Nodes Updated
        ↓
Dashboard API Query
        ↓
React State Update
        ↓
Chart Re-renders with New Data
```

---

**Version:** 1.0  
**Last Updated:** 2025-10-21  
**Dependencies:** recharts@^2.10.3, @mui/material@^5.18.0
