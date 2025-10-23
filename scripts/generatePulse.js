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

  /**
   * @typedef {Object} Focus
   * @property {string} id
   * @property {string} focus_item
   * @property {Array<{start: number, stop: number}>} time_spent
   */

  const MOCK_WEBSITES = [
    {
      id: 'web_001',
      timestamp: Date.now() - 86400000,
      url: 'https://react.dev/learn/thinking-in-react',
      title: 'Thinking in React – React',
      metadata: {
        'description': 'Learn how to think in React by building a searchable product data table',
        'keywords': 'react, components, state, props',
        'og:type': 'tutorial'
      },
      summary: 'Step-by-step guide to building React applications using component-based thinking and unidirectional data flow.',
      opened_time: Date.now() - 86400000,
      closed_time: Date.now() - 82800000,
      active_time: 3600000
    },
    {
      id: 'web_002',
      timestamp: Date.now() - 82800000,
      url: 'https://react.dev/learn/managing-state',
      title: 'Managing State – React',
      metadata: {
        'description': 'Learn how to structure state well and keep your state update logic maintainable',
        'keywords': 'react, state, useState, useReducer',
        'og:type': 'documentation'
      },
      summary: 'Comprehensive guide to state management in React, covering local state, lifting state up, and state reducers.',
      opened_time: Date.now() - 82800000,
      closed_time: Date.now() - 79200000,
      active_time: 3600000
    },
    {
      id: 'web_003',
      timestamp: Date.now() - 43200000,
      url: 'https://react.dev/learn/you-might-not-need-an-effect',
      title: 'You Might Not Need an Effect – React',
      metadata: {
        'description': 'Learn when you dont need Effects and how to remove unnecessary Effects',
        'keywords': 'react, useEffect, hooks, optimization',
        'og:type': 'guide'
      },
      summary: 'Guide explaining common scenarios where useEffect is unnecessary and how to write more efficient React code.',
      opened_time: Date.now() - 43200000,
      closed_time: Date.now() - 39600000,
      active_time: 3600000
    },
    {
      id: 'web_004',
      timestamp: Date.now() - 21600000,
      url: 'https://react.dev/reference/react/useEffect',
      title: 'useEffect – React',
      metadata: {
        'description': 'useEffect is a React Hook that lets you synchronize a component with an external system',
        'keywords': 'react, useEffect, hooks, side effects',
        'og:type': 'reference'
      },
      summary: 'API reference for useEffect hook, covering dependencies, cleanup functions, and common patterns.',
      opened_time: Date.now() - 21600000,
      closed_time: Date.now() - 18000000,
      active_time: 3600000
    },
    {
      id: 'web_005',
      timestamp: Date.now() - 10800000,
      url: 'https://react.dev/learn/synchronizing-with-effects',
      title: 'Synchronizing with Effects – React',
      metadata: {
        'description': 'Learn how to synchronize components with external systems using Effects',
        'keywords': 'react, effects, synchronization, lifecycle',
        'og:type': 'tutorial'
      },
      summary: 'Tutorial on using Effects to connect React components to external systems and manage side effects properly.',
      opened_time: Date.now() - 10800000,
      closed_time: Date.now() - 7200000,
      active_time: 3600000
    },
    {
      id: 'web_006',
      timestamp: Date.now() - 3600000,
      url: 'https://react.dev/learn/lifecycle-of-reactive-effects',
      title: 'Lifecycle of Reactive Effects – React',
      metadata: {
        'description': 'Learn how Effects have a different lifecycle from components',
        'keywords': 'react, effects, lifecycle, dependencies',
        'og:type': 'guide'
      },
      summary: 'Deep dive into Effect lifecycle, explaining how Effects start, stop, and synchronize with component renders.',
      opened_time: Date.now() - 3600000,
      closed_time: Date.now() - 1800000,
      active_time: 1800000
    }
  ];

  const MOCK_ATTENTIONS = [
    {
      id: 'att_001',
      website: MOCK_WEBSITES[0],
      timestamp: Date.now() - 85000000,
      text_content: 'Break the UI into a component hierarchy based on single responsibility principle',
      attention_time: 180000
    },
    {
      id: 'att_002',
      website: MOCK_WEBSITES[0],
      timestamp: Date.now() - 84500000,
      text_content: 'Identify the minimal but complete representation of UI state',
      attention_time: 240000
    },
    {
      id: 'att_003',
      website: MOCK_WEBSITES[1],
      timestamp: Date.now() - 82000000,
      text_content: 'State should live in the common parent component when multiple components need it',
      attention_time: 200000
    },
    {
      id: 'att_004',
      website: MOCK_WEBSITES[1],
      timestamp: Date.now() - 81500000,
      text_content: 'Use reducer when state updates involve complex logic or multiple sub-values',
      attention_time: 220000
    },
    {
      id: 'att_005',
      website: MOCK_WEBSITES[2],
      timestamp: Date.now() - 42000000,
      text_content: 'You dont need Effects for transforming data for rendering',
      attention_time: 300000
    },
    {
      id: 'att_006',
      website: MOCK_WEBSITES[2],
      timestamp: Date.now() - 41000000,
      text_content: 'Avoid Effects for handling user events - use event handlers instead',
      attention_time: 280000
    },
    {
      id: 'att_007',
      website: MOCK_WEBSITES[3],
      timestamp: Date.now() - 20000000,
      text_content: 'Effects run after every render by default, specify dependencies to control when they run',
      attention_time: 250000
    },
    {
      id: 'att_008',
      website: MOCK_WEBSITES[3],
      timestamp: Date.now() - 19500000,
      text_content: 'Return a cleanup function from useEffect to prevent memory leaks',
      attention_time: 270000
    },
    {
      id: 'att_009',
      website: MOCK_WEBSITES[4],
      timestamp: Date.now() - 10000000,
      text_content: 'Effects let you specify side effects caused by rendering, not by a particular event',
      attention_time: 200000
    },
    {
      id: 'att_010',
      website: MOCK_WEBSITES[4],
      timestamp: Date.now() - 9500000,
      text_content: 'Each Effect should represent an independent synchronization process',
      attention_time: 230000
    },
    {
      id: 'att_011',
      website: MOCK_WEBSITES[5],
      timestamp: Date.now() - 3000000,
      text_content: 'Effects have a lifecycle separate from components - they start and stop synchronizing',
      attention_time: 260000
    },
    {
      id: 'att_012',
      website: MOCK_WEBSITES[5],
      timestamp: Date.now() - 2500000,
      text_content: 'Think from the Effects perspective: how to start and stop synchronization',
      attention_time: 240000
    }
  ];

  const MOCK_FOCUS = [
    {
      id: 'focus_001',
      focus_item: 'React Component Architecture',
      time_spent: [
        { start: Date.now() - 86400000, stop: Date.now() - 82800000 }
      ]
    },
    {
      id: 'focus_002',
      focus_item: 'React State Management',
      time_spent: [
        { start: Date.now() - 82800000, stop: Date.now() - 79200000 },
        { start: Date.now() - 43200000, stop: Date.now() - 39600000 }
      ]
    },
    {
      id: 'focus_003',
      focus_item: 'React useEffect Hook',
      time_spent: [
        { start: Date.now() - 21600000, stop: Date.now() - 18000000 },
        { start: Date.now() - 10800000, stop: Date.now() - 7200000 },
        { start: Date.now() - 3600000, stop: Date.now() - 1800000 }
      ]
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
          content: `You generate personalized learning progress updates. Reference actual data (hours spent, specific topics, resource counts, exact quotes). Use casual, encouraging tone. Be specific about what the user studied, not generic advice. Under 15 words per item.`
        }]
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async function generatePulseWithAI(attentions, websites, focus) {
    if (!aiSession) return null;

    try {
      const recentAttentions = attentions.slice(0, 6);
      const focusTopics = focus.map(f => f.focus_item).join(', ');
      const keyLearnings = recentAttentions.map(att => att.text_content).slice(0, 5).join('\n');
      
      const totalFocusTime = focus.reduce((total, f) => {
        return total + f.time_spent.reduce((sum, ts) => sum + (ts.stop - ts.start), 0);
      }, 0);
      const hoursSpent = Math.round(totalFocusTime / 3600000);

      // TODO: Needs some auditing , cc: @sandipndev 
      const recentWebsiteTitles = recentAttentions.map(att => att.website.title).slice(0, 3);
      const websiteCount = new Set(attentions.map(att => att.website.id)).size;

      const prompt = `Generate 5 personalized learning progress updates using this data:

      Focus Topics: ${focusTopics}
      Total Hours: ${hoursSpent}h
      Resources Explored: ${websiteCount}
      Recent Pages: ${recentWebsiteTitles.join(', ')}

      Key Quotes from Learning:
      ${keyLearnings}

      Create 5 diverse updates using these patterns:
        1. Progress celebration: "You've spent Xh on [topic] - great progress!"
        2. Content reminder: "Remember: [quote first 60 chars from Key Quotes]..."
        3. Topic connection: "Connect [topic1] with [topic2] for deeper understanding"
        4. Resource count: "You've explored X resources - try practicing what you learned"
        5. Page review: "Review your notes on [specific page title]"

      Rules:
        - Use ACTUAL data from above (exact hours, real quotes, specific titles, true counts)
        - Under 15 words each
        - No generic advice or teaching
        - Casual, encouraging tone
        - Each item unique type
        - No semicolons or colons except after "Remember"

      Return ONLY JSON array: ["Update 1", "Update 2", "Update 3", "Update 4", "Update 5"]`;

      const response = await aiSession.prompt(prompt);
      
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const pulseItems = JSON.parse(jsonMatch[0]);
        return pulseItems.filter(item => typeof item === 'string' && item.length > 0);
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  function generateFallbackPulse(attentions, websites, focus) {
    const pulseItems = [];
    
    if (focus.length > 0) {
      const mainFocus = focus[focus.length - 1];
      const totalTime = mainFocus.time_spent.reduce((sum, ts) => sum + (ts.stop - ts.start), 0);
      const hours = Math.round(totalTime / 3600000);
      pulseItems.push(`You've spent ${hours}h on ${mainFocus.focus_item} - great progress!`);
    }
    
    const recentAttentions = attentions.slice(0, 3);
    if (recentAttentions.length > 0) {
      const latestConcept = recentAttentions[0].text_content.slice(0, 60);
      pulseItems.push(`Remember: ${latestConcept}...`);
    }
    
    if (focus.length >= 2) {
      const focus1 = focus[focus.length - 2].focus_item;
      const focus2 = focus[focus.length - 1].focus_item;
      pulseItems.push(`Connect ${focus1} with ${focus2} for deeper understanding`);
    }
    
    const uniqueWebsites = new Set(attentions.map(att => att.website.id)).size;
    if (uniqueWebsites >= 3) {
      pulseItems.push(`You've explored ${uniqueWebsites} resources - try practicing what you learned`);
    }
    
    if (recentAttentions.length >= 2) {
      pulseItems.push(`Review your notes on ${recentAttentions[1].website.title.slice(0, 40)}...`);
    }
    
    return pulseItems.slice(0, 5);
  }

  const generatePulse = (attentions, websites, focus) => {
    if (!attentions || attentions.length === 0) {
      return [];
    }

    if (!websites || websites.length === 0) {
      return [];
    }

    if (!focus || focus.length === 0) {
      return [];
    }

    const sortedAttentions = [...attentions].sort((a, b) => b.timestamp - a.timestamp);
    
    if (sortedAttentions.length < 2) {
      return [];
    }

    return generateFallbackPulse(sortedAttentions, websites, focus);
  };

  const generatePulseWithAIWrapper = async (attentions, websites, focus) => {
    let pulseItems = [];

    if (aiAvailable && aiSession) {
      const aiPulse = await generatePulseWithAI(attentions, websites, focus);
      if (aiPulse && aiPulse.length > 0) {
        pulseItems = aiPulse;
      } else {
        pulseItems = generatePulse(attentions, websites, focus);
      }
    } else {
      pulseItems = generatePulse(attentions, websites, focus);
    }

    return pulseItems;
  };

  try {
    aiAvailable = await initializeAI();
    const pulse = await generatePulseWithAIWrapper(MOCK_ATTENTIONS, MOCK_WEBSITES, MOCK_FOCUS);
    console.log(JSON.stringify(pulse, null, 2));
    return pulse;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
})();
