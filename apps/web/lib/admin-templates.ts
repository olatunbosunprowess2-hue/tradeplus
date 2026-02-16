export interface AdminTemplate {
    id: string;
    label: string;
    message: string;
    type: 'report_resolve' | 'report_delete' | 'verification_reject' | 'verification_approve' | 'listing_action';
}

export const ADMIN_TEMPLATES: AdminTemplate[] = [
    // Report Resolution (General)
    {
        id: 'report_resolved_generic',
        label: 'Generic Resolution',
        type: 'report_resolve',
        message: 'Your report has been reviewed and resolved by our team. Thank you for helping us maintain a safe community.',
    },
    {
        id: 'report_resolved_no_violation',
        label: 'No Violation Found',
        type: 'report_resolve',
        message: 'We have reviewed your report and found no clear violation of our community guidelines at this time. We will continue to monitor the situation.',
    },
    {
        id: 'report_resolved_insufficient_evidence',
        label: 'Insufficient Evidence',
        type: 'report_resolve',
        message: 'Thank you for your report. We were unable to take action due to insufficient evidence. If you have more information, please submit a new report.',
    },

    // Report Deletion (Listing/Post)
    {
        id: 'report_delete_listing_generic',
        label: 'Listing Deleted (Reporter)',
        type: 'report_delete',
        message: 'Thank you for your report. After reviewing the evidence, we have removed the reported listing. We appreciate your help in keeping our community safe.',
    },
    {
        id: 'report_delete_listing_owner_prohibited',
        label: 'Prohibited Item (Owner)',
        type: 'listing_action',
        message: 'Your listing has been removed because it contains items or services that are prohibited on BarterWave. Please review our prohibited items list before posting again.',
    },
    {
        id: 'report_delete_listing_owner_misleading',
        label: 'Misleading Info (Owner)',
        type: 'listing_action',
        message: 'Your listing has been removed due to misleading information or inaccurate descriptions. Please ensure all details are correct when reposting.',
    },
    {
        id: 'report_delete_listing_owner_scam',
        label: 'Potential Scam (Owner)',
        type: 'listing_action',
        message: 'Your listing has been removed following multiple reports of suspicious activity. Your account is now under review.',
    },

    // Verification Rejection
    {
        id: 'verify_reject_blurry',
        label: 'Blurry Documents',
        type: 'verification_reject',
        message: 'Your identity verification was rejected because the images provided were too blurry or unreadable. Please re-upload clear, high-resolution photos of your ID.',
    },
    {
        id: 'verify_reject_expired',
        label: 'Expired ID',
        type: 'verification_reject',
        message: 'Your identity verification was rejected because the identification document provided has expired. Please provide a valid, current ID.',
    },
    {
        id: 'verify_reject_mismatch',
        label: 'Name Mismatch',
        type: 'verification_reject',
        message: 'Your identity verification was rejected because the name on your ID does not match the name on your BarterWave profile. Please ensure your profile details match your official documents.',
    },
    {
        id: 'verify_reject_face',
        label: 'Face/ID Mismatch',
        type: 'verification_reject',
        message: 'Your identity verification was rejected because the selfie provided does not match the photo on the ID card. Please ensure you provide a clear selfie that matches your identification.',
    },

    // Verification Approval
    {
        id: 'verify_approve_generic',
        label: 'Verification Approved',
        type: 'verification_approve',
        message: 'Your identity verification has been approved! You can now list items and trade with full access to BarterWave features.',
    }
];

export const getTemplatesByType = (type: AdminTemplate['type'][] | AdminTemplate['type']) => {
    const types = Array.isArray(type) ? type : [type];
    return ADMIN_TEMPLATES.filter(t => types.includes(t.type));
};
