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

  /**
   * @typedef {Object} QuizQuestion
   * @property {string} id
   * @property {string} question
   * @property {string} option_1
   * @property {string} option_2
   * @property {1 | 2} correct_option
   */

  const MOCK_WEBSITES = [
    {
      id: 'web_001',
      timestamp: Date.now() - 7200000,
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
      title: 'Promise - JavaScript | MDN',
      metadata: {
        'description': 'The Promise object represents the eventual completion or failure of an asynchronous operation',
        'keywords': 'javascript, promise, async, await',
        'og:type': 'article'
      },
      summary: 'Comprehensive guide to JavaScript Promises, covering creation, chaining, error handling, and async/await syntax.',
      opened_time: Date.now() - 7200000,
      closed_time: Date.now() - 5400000,
      active_time: 1800000
    },
    {
      id: 'web_002',
      timestamp: Date.now() - 5400000,
      url: 'https://javascript.info/async-await',
      title: 'Async/await - JavaScript.info',
      metadata: {
        'description': 'Learn about async/await syntax for working with promises',
        'keywords': 'javascript, async, await, promises',
        'og:type': 'tutorial'
      },
      summary: 'Tutorial on async/await syntax, explaining how it simplifies promise-based code and handles asynchronous operations.',
      opened_time: Date.now() - 5400000,
      closed_time: Date.now() - 3600000,
      active_time: 1800000
    },
    {
      id: 'web_003',
      timestamp: Date.now() - 3600000,
      url: 'https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call',
      title: 'How do I return the response from an asynchronous call? - Stack Overflow',
      metadata: {
        'description': 'Common question about handling async responses in JavaScript',
        'keywords': 'javascript, async, callback, promise',
        'og:type': 'question'
      },
      summary: 'Stack Overflow discussion about common pitfalls with asynchronous JavaScript and how to properly handle async responses.',
      opened_time: Date.now() - 3600000,
      closed_time: Date.now() - 1800000,
      active_time: 1800000
    },
    {
      id: 'web_004',
      timestamp: Date.now() - 1800000,
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function',
      title: 'async function - JavaScript | MDN',
      metadata: {
        'description': 'The async function declaration defines an asynchronous function',
        'keywords': 'javascript, async, function, await',
        'og:type': 'documentation'
      },
      summary: 'Documentation on async function declarations, return values, and how they work with the event loop.',
      opened_time: Date.now() - 1800000,
      closed_time: Date.now() - 900000,
      active_time: 900000
    },
    {
      id: 'web_005',
      timestamp: Date.now() - 900000,
      url: 'https://web.dev/articles/promises',
      title: 'JavaScript Promises: An introduction | web.dev',
      metadata: {
        'description': 'Learn how to use promises in JavaScript',
        'keywords': 'javascript, promises, async, web development',
        'og:type': 'article'
      },
      summary: 'Introduction to promises with practical examples, covering promise states, chaining, and error handling patterns.',
      opened_time: Date.now() - 900000,
      closed_time: Date.now() - 300000,
      active_time: 600000
    }
  ];

  const MOCK_ATTENTIONS = [
    {
      id: 'att_001',
      website: MOCK_WEBSITES[0],
      timestamp: Date.now() - 7000000,
      text_content: 'A Promise is in one of these states: pending, fulfilled, or rejected',
      attention_time: 120000
    },
    {
      id: 'att_002',
      website: MOCK_WEBSITES[0],
      timestamp: Date.now() - 6800000,
      text_content: 'Promise.then() returns a new promise, allowing for promise chaining',
      attention_time: 180000
    },
    {
      id: 'att_003',
      website: MOCK_WEBSITES[0],
      timestamp: Date.now() - 6500000,
      text_content: 'Promise.catch() handles rejection and returns a promise',
      attention_time: 150000
    },
    {
      id: 'att_004',
      website: MOCK_WEBSITES[1],
      timestamp: Date.now() - 5200000,
      text_content: 'The async keyword makes a function return a promise',
      attention_time: 200000
    },
    {
      id: 'att_005',
      website: MOCK_WEBSITES[1],
      timestamp: Date.now() - 5000000,
      text_content: 'await can only be used inside async functions and pauses execution until promise resolves',
      attention_time: 240000
    },
    {
      id: 'att_006',
      website: MOCK_WEBSITES[1],
      timestamp: Date.now() - 4700000,
      text_content: 'async/await makes asynchronous code look and behave like synchronous code',
      attention_time: 180000
    },
    {
      id: 'att_007',
      website: MOCK_WEBSITES[2],
      timestamp: Date.now() - 3400000,
      text_content: 'You cannot return values from async callbacks directly - you need to use promises or callbacks',
      attention_time: 300000
    },
    {
      id: 'att_008',
      website: MOCK_WEBSITES[2],
      timestamp: Date.now() - 3100000,
      text_content: 'Common mistake: trying to use async data synchronously without waiting',
      attention_time: 250000
    },
    {
      id: 'att_009',
      website: MOCK_WEBSITES[3],
      timestamp: Date.now() - 1600000,
      text_content: 'async functions always return a promise, even if you return a non-promise value',
      attention_time: 200000
    },
    {
      id: 'att_010',
      website: MOCK_WEBSITES[3],
      timestamp: Date.now() - 1400000,
      text_content: 'Error handling in async functions can use try/catch blocks',
      attention_time: 180000
    },
    {
      id: 'att_011',
      website: MOCK_WEBSITES[4],
      timestamp: Date.now() - 800000,
      text_content: 'Promise.all() waits for all promises to resolve or any to reject',
      attention_time: 160000
    },
    {
      id: 'att_012',
      website: MOCK_WEBSITES[4],
      timestamp: Date.now() - 500000,
      text_content: 'Promise.race() resolves or rejects as soon as one of the promises resolves or rejects',
      attention_time: 140000
    }
  ];

  const MOCK_FOCUS = [
    {
      id: 'focus_001',
      focus_item: 'JavaScript Promises',
      time_spent: [
        { start: Date.now() - 7200000, stop: Date.now() - 5400000 },
        { start: Date.now() - 3600000, stop: Date.now() - 1800000 }
      ]
    },
    {
      id: 'focus_002',
      focus_item: 'Async/Await Syntax',
      time_spent: [
        { start: Date.now() - 5400000, stop: Date.now() - 3600000 },
        { start: Date.now() - 1800000, stop: Date.now() - 900000 }
      ]
    },
    {
      id: 'focus_003',
      focus_item: 'Asynchronous Error Handling',
      time_spent: [
        { start: Date.now() - 3600000, stop: Date.now() - 2700000 },
        { start: Date.now() - 900000, stop: Date.now() - 300000 }
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
          content: `You are an expert educator creating quiz questions. Generate questions that test understanding of concepts the user has been learning. Questions should be clear, have two distinct options, and test comprehension rather than memorization. Return ONLY valid JSON array format.`
        }]
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async function generateQuestionsWithAI(attentions, websites, focus) {
    if (!aiSession) return null;
    // TODO: Needs some auditing , cc: @sandipndev 
    // I think, its better to provide short and concise options
    try {
      const recentAttentions = attentions.slice(0, 8);
      const focusTopics = focus.map(f => f.focus_item).join(', ');
      const keyContent = recentAttentions.map(att => att.text_content).join('\n');

      const prompt = `Based on this learning activity, generate 3 quiz questions in JSON format.

        Focus Topics: ${focusTopics}

        Key Content Learned:
        ${keyContent}

        Generate 3 questions that test understanding of these concepts. Return ONLY a JSON array with this exact structure:
        [
        {
            "id": "q1",
            "question": "Question text here?",
            "option_1": "First option",
            "option_2": "Second option",
            "correct_option": 1
        }
        ]

        Requirements:
        - Questions should test comprehension, not memorization
        - Options should be plausible but clearly distinct
        - correct_option must be 1 or 2
        - Keep questions concise and clear`;

      const response = await aiSession.prompt(prompt);
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return questions.map((q, idx) => ({
          id: `quiz_${Date.now()}_${idx}`,
          question: q.question,
          option_1: q.option_1,
          option_2: q.option_2,
          correct_option: q.correct_option
        }));
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  function generateFallbackQuestions(attentions, websites, focus) {
    const questions = [];
    const recentAttentions = attentions.slice(0, 6);
    
    if (recentAttentions.length >= 2) {
      const att1 = recentAttentions[0];
      const att2 = recentAttentions[1];
      
      questions.push({
        id: `quiz_${Date.now()}_0`,
        question: `Based on your recent learning about ${focus[0]?.focus_item || 'this topic'}, which statement is correct?`,
        option_1: att1.text_content.slice(0, 100),
        option_2: `This is an incorrect interpretation of ${focus[0]?.focus_item || 'the concept'}`,
        correct_option: 1
      });
    }
    
    if (recentAttentions.length >= 4) {
      const att3 = recentAttentions[2];
      const att4 = recentAttentions[3];
      
      questions.push({
        id: `quiz_${Date.now()}_1`,
        question: `Which of these statements about ${focus[1]?.focus_item || 'this concept'} is accurate?`,
        option_1: `${focus[1]?.focus_item || 'This concept'} works differently than described`,
        option_2: att3.text_content.slice(0, 100),
        correct_option: 2
      });
    }
    
    if (focus.length >= 2) {
      questions.push({
        id: `quiz_${Date.now()}_2`,
        question: `What is the relationship between ${focus[0]?.focus_item} and ${focus[1]?.focus_item}?`,
        option_1: `${focus[1]?.focus_item} is a way to simplify working with ${focus[0]?.focus_item}`,
        option_2: `They are completely unrelated concepts`,
        correct_option: 1
      });
    }
    
    return questions;
  }

  const generateQuizQuestions = (attentions, websites, focus) => {
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
    const recentAttentions = sortedAttentions.slice(0, 10);

    if (recentAttentions.length < 3) {
      return [];
    }

    return generateFallbackQuestions(recentAttentions, websites, focus);
  };

  const generateQuizQuestionsWithAI = async (attentions, websites, focus) => {
    let questions = [];

    if (aiAvailable && aiSession) {
      const aiQuestions = await generateQuestionsWithAI(attentions, websites, focus);
      if (aiQuestions && aiQuestions.length > 0) {
        questions = aiQuestions;
      } else {
        questions = generateQuizQuestions(attentions, websites, focus);
      }
    } else {
      questions = generateQuizQuestions(attentions, websites, focus);
    }

    return questions;
  };

  try {
    aiAvailable = await initializeAI();
    const questions = await generateQuizQuestionsWithAI(MOCK_ATTENTIONS, MOCK_WEBSITES, MOCK_FOCUS);
    console.log(JSON.stringify(questions, null, 2));
    return questions;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
})();
