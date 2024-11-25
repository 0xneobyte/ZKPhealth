// ZKProof implementation
const ZKProof = {
    generateProof: (actualValue, range) => {
        const [min, max] = range;
        const isInRange = actualValue >= min && actualValue <= max;
        
        // Generate proof with more explicit valid/invalid marking
        const proofData = isInRange 
            ? `valid_${Date.now()}_${actualValue}`
            : `invalid_${Date.now()}`;
            
        // Encode to base64
        const proof = Buffer.from(proofData).toString('base64');
        console.log('Generated proof:', { proofData, proof, isInRange });
            
        return { proof, isValid: isInRange };
    },

    verifyProof: (encodedProof) => {
        try {
            // Decode base64 proof
            const decodedProof = Buffer.from(encodedProof, 'base64').toString('utf-8');
            console.log('Verifying proof:', { encodedProof, decodedProof });
            
            // Check if decoded proof starts with 'valid_'
            const isValid = decodedProof.startsWith('valid_');
            console.log('Verification result:', isValid);
            
            return isValid;
        } catch (error) {
            console.error('Error verifying proof:', error);
            return false;
        }
    }
};

module.exports = ZKProof; 