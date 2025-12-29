// Side panel logic
console.log("--- sidepanel.js LOADED ---");

let currentUserResume = "";
let currentConfig = {};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  console.log("--- DOMContentLoaded Fired ---");
  // Check settings
  const data = await chrome.storage.local.get([
    "apiKey",
    "userResume",
    "provider",
    "lmstudioModel",
    "lmstudioUrl",
  ]);

  // Basic validation: need resume. API key needed only if not using LM Studio.
  if (!data.userResume) {
    document.getElementById("setupWarning").classList.remove("hidden");
    document.getElementById("generateBtn").disabled = true;
  } else {
    currentUserResume = data.userResume;
    currentConfig = {
      apiKey: data.apiKey,
      provider: data.provider || "openai",
      lmstudioModel: data.lmstudioModel || "gemma3:1b",
      lmstudioUrl: data.lmstudioUrl || "http://localhost:1234",
    };
  }

  // Event Listeners
  document.getElementById("openOptions").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  const settingsBtn = document.getElementById("settingsBtn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () =>
      chrome.runtime.openOptionsPage()
    );
  }

  const genBtn = document.getElementById("generateBtn");
  if (genBtn) {
    console.log("Attaching click listener to generateBtn");
    genBtn.addEventListener("click", handleGenerate);
  } else {
    console.error("CRITICAL: generateBtn not found in DOM");
  }

  document.getElementById("copyBtn").addEventListener("click", copyContent);
  document.getElementById("pdfBtn").addEventListener("click", exportToPDF);
  document.getElementById("docxBtn").addEventListener("click", exportToDOCX);
});

async function handleGenerate() {
  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.textContent = "Extracting...";

  try {
    // 1. Get Job Description
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      console.error("No active tab found.");
      throw new Error("No active tab");
    }

    let jobDescription = "";

    try {
      // Attempt to send message
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "getJobDescription",
      });
      if (!response) throw new Error("Empty response from content script");
      jobDescription = response.text;
    } catch (e) {
      console.warn("Primary connection failed. Reason:", e.message);

      // If content script is not ready, try to inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });

        // Give it a brief moment to initialize
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Retry
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "getJobDescription",
        });
        jobDescription = response.text;
      } catch (retryError) {
        console.error("Critical Failure during retry:", retryError);
        throw new Error(
          "Could not connect to the page. Please refresh the page and try again."
        );
      }
    }

    if (!jobDescription || jobDescription.length < 50) {
      console.error(
        "Job description too short or empty:",
        jobDescription?.length
      );
      throw new Error(
        "Could not extract job description. Please make sure you are on a job page or Refresh the page."
      );
    }

    btn.textContent = "Generating...";

    // 2. Determine what to generate
    const genResume = document.getElementById("genResume").checked;
    const genCoverLetter = document.getElementById("genCoverLetter").checked;
    const genEmail = document.getElementById("genEmail").checked;

    // Prepare Results Area
    const resultsDiv = document.getElementById("results");
    const tabsContainer = document.getElementById("tabs");
    const contentArea = document.getElementById("contentArea");
    resultsDiv.classList.remove("hidden");
    tabsContainer.innerHTML = "";
    contentArea.textContent = "Generating first document...";

    // Helper to add tabs incrementally
    const addResultTab = (key, content, isActive = false) => {
      const tab = document.createElement("div");
      tab.className = `tab ${isActive ? "active" : ""}`;
      tab.textContent = key;
      tab.onclick = () => {
        document
          .querySelectorAll(".tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        contentArea.textContent = content;
        // Store content in a data attribute or global object if needed for export
        // but since we only have one active view, we can rely on contentArea for now
        // or better, update the global results object if we want to support switching back efficiently
        // For simplicity, let's keep it simple.
      };
      tabsContainer.appendChild(tab);

      if (isActive) {
        contentArea.textContent = content;
      }
    };

    const results = {}; // Keep for export consistency if needed later

    // 3. Call AI for each selected item
    if (genResume) {
      btn.textContent = "Generating Resume... (this may take time)";
      const resumeContent = await generateWithAI(
        "resume",
        jobDescription,
        currentUserResume,
        currentConfig.provider,
        currentConfig
      );
      results["Resume"] = resumeContent;
      addResultTab("Resume", resumeContent, true); // First one is active
    }

    if (genCoverLetter) {
      btn.textContent = "Drafting Cover Letter...";
      const clContent = await generateWithAI(
        "cover-letter",
        jobDescription,
        currentUserResume,
        currentConfig.provider,
        currentConfig
      );
      results["Cover Letter"] = clContent;
      // distinct from first check, if resume wasn't generated, this might be first
      const isFirst = !genResume;
      addResultTab("Cover Letter", clContent, isFirst);
    }

    if (genEmail) {
      btn.textContent = "Writing Email...";
      const emailContent = await generateWithAI(
        "email",
        jobDescription,
        currentUserResume,
        currentConfig.provider,
        currentConfig
      );
      results["Email"] = emailContent;
      const isFirst = !genResume && !genCoverLetter;
      addResultTab("Email", emailContent, isFirst);
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate Documents";
  }
}

// Deprecated or simplified display function (kept if referenced elsewhere but logic moved up)
function displayResults(results) {
  // Legacy support if needed, but we do it incrementally now.
}

function copyContent() {
  const content = document.getElementById("contentArea").textContent;
  navigator.clipboard.writeText(content);
  const btn = document.getElementById("copyBtn");
  const originalText = btn.textContent;
  btn.textContent = "Copied!";
  setTimeout(() => (btn.textContent = originalText), 1500);
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const content = document.getElementById("contentArea").textContent;
  const activeTab = document.querySelector(".tab.active").textContent;

  // Split text to fit page
  const splitText = doc.splitTextToSize(content, 180);

  doc.setFontSize(16);
  doc.text(activeTab, 10, 10);

  doc.setFontSize(12);
  doc.text(splitText, 10, 20);

  doc.save(`${activeTab.replace(/\s+/g, "_")}_ResumeEntropy.pdf`);
}

function exportToDOCX() {
  const content = document.getElementById("contentArea").textContent;
  const activeTab = document.querySelector(".tab.active").textContent;

  // Simple HTML to DOCX (MIME type hack)
  const preHtml =
    "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
  const postHtml = "</body></html>";

  // Convert newlines to <br> for HTML
  const htmlContent = content.replace(/\n/g, "<br>");

  const html = preHtml + htmlContent + postHtml;

  const blob = new Blob(["\ufeff", html], {
    type: "application/msword",
  });

  const url =
    "data:application/vnd.ms-word;charset=utf-8," + encodeURIComponent(html);

  const downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);

  if (navigator.msSaveOrOpenBlob) {
    navigator.msSaveOrOpenBlob(blob, `${activeTab}.doc`);
  } else {
    downloadLink.href = url;
    downloadLink.download = `${activeTab.replace(
      /\s+/g,
      "_"
    )}_ResumeEntropy.doc`;
    downloadLink.click();
  }

  document.body.removeChild(downloadLink);
}
