const Patient = require('../models/Patient');

const generatePatientId = async () => {
    try {
        const lastPatient = await Patient.findOne({}, { patientId: 1 })
            .sort({ patientId: -1 });

        // Default first ID
        if (!lastPatient || !lastPatient.patientId) {
            return 'DM-00001';
        }

        // Stricter regex pattern
        const matches = lastPatient.patientId.match(/^DM-(\d{5})$/);
        if (!matches || !matches[1]) {
            console.error('Invalid patient ID format:', lastPatient.patientId);
            return 'DM-00001';
        }

        const lastNumber = parseInt(matches[1], 10);
        // Additional validation to ensure we have a valid number
        if (isNaN(lastNumber) || lastNumber < 0) {
            console.error('Invalid number in patient ID:', lastNumber);
            return 'DM-00001';
        }

        const newNumber = (lastNumber + 1).toString().padStart(5, '0');
        // Final validation before returning
        if (newNumber.length !== 5 || isNaN(parseInt(newNumber, 10))) {
            console.error('Generated invalid number:', newNumber);
            return 'DM-00001';
        }

        return `DM-${newNumber}`;
    } catch (error) {
        console.error('Error generating patient ID:', error);
        throw error;
    }
};

module.exports = generatePatientId;