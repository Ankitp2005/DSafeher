const moderationService = {
    /**
     * Moderates a report before it's published to the map.
     */
    moderateReport: async (reportData, userId) => {
        let isFlagged = false;
        let reasons = [];

        // 1. Rate Limiting Check (Simple mock)
        // In production, query the DB for user's reports in last 24h
        if (userId === 'spam_user_id') {
            isFlagged = true;
            reasons.push('User has exceeded report limit (max 5/24h)');
        }

        // 2. Keyword/Spam Detection
        const spamKeywords = ['spam', 'fake', 'test', 'ignore'];
        const description = (reportData.description || '').toLowerCase();

        if (spamKeywords.some(kw => description.includes(kw))) {
            isFlagged = true;
            reasons.push('Potential spam detected in description');
        }

        // 3. Automated Photo Content Check (Stub)
        if (reportData.photo_url) {
            // Mock AI check
            if (description.includes('offensive')) {
                isFlagged = true;
                reasons.push('Automated filter flagged potentially offensive photo content');
            }
        }

        return {
            isValid: !isFlagged,
            requiresAdminReview: isFlagged,
            reasons
        };
    }
};

module.exports = moderationService;
