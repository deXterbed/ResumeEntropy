// Save options to chrome.storage
const saveOptions = () => {
    const provider = document.getElementById('provider').value;
    const apiKey = document.getElementById('apiKey').value;
    const ollamaModel = document.getElementById('ollamaModel').value;
    const ollamaUrl = document.getElementById('ollamaUrl').value;
    const userResume = document.getElementById('userResume').value;

    chrome.storage.local.set(
        {
            provider,
            apiKey,
            ollamaModel,
            ollamaUrl,
            userResume
        },
        () => {
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(() => status.textContent = '', 2000);
        }
    );
};

// Restore options
const restoreOptions = () => {
    chrome.storage.local.get(
        {
            provider: 'openai',
            apiKey: '',
            ollamaModel: 'gemma3:27b',
            ollamaUrl: 'http://localhost:11434',
            userResume: ''
        },
        (items) => {
            document.getElementById('provider').value = items.provider;
            document.getElementById('apiKey').value = items.apiKey;
            document.getElementById('ollamaModel').value = items.ollamaModel;
            document.getElementById('ollamaUrl').value = items.ollamaUrl;
            document.getElementById('userResume').value = items.userResume;

            toggleSections(items.provider);
        }
    );
};

const toggleSections = (provider) => {
    const apiKeySection = document.getElementById('apiKeySection');
    const ollamaSection = document.getElementById('ollamaSection');

    if (provider === 'ollama') {
        apiKeySection.classList.add('hidden');
        ollamaSection.classList.remove('hidden');
    } else {
        apiKeySection.classList.remove('hidden');
        ollamaSection.classList.add('hidden');
    }
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);
document.getElementById('provider').addEventListener('change', (e) => toggleSections(e.target.value));
