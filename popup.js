document.addEventListener('DOMContentLoaded', function() {
  const ollamaModel = document.getElementById('ollama-model');
  const reviewerComments = document.getElementById('reviewer-comments');
  const createReviewBtn = document.getElementById('create-review');
  const generationStatus = document.getElementById('generation-status');
  const guidance = document.getElementById('guidance');
  const defaultGuidance = {
    "Format": "Return separate fields for suggested stars, generated review, and title. The generated review must be plain text only: no greeting, intro, markdown, bullets, headers, rating, summary, or sign-off. Write 2-3 natural paragraphs. Paragraph 1 should describe the actual experience or first impression based on the reviewer notes. Paragraph 2 should explain the most important practical details, tradeoffs, or use-case fit. Paragraph 3 is optional and should only be used if there is a clear final judgment.",
    "Priority": "The user's reviewer comments are the source of truth. Use the product page only for factual context such as product type, size, materials, features, or names. Do not repeat marketing claims unless the user's notes support them.",
    "ReviewerVoice": "When the reviewer notes include a narrative aside, dry joke, sarcastic observation, wry phrasing, or specific angle, preserve that idea and work it into the generated review naturally. Treat those comments as intentional voice cues, not disposable notes.",
    "Depth": "Be more narrative than terse. Expand on implications of the reviewer notes, but do not invent facts, usage details, defects, ownership duration, or personal experience. If notes are sparse, use careful phrasing such as 'seems,' 'looks,' or 'for this use case' instead of making claims.",
    "Tone": "Smart, direct, conversational, and dry. Warm but not polished into corporate oatmeal. Use subtle humor only when it fits. Prefer plain words, varied sentence length, and a real-person review voice.",
    "Avoid": "No preamble such as 'Okay, here's a review.' No markdown. No bold text. No pros/cons list unless the user specifically asks for it. No sales-copy phrasing, inflated praise, or manufacturer-style feature dumping.",
    "Constraints": "Keep it suitable for Amazon. Do not mention receiving guidance, using AI, the product listing, or the user's notes."
  };

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

  fetch(`${REVIEW_AUTHOR_OLLAMA_BASE_URL}/api/tags`)
    .then(response => response.json())
    .then(data => {
      ollamaModel.innerHTML = '';
      data.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = model.name;
        ollamaModel.appendChild(option);
      });
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

  ollamaModel.addEventListener('change', function() {
    chrome.storage.sync.set({ ollamaModel: ollamaModel.value });
  });

  guidance.addEventListener('change', function() {
    chrome.storage.sync.set({ guidance: guidance.value });
  });

  createReviewBtn.addEventListener('click', function() {
    if (!ollamaModel.value) {
      setStatus('Select an Ollama model first. If none appear, make sure Ollama is running.');
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const tab = tabs[0];

      if (!tab || !/^https?:\/\/([^/]+\.)?amazon\.com\//.test(tab.url || '')) {
        setStatus('Open an Amazon product page before creating a review.');
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeProductInfo
      }, async results => {
        if (chrome.runtime.lastError) {
          setStatus(`Could not read the page: ${chrome.runtime.lastError.message}`);
          return;
        }

        const productInfo = results?.[0]?.result;
        if (!productInfo?.title) {
          setStatus('Could not find product details on this page.');
          return;
        }

        createReviewBtn.disabled = true;
        setStatus('Opening review workspace...');

        try {
          const session = await saveReviewSession({
            model: ollamaModel.value,
            comments: reviewerComments.value,
            guidance: guidance.value,
            productInfo,
            sourceTab: {
              id: tab.id,
              url: tab.url,
              title: tab.title
            }
          });

          setStatus('Review workspace opened.');
          await chrome.tabs.create({
            url: chrome.runtime.getURL(`review.html?sessionId=${encodeURIComponent(session.id)}`)
          });
        } catch (error) {
          console.error('Error generating review:', error);
          setStatus(`Error generating review: ${formatGenerationError(error)}`);
        } finally {
          createReviewBtn.disabled = false;
        }
      });
    });
  });

  function setStatus(message) {
    generationStatus.value = message;
  }
});

function upgradeGuidance(savedGuidance, defaultGuidance) {
  try {
    const parsed = JSON.parse(savedGuidance);

    if (parsed.Priority && parsed.Avoid && parsed.Depth && parsed.ReviewerVoice) {
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

async function saveReviewSession({ model, comments, guidance, productInfo, sourceTab }) {
  const id = `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const session = {
    id,
    createdAt: now,
    updatedAt: now,
    model,
    comments,
    guidance,
    productInfo,
    sourceTab,
    result: null,
    status: 'pending',
    iterations: [],
    workspace: {
      feedback: '',
      missingTopics: '',
      followUpAnswers: '',
      followUpQuestions: []
    }
  };

  await chrome.storage.local.set({ [id]: session, latestReviewSessionId: id });
  return session;
}
