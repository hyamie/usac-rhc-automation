// ============================================================================
// n8n Code Node: Calculate Funding Threshold & Merge Data
// ============================================================================
// Location: Replace "Calculate Priority & Merge Data" node
// Purpose: Merge historical funding + calculate threshold + priority score
// ============================================================================

// Merge historical funding data with filing
const filing = $input.first().json;
const historicalData = $input.all().slice(1);

// Extract up to 3 years of funding
if (historicalData.length > 0) {
  historicalData.forEach((record, index) => {
    const data = record.json;
    if (index < 3) {
      filing[`funding_year_${index + 1}`] = parseInt(data.funding_year) || null;
      filing[`funding_amount_${index + 1}`] = parseFloat(data.total_approved_one_time_cost) || 0;
    }
  });

  // ========================================
  // Calculate total 3-year funding
  // ========================================
  const totalFunding = (filing.funding_amount_1 || 0) +
                       (filing.funding_amount_2 || 0) +
                       (filing.funding_amount_3 || 0);

  filing.total_3yr_funding = totalFunding;

  // ========================================
  // NEW: Assign Funding Threshold
  // ========================================
  let fundingThreshold = 'unknown';
  if (totalFunding > 100000) {
    fundingThreshold = 'high';
  } else if (totalFunding >= 25000) {
    fundingThreshold = 'medium';
  } else if (totalFunding > 0) {
    fundingThreshold = 'low';
  }

  filing.funding_threshold = fundingThreshold;

  // ========================================
  // Calculate priority score (UPDATED)
  // ========================================
  let priorityScore = 0;

  // Funding amount (40 points max) - adjusted thresholds
  if (totalFunding > 100000) priorityScore += 40;
  else if (totalFunding > 50000) priorityScore += 30;
  else if (totalFunding > 25000) priorityScore += 20;
  else if (totalFunding > 0) priorityScore += 10;

  // Consistency (30 points) - participated multiple years
  const yearsWithFunding = [filing.funding_amount_1, filing.funding_amount_2, filing.funding_amount_3]
    .filter(amt => amt > 0).length;
  priorityScore += yearsWithFunding * 10;

  // Service category factor (15 points) - premium services get boost
  if (filing.requested_service_category === 'voice' ||
      filing.requested_service_category === 'both_telecom_internet') {
    priorityScore += 15;
  } else if (filing.requested_service_category === 'data') {
    priorityScore += 10;
  } else if (filing.requested_service_category === 'telecommunications_only') {
    priorityScore += 5;
  }

  // Consultant factor (15 points) - consultants often mean larger projects
  if (filing.is_consultant) {
    priorityScore += 15;
  } else {
    priorityScore += 10; // Direct contacts still valuable
  }

  filing.priority_score = Math.min(priorityScore, 100);

  // Assign priority label
  if (filing.priority_score >= 70) filing.priority_label = 'High';
  else if (filing.priority_score >= 40) filing.priority_label = 'Medium';
  else filing.priority_label = 'Low';

  filing.total_funding_3y = totalFunding; // Legacy field name for compatibility
} else {
  // No historical data - assign defaults
  filing.priority_score = 25;
  filing.priority_label = 'Low';
  filing.total_funding_3y = 0;
  filing.total_3yr_funding = 0;
  filing.funding_threshold = 'unknown';
}

return { json: filing };
