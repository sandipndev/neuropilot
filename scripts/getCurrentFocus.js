(async () => {
  /**
   * @typedef {Object} ActivityWebsiteVisited
   * @property {string} id
   * @property {number} timestamp
   * @property {string} url
   * @property {string} title
   * @property {Record<string, string>} metadata
   * @property {string} summary
   * @property {number} opened_time
   * @property {number} closed_time
   * @property {number} active_time
   */

  /**
   * @typedef {Object} ActivityUserAttention
   * @property {string} id
   * @property {ActivityWebsiteVisited} website
   * @property {number} timestamp
   * @property {string} text_content
   * @property {number} attention_time
   */


  const MOCK_WEBSITES = [
    {
      id: 'web_001',
      timestamp: Date.now() - 3600000,
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array',
      title: 'Array - JavaScript | MDN',
      metadata: {
        'description': 'The Array object enables storing a collection of multiple items under a single variable name',
        'keywords': 'javascript, array, methods, programming',
        'og:type': 'article'
      },
      summary: 'Documentation about JavaScript Array methods including map, filter, reduce, and other array manipulation techniques.',
      opened_time: Date.now() - 3600000,
      closed_time: Date.now() - 3000000,
      active_time: 600000
    },
    {
      id: 'web_002',
      timestamp: Date.now() - 2400000,
      url: 'https://react.dev/learn/state-management',
      title: 'State Management – React',
      metadata: {
        'description': 'Learn how to manage state in React applications',
        'keywords': 'react, state, hooks, useState, useReducer',
        'og:type': 'documentation'
      },
      summary: 'Guide to managing state in React applications using hooks like useState and useReducer, including best practices for state organization.',
      opened_time: Date.now() - 2400000,
      closed_time: Date.now() - 1800000,
      active_time: 600000
    },
    {
      id: 'web_003',
      timestamp: Date.now() - 1200000,
      url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html',
      title: 'TypeScript: Documentation - Generics',
      metadata: {
        'description': 'Learn about generics in TypeScript',
        'keywords': 'typescript, generics, types, programming',
        'og:type': 'documentation'
      },
      summary: 'Comprehensive guide to using generics in TypeScript for creating reusable and type-safe components and functions.',
      opened_time: Date.now() - 1200000,
      closed_time: Date.now() - 600000,
      active_time: 600000
    },
    {
      id: 'web_004',
      timestamp: Date.now() - 300000,
      url: 'https://github.com/microsoft/TypeScript/issues/50715',
      title: 'Type inference issue with generic constraints · Issue #50715',
      metadata: {
        'description': 'Discussion about TypeScript type inference with generic constraints',
        'keywords': 'typescript, generics, type inference, issue',
        'og:type': 'issue'
      },
      summary: 'GitHub issue discussing problems with type inference when using generic constraints in TypeScript, with community solutions and workarounds.',
      opened_time: Date.now() - 300000,
      closed_time: 0,
      active_time: 300000
    }
  ];

  const MOCK_ATTENTIONS = [
    {
      id: 'att_001',
      website: MOCK_WEBSITES[0],
      timestamp: Date.now() - 3500000,
      text_content: 'Array.prototype.map() creates a new array populated with the results of calling a provided function on every element',
      attention_time: 45000
    },
    {
      id: 'att_002',
      website: MOCK_WEBSITES[0],
      timestamp: Date.now() - 3300000,
      text_content: 'Array.prototype.filter() creates a shallow copy of a portion of a given array',
      attention_time: 60000
    },
    {
      id: 'att_003',
      website: MOCK_WEBSITES[1],
      timestamp: Date.now() - 2200000,
      text_content: 'useState is a Hook that lets you add state to function components',
      attention_time: 90000
    },
    {
      id: 'att_004',
      website: MOCK_WEBSITES[1],
      timestamp: Date.now() - 2000000,
      text_content: 'useReducer is usually preferable to useState when you have complex state logic',
      attention_time: 120000
    },
    {
      id: 'att_005',
      website: MOCK_WEBSITES[2],
      timestamp: Date.now() - 1100000,
      text_content: 'Generics provide a way to make components work with any data type',
      attention_time: 180000
    },
    {
      id: 'att_006',
      website: MOCK_WEBSITES[2],
      timestamp: Date.now() - 900000,
      text_content: 'Generic constraints allow you to describe the capabilities a type must have',
      attention_time: 240000
    },
    {
      id: 'att_007',
      website: MOCK_WEBSITES[3],
      timestamp: Date.now() - 250000,
      text_content: 'When using extends with generics, TypeScript should infer the narrowed type',
      attention_time: 150000
    },
    {
      id: 'att_008',
      website: MOCK_WEBSITES[3],
      timestamp: Date.now() - 100000,
      text_content: 'Workaround: explicitly specify the type parameter or use type assertions',
      attention_time: 200000
    }
  ];

  let aiSession = null;
  let aiAvailable = false;

  async function initializeAI() {
    try {
      if (typeof LanguageModel === 'undefined') {
        return false;
      }

      const availability = await LanguageModel.availability({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }]
      });

      if (availability !== 'available') {
        return false;
      }

      aiSession = await LanguageModel.create({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [{
          role: 'system',
          content: `You are an expert at analyzing web browsing patterns and learning behavior. Your task is to provide concise, insightful analysis of what the user is learning or working on. Be specific about the technical concepts and provide actionable insights. Keep responses under 100 words.`
        }]
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async function getAIInsights(focusData) {
    if (!aiSession) return null;

    // TODO: Needs some auditing , cc: @sandipndev 
    try {
      const prompt = `Analyze this browsing activity:

Title: ${focusData.primary_focus}
Focus Area: ${focusData.focus_area}
Time: ${focusData.attention_metrics.total_time_seconds}s
Interactions: ${focusData.attention_metrics.interaction_count}

Key Content:
${focusData.textContents.slice(0, 3).join('\n')}

Related Topics: ${focusData.related_topics.map(t => t.title).join(', ')}

Provide a brief analysis (2-3 sentences):
1. What is the user trying to learn or accomplish?
2. What stage of learning are they at (exploring, debugging, mastering)?
3. What might they need to focus on next?`;

      const response = await aiSession.prompt(prompt);
      return response;
    } catch (error) {
      return null;
    }
  }

  const getCurrentFocus = (attentions, websites) => {
    if (!attentions || attentions.length === 0) {
      return JSON.stringify({ error: 'No attention data available' });
    }

    if (!websites || websites.length === 0) {
      return JSON.stringify({ error: 'No website data available' });
    }

    const sortedAttentions = [...attentions].sort((a, b) => b.timestamp - a.timestamp);
    const RECENCY_WINDOW = 30 * 60 * 1000;
    const now = Date.now();
    const recentAttentions = sortedAttentions.filter(
      att => now - att.timestamp < RECENCY_WINDOW
    );

    if (recentAttentions.length === 0) {
      return JSON.stringify({ message: 'No recent activity in the last 30 minutes' });
    }

    const attentionByWebsite = new Map();
    
    recentAttentions.forEach(att => {
      const websiteId = att.website.id;
      if (!attentionByWebsite.has(websiteId)) {
        attentionByWebsite.set(websiteId, {
          website: att.website,
          totalAttentionTime: 0,
          attentionCount: 0,
          lastTimestamp: att.timestamp,
          textContents: []
        });
      }
      
      const data = attentionByWebsite.get(websiteId);
      data.totalAttentionTime += att.attention_time;
      data.attentionCount += 1;
      data.lastTimestamp = Math.max(data.lastTimestamp, att.timestamp);
      data.textContents.push(att.text_content);
    });

    const focusScores = Array.from(attentionByWebsite.entries()).map(([websiteId, data]) => {
      const recencyScore = 1 - (now - data.lastTimestamp) / RECENCY_WINDOW;
      const maxDuration = Math.max(...Array.from(attentionByWebsite.values()).map(d => d.totalAttentionTime));
      const durationScore = data.totalAttentionTime / maxDuration;
      const maxFrequency = Math.max(...Array.from(attentionByWebsite.values()).map(d => d.attentionCount));
      const frequencyScore = data.attentionCount / maxFrequency;
      const compositeScore = (recencyScore * 0.5) + (durationScore * 0.3) + (frequencyScore * 0.2);
      
      return {
        websiteId,
        website: data.website,
        compositeScore,
        recencyScore,
        durationScore,
        frequencyScore,
        totalAttentionTime: data.totalAttentionTime,
        attentionCount: data.attentionCount,
        textContents: data.textContents
      };
    });

    focusScores.sort((a, b) => b.compositeScore - a.compositeScore);
    const topFocus = focusScores[0];
    const allText = topFocus.textContents.join(' ').toLowerCase();
    const keywords = extractKeywords(allText);
    
    const focusDescription = {
      primary_focus: topFocus.website.title,
      url: topFocus.website.url,
      focus_area: extractFocusArea(topFocus.website.title, topFocus.website.url, keywords),
      key_topics: keywords.slice(0, 5),
      attention_metrics: {
        total_time_seconds: Math.round(topFocus.totalAttentionTime / 1000),
        interaction_count: topFocus.attentionCount,
        recency_score: Math.round(topFocus.recencyScore * 100) / 100,
        focus_intensity: Math.round(topFocus.compositeScore * 100) / 100
      },
      summary: generateFocusSummary(topFocus, keywords),
      related_topics: focusScores.slice(1, 3).map(f => ({
        title: f.website.title,
        relevance: Math.round(f.compositeScore * 100) / 100
      })),
      textContents: topFocus.textContents
    };

    return JSON.stringify(focusDescription, null, 2);
  };

  const getCurrentFocusWithAI = async (attentions, websites) => {
    const basicAnalysis = getCurrentFocus(attentions, websites);
    const focusData = JSON.parse(basicAnalysis);

    if (aiAvailable && aiSession) {
      const aiInsights = await getAIInsights(focusData);
      focusData.ai_insights = aiInsights || 'AI analysis not available';
      focusData.ai_powered = true;
    } else {
      focusData.ai_insights = 'Gemini Nano not available - using rule-based analysis';
      focusData.ai_powered = false;
    }

    delete focusData.textContents;
    return JSON.stringify(focusData, null, 2);
  };

  function extractKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'can', 'could', 'may', 'might', 'must', 'that', 'this', 'these', 'those'
    ]);

    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }

  function extractFocusArea(title, url, keywords) {
    const titleLower = title.toLowerCase();
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('github.com') && urlLower.includes('issues')) {
      return 'Problem Solving / Debugging';
    }
    if (titleLower.includes('documentation') || titleLower.includes('docs')) {
      return 'Learning / Documentation';
    }
    if (titleLower.includes('tutorial') || titleLower.includes('guide')) {
      return 'Learning / Tutorial';
    }
    if (urlLower.includes('stackoverflow.com')) {
      return 'Problem Solving / Q&A';
    }
    if (keywords.some(k => ['error', 'issue', 'problem', 'fix'].includes(k))) {
      return 'Troubleshooting';
    }
    if (keywords.some(k => ['learn', 'tutorial', 'guide', 'introduction'].includes(k))) {
      return 'Learning';
    }

    return 'Research / Exploration';
  }

  function generateFocusSummary(topFocus, keywords) {
    const timeInMinutes = Math.round(topFocus.totalAttentionTime / 60000);
    const focusArea = extractFocusArea(
      topFocus.website.title,
      topFocus.website.url,
      keywords
    );

    return `Currently focused on "${topFocus.website.title}". ` +
           `Spent ${timeInMinutes} minutes with ${topFocus.attentionCount} interactions. ` +
           `Primary activity: ${focusArea}. ` +
           `Key topics: ${keywords.slice(0, 3).join(', ')}.`;
  }

  try {
    aiAvailable = await initializeAI();
    const result = await getCurrentFocusWithAI(MOCK_ATTENTIONS, MOCK_WEBSITES);
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
})();