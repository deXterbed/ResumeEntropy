// Save options to chrome.storage
const saveOptions = () => {
  const provider = document.getElementById("provider").value;
  const apiKey = document.getElementById("apiKey").value;
  const lmstudioModel = document.getElementById("lmstudioModel").value;
  const lmstudioUrl = document.getElementById("lmstudioUrl").value;
  const userResume = document.getElementById("userResume").value;

  chrome.storage.local.set(
    {
      provider,
      apiKey,
      lmstudioModel,
      lmstudioUrl,
      userResume,
    },
    () => {
      const status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(() => (status.textContent = ""), 2000);
    }
  );
};

// Restore options
const restoreOptions = () => {
  chrome.storage.local.get(
    {
      provider: "openai",
      apiKey: "",
      lmstudioModel: "gemma3:1b",
      lmstudioUrl: "http://localhost:1234",
      userResume: "",
    },
    (items) => {
      document.getElementById("provider").value = items.provider;
      document.getElementById("apiKey").value = items.apiKey;
      document.getElementById("lmstudioModel").value = items.lmstudioModel;
      document.getElementById("lmstudioUrl").value = items.lmstudioUrl;
      document.getElementById("userResume").value = items.userResume;

      toggleSections(items.provider);
    }
  );
};

const toggleSections = (provider) => {
  const apiKeySection = document.getElementById("apiKeySection");
  const lmstudioSection = document.getElementById("lmstudioSection");

  if (provider === "lmstudio") {
    apiKeySection.classList.add("hidden");
    lmstudioSection.classList.remove("hidden");
  } else {
    apiKeySection.classList.remove("hidden");
    lmstudioSection.classList.add("hidden");
  }
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("saveBtn").addEventListener("click", saveOptions);
document
  .getElementById("provider")
  .addEventListener("change", (e) => toggleSections(e.target.value));
