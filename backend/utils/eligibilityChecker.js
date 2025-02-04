// Create a new file for eligibility checking logic
const checkEligibility = (claimData) => {
  try {
    console.log("Starting eligibility check for claim:", claimData);

    // Convert all cost values to numbers upfront
    const costs = {
      treatmentCost: Number(claimData.treatmentCost),
      roomCharges: Number(claimData.roomCharges),
      medicationCharges: Number(claimData.medicationCharges),
      consultationFees: Number(claimData.consultationFees),
      labTestCharges: Number(claimData.labTestCharges),
      totalCost: Number(claimData.totalCost),
    };

    // Verify the total cost matches the sum of individual costs
    const calculatedTotal =
      costs.treatmentCost +
      costs.roomCharges +
      costs.medicationCharges +
      costs.consultationFees +
      costs.labTestCharges;

    console.log("Cost verification:", {
      providedTotal: costs.totalCost,
      calculatedTotal,
      costsMatch: Math.abs(costs.totalCost - calculatedTotal) < 0.01,
    });

    const admissionDate = new Date(claimData.admissionDate);
    const dischargeDate = new Date(claimData.dischargeDate);
    const stayDuration =
      (dischargeDate - admissionDate) / (1000 * 60 * 60 * 24);

    console.log("Stay duration:", {
      admission: admissionDate,
      discharge: dischargeDate,
      days: stayDuration,
    });

    // Perform all eligibility checks
    const checks = {
      validClaimType:
        claimData.claimType === "inpatient" ||
        claimData.claimType === "outpatient" ||
        claimData.claimType === "daycare",

      // Split cost checks for better error reporting
      totalCostLimit: costs.totalCost <= 50000,
      roomChargesLimit: costs.roomCharges <= 5000 * Math.ceil(stayDuration),
      consultationFeesLimit: costs.consultationFees <= 2000,
      labTestChargesLimit: costs.labTestCharges <= 3000,
      medicationChargesLimit: costs.medicationCharges <= 10000,

      validDuration:
        claimData.claimType !== "inpatient" ||
        (stayDuration >= 1 && stayDuration <= 30),

      validDates: admissionDate <= dischargeDate && !isNaN(stayDuration),

      hasRequiredFields: Boolean(
        claimData.policyNumber &&
          claimData.insuranceProvider &&
          claimData.diagnosis &&
          claimData.treatmentCost
      ),
    };

    console.log("Check results:", checks);

    // Determine eligibility
    const isEligible = Object.values(checks).every((check) => check);
    let reason = "";

    if (isEligible) {
      reason = `Eligible for claim

Criteria Met:
✅ Valid claim type: ${claimData.claimType}
✅ Total cost within limit: $${costs.totalCost} (Max: $50,000)
✅ Room charges within limit: $${costs.roomCharges}/day (Max: $5,000/day)
✅ Consultation fees within limit: $${costs.consultationFees} (Max: $2,000)
✅ Lab test charges within limit: $${costs.labTestCharges} (Max: $3,000)
✅ Medication charges within limit: $${costs.medicationCharges} (Max: $10,000)
✅ Stay duration valid: ${Math.ceil(stayDuration)} days (Range: 1-30 days)`;
    } else {
      reason = "Not eligible:\n\n";
      if (!checks.validClaimType) {
        reason += "❌ Invalid claim type\n";
      }
      if (!checks.totalCostLimit) {
        reason += `❌ Total cost ($${costs.totalCost}) exceeds maximum limit ($50,000)\n`;
      }
      if (!checks.roomChargesLimit) {
        reason += `❌ Room charges ($${costs.roomCharges}) exceed daily limit ($5,000)\n`;
      }
      if (!checks.consultationFeesLimit) {
        reason += `❌ Consultation fees ($${costs.consultationFees}) exceed limit ($2,000)\n`;
      }
      if (!checks.labTestChargesLimit) {
        reason += `❌ Lab test charges ($${costs.labTestCharges}) exceed limit ($3,000)\n`;
      }
      if (!checks.medicationChargesLimit) {
        reason += `❌ Medication charges ($${costs.medicationCharges}) exceed limit ($10,000)\n`;
      }
      if (!checks.validDuration) {
        reason += `❌ Stay duration (${Math.ceil(
          stayDuration
        )} days) outside allowed range (1-30 days)\n`;
      }
      if (!checks.validDates) {
        reason += "❌ Invalid admission or discharge dates\n";
      }
      if (!checks.hasRequiredFields) {
        reason += "❌ Missing required information\n";
      }
    }

    console.log("Final eligibility result:", { isEligible, reason });

    console.log("Generated eligibility reason:", reason);

    return {
      isEligible,
      reason,
      details: {
        costs,
        stayDuration: Math.ceil(stayDuration),
        checks,
      },
    };
  } catch (error) {
    console.error("Eligibility check error:", error);
    return {
      isEligible: false,
      reason: "Error during eligibility check: " + error.message,
    };
  }
};

module.exports = { checkEligibility };
