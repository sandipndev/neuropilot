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
      timestamp: Date.now() - 172800000,
      url: 'https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick',
      title: 'The Node.js Event Loop, Timers, and process.nextTick()',
      metadata: {
        'description': 'Learn about the Node.js event loop and how it handles asynchronous operations',
        'keywords': 'nodejs, event loop, async, timers',
        'og:type': 'documentation'
      },
      summary: 'Comprehensive guide to Node.js event loop phases, timers, and understanding asynchronous execution.',
      opened_time: Date.now() - 172800000,
      closed_time: Date.now() - 169200000,
      active_time: 3600000
    },
    {
      id: 'web_002',
      timestamp: Date.now() - 169200000,
      url: 'https://nodejs.org/en/docs/guides/blocking-vs-non-blocking',
      title: 'Overview of Blocking vs Non-Blocking | Node.js',
      metadata: {
        'description': 'Understanding blocking and non-blocking calls in Node.js',
        'keywords': 'nodejs, blocking, non-blocking, async',
        'og:type': 'guide'
      },
      summary: 'Explanation of blocking vs non-blocking operations and their impact on Node.js application performance.',
      opened_time: Date.now() - 169200000,
      closed_time: Date.now() - 165600000,
      active_time: 3600000
    },
    {
      id: 'web_003',
      timestamp: Date.now() - 86400000,
      url: 'https://www.postgresql.org/docs/current/tutorial-transactions.html',
      title: 'PostgreSQL: Transactions',
      metadata: {
        'description': 'Learn about database transactions in PostgreSQL',
        'keywords': 'postgresql, transactions, ACID, database',
        'og:type': 'documentation'
      },
      summary: 'Tutorial on PostgreSQL transactions, covering ACID properties, commit, rollback, and isolation levels.',
      opened_time: Date.now() - 86400000,
      closed_time: Date.now() - 82800000,
      active_time: 3600000
    },
    {
      id: 'web_004',
      timestamp: Date.now() - 82800000,
      url: 'https://www.postgresql.org/docs/current/tutorial-join.html',
      title: 'PostgreSQL: Joins Between Tables',
      metadata: {
        'description': 'Understanding SQL joins in PostgreSQL',
        'keywords': 'postgresql, sql, joins, queries',
        'og:type': 'tutorial'
      },
      summary: 'Guide to different types of joins in PostgreSQL including INNER, LEFT, RIGHT, and FULL OUTER joins.',
      opened_time: Date.now() - 82800000,
      closed_time: Date.now() - 79200000,
      active_time: 3600000
    },
    {
      id: 'web_005',
      timestamp: Date.now() - 43200000,
      url: 'https://www.postgresql.org/docs/current/indexes.html',
      title: 'PostgreSQL: Indexes',
      metadata: {
        'description': 'Learn about database indexes and query optimization',
        'keywords': 'postgresql, indexes, performance, optimization',
        'og:type': 'documentation'
      },
      summary: 'Comprehensive guide to PostgreSQL indexes, covering B-tree, Hash, GiST, and GIN index types.',
      opened_time: Date.now() - 43200000,
      closed_time: Date.now() - 39600000,
      active_time: 3600000
    },
    {
      id: 'web_006',
      timestamp: Date.now() - 21600000,
      url: 'https://www.postgresql.org/docs/current/performance-tips.html',
      title: 'PostgreSQL: Performance Tips',
      metadata: {
        'description': 'Tips for optimizing PostgreSQL query performance',
        'keywords': 'postgresql, performance, optimization, queries',
        'og:type': 'guide'
      },
      summary: 'Performance optimization techniques for PostgreSQL including query planning, indexing strategies, and configuration tuning.',
      opened_time: Date.now() - 21600000,
      closed_time: Date.now() - 18000000,
      active_time: 3600000
    },
    {
      id: 'web_007',
      timestamp: Date.now() - 7200000,
      url: 'https://redis.io/docs/manual/data-types/',
      title: 'Redis data types | Redis',
      metadata: {
        'description': 'Overview of Redis data structures and their use cases',
        'keywords': 'redis, data types, cache, nosql',
        'og:type': 'documentation'
      },
      summary: 'Guide to Redis data types including strings, lists, sets, sorted sets, hashes, and their operations.',
      opened_time: Date.now() - 7200000,
      closed_time: Date.now() - 5400000,
      active_time: 1800000
    },
    {
      id: 'web_008',
      timestamp: Date.now() - 5400000,
      url: 'https://redis.io/docs/manual/patterns/distributed-locks/',
      title: 'Distributed Locks with Redis | Redis',
      metadata: {
        'description': 'Implementing distributed locks using Redis',
        'keywords': 'redis, distributed systems, locks, concurrency',
        'og:type': 'guide'
      },
      summary: 'Tutorial on implementing distributed locking mechanisms with Redis for coordinating access across multiple processes.',
      opened_time: Date.now() - 5400000,
      closed_time: Date.now() - 3600000,
      active_time: 1800000
    },
    {
      id: 'web_009',
      timestamp: Date.now() - 3600000,
      url: 'https://redis.io/docs/manual/patterns/pub-sub/',
      title: 'Pub/Sub | Redis',
      metadata: {
        'description': 'Redis publish/subscribe messaging pattern',
        'keywords': 'redis, pubsub, messaging, real-time',
        'og:type': 'documentation'
      },
      summary: 'Documentation on Redis pub/sub pattern for building real-time messaging and event-driven architectures.',
      opened_time: Date.now() - 3600000,
      closed_time: Date.now() - 1800000,
      active_time: 1800000
    }
  ];

  const MOCK_ATTENTIONS = [
    {
      id: 'att_001',
      website: MOCK_WEBSITES[0],
      timestamp: Date.now() - 172000000,
      text_content: 'The event loop is what allows Node.js to perform non-blocking I/O operations',
      attention_time: 180000
    },
    {
      id: 'att_002',
      website: MOCK_WEBSITES[0],
      timestamp: Date.now() - 171000000,
      text_content: 'Event loop phases: timers, pending callbacks, idle, poll, check, close callbacks',
      attention_time: 240000
    },
    {
      id: 'att_003',
      website: MOCK_WEBSITES[1],
      timestamp: Date.now() - 168000000,
      text_content: 'Blocking methods execute synchronously while non-blocking methods execute asynchronously',
      attention_time: 200000
    },
    {
      id: 'att_004',
      website: MOCK_WEBSITES[2],
      timestamp: Date.now() - 85000000,
      text_content: 'Transactions ensure ACID properties: Atomicity, Consistency, Isolation, Durability',
      attention_time: 220000
    },
    {
      id: 'att_005',
      website: MOCK_WEBSITES[2],
      timestamp: Date.now() - 84000000,
      text_content: 'Use BEGIN to start a transaction and COMMIT or ROLLBACK to end it',
      attention_time: 200000
    },
    {
      id: 'att_006',
      website: MOCK_WEBSITES[3],
      timestamp: Date.now() - 82000000,
      text_content: 'INNER JOIN returns rows when there is a match in both tables',
      attention_time: 180000
    },
    {
      id: 'att_007',
      website: MOCK_WEBSITES[3],
      timestamp: Date.now() - 81000000,
      text_content: 'LEFT JOIN returns all rows from left table and matched rows from right table',
      attention_time: 190000
    },
    {
      id: 'att_008',
      website: MOCK_WEBSITES[4],
      timestamp: Date.now() - 42000000,
      text_content: 'Indexes speed up data retrieval but slow down data modification operations',
      attention_time: 250000
    },
    {
      id: 'att_009',
      website: MOCK_WEBSITES[4],
      timestamp: Date.now() - 41000000,
      text_content: 'B-tree indexes are the default and most commonly used index type in PostgreSQL',
      attention_time: 230000
    },
    {
      id: 'att_010',
      website: MOCK_WEBSITES[5],
      timestamp: Date.now() - 20000000,
      text_content: 'Use EXPLAIN ANALYZE to understand query execution plans and identify bottlenecks',
      attention_time: 280000
    },
    {
      id: 'att_011',
      website: MOCK_WEBSITES[6],
      timestamp: Date.now() - 7000000,
      text_content: 'Redis supports strings, lists, sets, sorted sets, hashes, bitmaps, and hyperloglogs',
      attention_time: 200000
    },
    {
      id: 'att_012',
      website: MOCK_WEBSITES[7],
      timestamp: Date.now() - 5000000,
      text_content: 'Redlock algorithm provides distributed locking with Redis for high availability',
      attention_time: 220000
    },
    {
      id: 'att_013',
      website: MOCK_WEBSITES[8],
      timestamp: Date.now() - 3000000,
      text_content: 'PUBLISH sends messages to channels, SUBSCRIBE listens to channels for messages',
      attention_time: 190000
    }
  ];

  const MOCK_FOCUS = [
    {
      id: 'focus_001',
      focus_item: 'Node.js Event Loop',
      time_spent: [
        { start: Date.now() - 172800000, stop: Date.now() - 165600000 }
      ]
    },
    {
      id: 'focus_002',
      focus_item: 'PostgreSQL Transactions',
      time_spent: [
        { start: Date.now() - 86400000, stop: Date.now() - 82800000 }
      ]
    },
    {
      id: 'focus_003',
      focus_item: 'PostgreSQL Query Optimization',
      time_spent: [
        { start: Date.now() - 82800000, stop: Date.now() - 79200000 },
        { start: Date.now() - 43200000, stop: Date.now() - 39600000 },
        { start: Date.now() - 21600000, stop: Date.now() - 18000000 }
      ]
    },
    {
      id: 'focus_004',
      focus_item: 'Redis Caching Patterns',
      time_spent: [
        { start: Date.now() - 7200000, stop: Date.now() - 5400000 },
        { start: Date.now() - 5400000, stop: Date.now() - 3600000 },
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
          content: `You analyze learning patterns to detect focus shifts. Determine if user has shifted from one topic to another based on temporal patterns and topic relationships. Be specific about what changed and why it matters. Return concise analysis.`
        }]
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async function analyzeFocusShiftWithAI(attentions, websites, focus) {
    if (!aiSession) return null;

    try {
      if (focus.length < 2) {
        return null;
      }

      const recentFocus = focus.slice(-2);
      const previousFocus = recentFocus[0];
      const currentFocus = recentFocus[1];

      const prevTime = previousFocus.time_spent.reduce((sum, ts) => sum + (ts.stop - ts.start), 0);
      const currTime = currentFocus.time_spent.reduce((sum, ts) => sum + (ts.stop - ts.start), 0);
      const prevHours = Math.round(prevTime / 3600000);
      const currHours = Math.round(currTime / 3600000);

      const prevLastSession = previousFocus.time_spent[previousFocus.time_spent.length - 1];
      const currFirstSession = currentFocus.time_spent[0];
      const gapHours = Math.round((currFirstSession.start - prevLastSession.stop) / 3600000);

      const recentAttentions = attentions
        .filter(att => att.timestamp >= currFirstSession.start)
        .slice(0, 3);
      const recentTopics = recentAttentions.map(att => att.text_content.slice(0, 80)).join('; ');

      // TODO: Needs some auditing , cc: @sandipndev 
      const prompt = `Analyze this learning pattern shift:

        Previous Focus: "${previousFocus.focus_item}"
          - Time spent: ${prevHours}h
          - Sessions: ${previousFocus.time_spent.length}

        Current Focus: "${currentFocus.focus_item}"
          - Time spent: ${currHours}h
          - Sessions: ${currentFocus.time_spent.length}
          - Gap since previous: ${gapHours}h

        Recent learning topics:
        ${recentTopics}

        Determine if this is a focus shift and provide analysis:
          1. Has the focus genuinely shifted? (yes/no)
          2. What type of shift? (natural progression, pivot, exploration, or deepening)
          3. Why did it shift? (1 sentence)
          4. Recommendation (1 sentence)

        Return as: "SHIFT: yes/no | TYPE: [type] | REASON: [reason] | RECOMMENDATION: [recommendation]"`;

      const response = await aiSession.prompt(prompt);
      return response;
    } catch (error) {
      return null;
    }
  }

  function analyzeFocusShiftRuleBased(attentions, websites, focus) {
    if (focus.length < 2) {
      return 'SHIFT: no | Insufficient focus history to detect shifts';
    }

    const sortedFocus = [...focus].sort((a, b) => {
      const aLast = a.time_spent[a.time_spent.length - 1].stop;
      const bLast = b.time_spent[b.time_spent.length - 1].stop;
      return aLast - bLast;
    });

    const recentFocus = sortedFocus.slice(-2);
    const previousFocus = recentFocus[0];
    const currentFocus = recentFocus[1];

    const prevTime = previousFocus.time_spent.reduce((sum, ts) => sum + (ts.stop - ts.start), 0);
    const currTime = currentFocus.time_spent.reduce((sum, ts) => sum + (ts.stop - ts.start), 0);
    const prevHours = Math.round(prevTime / 3600000);
    const currHours = Math.round(currTime / 3600000);

    const prevLastSession = previousFocus.time_spent[previousFocus.time_spent.length - 1];
    const currFirstSession = currentFocus.time_spent[0];
    const gapMs = currFirstSession.start - prevLastSession.stop;
    const gapHours = Math.round(gapMs / 3600000);

    const hasShifted = previousFocus.focus_item !== currentFocus.focus_item;

    if (!hasShifted) {
      return 'SHIFT: no | Still focused on the same topic';
    }

    let shiftType = 'exploration';
    if (gapHours < 24 && currTime > prevTime) {
      shiftType = 'natural progression';
    } else if (gapHours > 48) {
      shiftType = 'pivot';
    } else if (currentFocus.time_spent.length > 2) {
      shiftType = 'deepening';
    }

    const reason = `Moved from "${previousFocus.focus_item}" (${prevHours}h) to "${currentFocus.focus_item}" (${currHours}h) after ${gapHours}h gap`;
    
    // TODO: Needs some auditing , cc: @sandipndev 
    let recommendation = '';
    if (shiftType === 'natural progression') {
      recommendation = 'Good progression - consider connecting concepts between both topics';
    } else if (shiftType === 'pivot') {
      recommendation = 'Major shift detected - ensure previous topic fundamentals are solid';
    } else if (shiftType === 'deepening') {
      recommendation = 'Deep dive in progress - maintain momentum with hands-on practice';
    } else {
      recommendation = 'Exploring new area - take notes to track insights';
    }

    return `SHIFT: yes | TYPE: ${shiftType} | REASON: ${reason} | RECOMMENDATION: ${recommendation}`;
  }

  const hasFocusShifted = (attentions, websites, focus) => {
    if (!attentions || attentions.length === 0) {
      return 'SHIFT: unknown | No attention data available';
    }

    if (!websites || websites.length === 0) {
      return 'SHIFT: unknown | No website data available';
    }

    if (!focus || focus.length === 0) {
      return 'SHIFT: unknown | No focus data available';
    }

    return analyzeFocusShiftRuleBased(attentions, websites, focus);
  };

  const hasFocusShiftedWithAI = async (attentions, websites, focus) => {
    let analysis = '';

    if (aiAvailable && aiSession) {
      const aiAnalysis = await analyzeFocusShiftWithAI(attentions, websites, focus);
      if (aiAnalysis) {
        analysis = aiAnalysis;
      } else {
        analysis = hasFocusShifted(attentions, websites, focus);
      }
    } else {
      analysis = hasFocusShifted(attentions, websites, focus);
    }

    return analysis;
  };

  try {
    aiAvailable = await initializeAI();
    const result = await hasFocusShiftedWithAI(MOCK_ATTENTIONS, MOCK_WEBSITES, MOCK_FOCUS);
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
})();
