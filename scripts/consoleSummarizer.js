/**
 * Usage:
 * 1. Open any webpage
 * 2. Open browser console (F12)
 * 3. Paste this entire script
 * 4. Press Enter
 * 5. The summary will be logged to console
 */

(async () => {
  /**
   * @typedef {Object} ActivityWebsiteVisited
   * @property {string} id
   * @property {number} timestamp
   * @property {string} url
   * @property {string} title
   * @property {Record<string, string>} metadata - meta name="" value=""
   * @property {string} summary
   * @property {number} opened_time
   * @property {number} closed_time
   * @property {number} active_time
   */

  /**
   * Extract metadata from the current page
   * @returns {Record<string, string>}
   */
  function getPageMetadata() {
    const metadata = {};
    const metaTags = document.querySelectorAll('meta[name], meta[property]');
    metaTags.forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');
      if (name && content) {
        metadata[name] = content;
      }
    });
    return metadata;
  }

  /**
   * Extract text content from HTML
   * @param {string} html - Raw HTML content
   * @returns {string} Extracted text
   */
  function extractTextFromHTML(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Remove non-content elements
      const elementsToRemove = doc.querySelectorAll('script, style, noscript, iframe, nav, footer, aside');
      elementsToRemove.forEach(el => el.remove());
      
      const article = doc.querySelector('article');
      const main = doc.querySelector('main');
      const contentArea = article || main || doc.body;
      
      const text = contentArea ? contentArea.innerText : doc.body.innerText;
      return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('Error extracting text:', error);
      return '';
    }
  }

  /**
   * Generates a summary from webpage HTML content
   * @param {ActivityWebsiteVisited} website - The website activity object
   * @param {string} html - Raw HTML content of the webpage
   * @returns {Promise<string>} Generated summary
   */
  const generateSummaryFromWebpage = async (website, html) => {
    
    try {
      const text = extractTextFromHTML(html);
      
      if (!text || text.length < 10) {
        throw new Error('Insufficient text content extracted from HTML');
      }
      
      // console.log(`📝 Extracted ${text.length} characters of text`);
      
      // Gemini Nano has a context window limit (~4000-8000 tokens, roughly 16000-32000 chars)
      // We're using a conservative limit and intelligently truncate
      const MAX_CHARS = 10000;
      
      let truncatedText = text;
      
      if (text.length > MAX_CHARS) {
        // console.log(`⚠️  Text too long (${text.length} chars). Truncating to ${MAX_CHARS} chars...`);
        
        const roughCut = text.slice(0, MAX_CHARS);
        
        // Find the last sentence ending (., !, ?) within the limit
        const lastSentenceEnd = Math.max(
          roughCut.lastIndexOf('. '),
          roughCut.lastIndexOf('! '),
          roughCut.lastIndexOf('? ')
        );
        
        if (lastSentenceEnd > MAX_CHARS * 0.8) {
          // If we found a sentence ending in the last 20%, use it
          truncatedText = roughCut.slice(0, lastSentenceEnd + 1);
        } else {
          // Otherwise, just use the rough cut
          truncatedText = roughCut;
        }
        
        // console.log(`✂️  Truncated to ${truncatedText.length} characters`);
      }
      
      const session = await LanguageModel.create({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }]
      });
      
      const schema = {
        type: 'object',
        properties: { summary: { type: 'string' } },
        required: ['summary'],
        additionalProperties: false
      };
      
      let contextInfo = '';
      if (website.title) {
        contextInfo += `Title: ${website.title}\n`;
      }
      if (website.metadata?.description) {
        contextInfo += `Description: ${website.metadata.description}\n`;
      }
      
      const prompt = `
        ${contextInfo ? contextInfo + '\n' : ''}Simplify the following text for a general audience at ~10th grade reading level.
        Use sentences, avoid jargon, and preserve key facts and context.
        Return only JSON: { "summary": "<concise simplified summary>" }.

        Text:
        ${truncatedText}
        `.trim();
      
      const raw = await session.prompt(prompt, { 
        responseConstraint: schema, 
        omitResponseConstraintInput: true 
      });
      
      const result = JSON.parse(raw);
      // console.log('✅ Summary generated successfully!');
      return result.summary;
    } catch (error) {
      console.error('❌ Error generating summary:', error);
      throw error;
    }
  };

  try {
    // Check if LanguageModel API is available
    if (typeof LanguageModel === 'undefined') {
      throw new Error('LanguageModel API not available. Make sure you are using Chrome with AI features enabled.');
    }

    const now = Date.now();
    
    /** @type {ActivityWebsiteVisited} */
    const website = {
      id: `activity_${now}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      url: window.location.href,
      title: document.title,
      metadata: getPageMetadata(),
      summary: '',
      opened_time: now,
      closed_time: 0,
      active_time: 0
    };

    // console.log('📋 Website Activity Object:', website);

    const html = document.documentElement.outerHTML;

    const summary = await generateSummaryFromWebpage(website, html);
    website.summary = summary;

    // NOTE: We're not using temperature parameter to control creativity
    // CC: Sandipan  //  For more, check this: https://github.com/papayaah/chatnano/blob/main/src/components/AISettings.tsx#L70C9-L70C28

    // console.log('\n📌 Page:', website.title);
    // console.log('🔗 URL:', website.url);
    console.log(JSON.stringify({ summary }, null, 2));

  } catch (error) {
    console.error('\n❌ Failed to generate summary:', error.message);
    console.error('Full error:', error);
    
    if (error.message.includes('LanguageModel')) {
      console.log('\n💡 Tip: Enable Chrome AI features at chrome://flags/#optimization-guide-on-device-model');
    }
  }
})();
