// Password Validation Utility
// Health Center Appointment & Medication Reminder System

/**
 * Validate password complexity
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (optional but recommended)
 */
function validatePassword(password) {
    const errors = [];

    // Check minimum length
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Check for special character (recommended)
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password should contain at least one special character for better security');
    }

    return {
        isValid: errors.length === 0 || (errors.length === 1 && errors[0].includes('special character')),
        errors: errors,
        strength: calculatePasswordStrength(password)
    };
}

/**
 * Calculate password strength
 * Returns: weak, medium, strong
 */
function calculatePasswordStrength(password) {
    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;

    // Character variety
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

    if (strength <= 3) return 'weak';
    if (strength <= 5) return 'medium';
    return 'strong';
}

/**
 * Generate password requirements message
 */
function getPasswordRequirements() {
    return {
        en: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers',
        rw: 'Ijambo ry\'ibanga rigomba kuba ry\'inyuguti 8 nibura kandi rikaba rifite inyuguti nkuru, ntoya, n\'imibare'
    };
}

module.exports = {
    validatePassword,
    calculatePasswordStrength,
    getPasswordRequirements
};
