// Content script to extract job description
console.log('Resume Entropy: Content script loaded');

function extractPageText() {
    // Simple extraction for now - just body text
    // We can improve this later with specific selectors for LinkedIn/Indeed
    return document.body.innerText;
}

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getJobDescription') {
        try {
            const text = extractPageText();
            sendResponse({ text: text });
        } catch (e) {
            console.error('Content Script extraction error:', e);
            sendResponse({ error: e.message });
        }
    }
    return true; // Keep channel open for async response if needed
});
