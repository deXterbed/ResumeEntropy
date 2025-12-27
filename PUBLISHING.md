# How to Publish "Resume Entropy" to the Chrome Web Store

## 1. Prepare the Extension
1.  **Test thoroughly**: Ensure everything works as expected.
2.  **Create a Zip file**:
    *   Go to the extension folder: `C:\Users\dell\.gemini\antigravity\scratch\job-application-extension`
    *   Select all files inside (manifest.json, icons, html, js, etc.).
    *   Right-click -> Send to -> Compressed (zipped) folder.
    *   Name it `resume-entropy.zip`.

## 2. Create a Developer Account
1.  Visit the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2.  Sign in with your Google Account.
3.  Pay the **$5 one-time registration fee** (if you haven't already).

## 3. Upload to Dashboard
1.  Click **"New Item"** in the dashboard.
2.  Upload your `resume-entropy.zip` file.

## 4. Store Listing
You will need to fill out the following:
*   **Description**: A detailed description of what the extension does.
*   **Category**: e.g., "Productivity" or "Search Tools".
*   **Language**: English.
*   **Screenshots**: You need at least one screenshot (1280x800 or 640x400).
*   **Promo Tiles**: Optional but recommended (440x280).

## 5. Privacy Practices
*   Go to the **Privacy** tab.
*   **Single Purpose**: Explain that the extension helps users generate job application documents.
*   **Permission Justification**:
    *   `activeTab`: To read the job description from the current page.
    *   `storage`: To save the user's resume and API key locally.
    *   `sidePanel`: To show the UI.
*   **Data Usage**: Check "No" for "Do you collect any user data?" (since everything is local or sent to OpenAI directly by the user).

## 6. Submit for Review
1.  Click **"Submit for Review"**.
2.  The review process usually takes 24-48 hours, but can take longer.

## Note on API Keys
Since this extension requires the user to bring their own API Key, make sure to mention this clearly in the **Store Description** so users aren't confused why it doesn't work immediately.
