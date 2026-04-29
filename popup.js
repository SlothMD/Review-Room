document.addEventListener('DOMContentLoaded', function() {
  const ollamaModel = document.getElementById('ollama-model');
  const reviewerComments = document.getElementById('reviewer-comments');
  const createReviewBtn = document.getElementById('create-review');
  const suggestedStars = document.getElementById('suggested-stars');
  const generatedReview = document.getElementById('generated-review');
  const reviewTitle = document.getElementById('review-title');
  const feedback = document.getElementById('feedback');
  const updateGuidanceBtn = document.getElementById('update-guidance');
  const guidance = document.getElementById('guidance');
  const OLLAMA_BASE_URL = 'http://localhost:11434';
  const defaultGuidance = {
    "Format": "Return separate fields for suggested stars, generated review, and title. The generated review must be plain text only: no greeting, intro, markdown, bullets, headers, rating, summary, or sign-off. Write 2-4 short paragraphs unless the user's notes clearly call for a different shape.",
    "Priority": "The user's reviewer comments are the source of truth. Use the product page only for factual context such as product type, size, materials, features, or names. Do not repeat marketing claims unless the user's notes support them.",
    "Tone": "Smart, direct, conversational, and dry. Warm but not polished into corporate oatmeal. Use subtle humor only when it fits. Prefer plain words, varied sentence length, and a real-person review voice.",
    "Avoid": "No preamble such as 'Okay, here's a review.' No markdown. No bold text. No pros/cons list unless the user specifically asks for it. No sales-copy phrasing, inflated praise, or manufacturer-style feature dumping.",
    "Constraints": "Keep it suitable for Amazon. Do not mention receiving guidance, using AI, the product listing, or the user's notes."
  };

  // Load saved guidance and model from storage
  chrome.storage.sync.get(['guidance', 'ollamaModel'], function(result) {
    if (result.guidance) {
      guidance.value = upgradeGuidance(result.guidance, defaultGuidance);
      if (guidance.value !== result.guidance) {
        chrome.storage.sync.set({ guidance: guidance.value });
      }
    } else {
      guidance.value = JSON.stringify(defaultGuidance, null, 2);
      chrome.storage.sync.set({ guidance: guidance.value });
    }
    if (result.ollamaModel) {
      ollamaModel.value = result.ollamaModel;
    }
  });

  // Fetch and populate Ollama models
  fetch(`${OLLAMA_BASE_URL}/api/tags`)
    .then(response => response.json())
    .then(data => {
      ollamaModel.innerHTML = '';
      data.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = model.name;
        ollamaModel.appendChild(option);
      });
      // Set the saved model after populating the dropdown
      chrome.storage.sync.get(['ollamaModel'], function(result) {
        if (result.ollamaModel) {
          ollamaModel.value = result.ollamaModel;
        }
      });
    })
    .catch(error => {
      console.error('Error fetching Ollama models:', error);
      ollamaModel.innerHTML = '';
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Start Ollama to load models';
      ollamaModel.appendChild(option);
    });

  // Save selected model to storage
  ollamaModel.addEventListener('change', function() {
    chrome.storage.sync.set({ ollamaModel: ollamaModel.value });
  });

  // Save guidance to storage
  guidance.addEventListener('change', function() {
    chrome.storage.sync.set({ guidance: guidance.value });
  });

  createReviewBtn.addEventListener('click', function() {
    if (!ollamaModel.value) {
      setOutputError('Select an Ollama model first. If none appear, make sure Ollama is running.');
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const tab = tabs[0];

      if (!tab || !/^https?:\/\/([^/]+\.)?amazon\.com\//.test(tab.url || '')) {
        setOutputError('Open an Amazon product page before creating a review.');
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeProductInfo
      }, async results => {
        if (chrome.runtime.lastError) {
          setOutputError(`Could not read the page: ${chrome.runtime.lastError.message}`);
          return;
        }

        const productInfo = results?.[0]?.result;
        if (!productInfo?.title) {
          setOutputError('Could not find product details on this page.');
          return;
        }

        suggestedStars.value = '';
        reviewTitle.value = '';
        generatedReview.value = 'Generating review...';

        try {
          const result = await generateReview({
            model: ollamaModel.value,
            comments: reviewerComments.value,
            guidance: guidance.value,
            productInfo,
            onUpdate: text => {
              generatedReview.value = cleanReviewText(text);
            }
          });

          suggestedStars.value = result.suggestedStars;
          generatedReview.value = result.generatedReview;
          reviewTitle.value = result.title;
        } catch (error) {
          console.error('Error generating review:', error);
          setOutputError(`Error generating review: ${formatGenerationError(error)}`);
        }
      });
    });
  });

  updateGuidanceBtn.addEventListener('click', function() {
    let currentGuidance;

    try {
      currentGuidance = JSON.parse(guidance.value);
    } catch (error) {
      setOutputError('Guidance must be valid JSON before feedback can be applied.');
      return;
    }

    currentGuidance.Feedback = feedback.value;
    guidance.value = JSON.stringify(currentGuidance, null, 2);
    chrome.storage.sync.set({ guidance: guidance.value });

    createReviewBtn.click();
  });

  function setOutputError(message) {
    suggestedStars.value = '';
    reviewTitle.value = '';
    generatedReview.value = message;
  }
});

function upgradeGuidance(savedGuidance, defaultGuidance) {
  try {
    const parsed = JSON.parse(savedGuidance);

    if (parsed.Priority && parsed.Avoid) {
      return savedGuidance;
    }

    return JSON.stringify({
      ...defaultGuidance,
      Feedback: parsed.Feedback
    }, null, 2);
  } catch (error) {
    return savedGuidance;
  }
}

function scrapeProductInfo() {
  const textOf = selector => document.querySelector(selector)?.innerText?.trim() || '';
  const title = textOf('#productTitle') || document.title.replace(/: Amazon\..*$/, '').trim();
  const description = textOf('#feature-bullets') || textOf('#productDescription') || textOf('#bookDescription_feature_div');

  return { title, description };
}

function buildPrompt({ comments, guidance, productInfo }) {
  const reviewerComments = comments?.trim() || '(No user notes were provided. In this case, write cautiously and avoid inventing personal experience.)';

  return `
Return only valid JSON with this exact shape:
{
  "suggestedStars": "1-5",
  "generatedReview": "plain text review body",
  "title": "plain text review title"
}

Do not include an introduction, explanation, markdown code fence, bullets, headers, or sign-off outside the JSON.

Voice and formatting guidance:
${guidance}

Reviewer notes. Treat these as the main source of truth and give them more weight than the product page:
${reviewerComments}

Product page context. Use this only to avoid factual mistakes; do not let it turn the review into marketing copy:
Title: ${productInfo.title}
Description: ${productInfo.description || '(none found)'}

If the reviewer notes conflict with the product page, follow the reviewer notes. If the page has details not mentioned in the notes, include them only when they support the review naturally.
For suggestedStars, infer the rating from the reviewer notes. Use a whole number from 1 to 5 as a string. If the notes are mixed, choose the honest middle value instead of defaulting high.
For generatedReview, write only the review body.
For title, write a short Amazon review title that sounds like a real customer, not an ad.
  `.trim();
}

async function generateReview({ model, comments, guidance, productInfo, onUpdate }) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt: buildPrompt({ comments, guidance, productInfo })
    })
  });

  if (!response.ok) {
    const error = new Error(`Ollama returned HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let rawResponse = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      const parsed = JSON.parse(line);
      rawResponse += parsed.response || '';
      onUpdate(extractReviewPreview(rawResponse));
    }
  }

  if (pending.trim()) {
    const parsed = JSON.parse(pending);
    rawResponse += parsed.response || '';
  }

  return parseGeneratedResult(rawResponse);
}

function parseGeneratedResult(rawResponse) {
  const parsed = JSON.parse(extractJsonObject(rawResponse));

  return {
    suggestedStars: cleanStars(parsed.suggestedStars),
    generatedReview: cleanReviewText(parsed.generatedReview || ''),
    title: cleanSingleLineText(parsed.title || '')
  };
}

function extractJsonObject(text) {
  const trimmed = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return valid JSON.');
  }

  return trimmed.slice(start, end + 1);
}

function extractReviewPreview(rawResponse) {
  try {
    const parsed = JSON.parse(extractJsonObject(rawResponse));
    return cleanReviewText(parsed.generatedReview || '');
  } catch (error) {
    return cleanReviewText(rawResponse);
  }
}

function cleanStars(value) {
  const match = String(value || '').match(/[1-5]/);
  return match ? match[0] : '';
}

function cleanSingleLineText(text) {
  return cleanReviewText(text).replace(/\s+/g, ' ').trim();
}

function cleanReviewText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/^\s*(okay|sure|certainly|absolutely)[,.! ]+\s*(here('|’)s|here is)\s+[^:\n]*:\s*/i, '')
    .replace(/^\s*here('|’)s\s+[^:\n]*:\s*/i, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatGenerationError(error) {
  if (error.status === 403) {
    return 'Ollama rejected the request origin. Reload the extension in chrome://extensions so the localhost Origin rewrite rule is active, then try again.';
  }

  return error.message;
}
