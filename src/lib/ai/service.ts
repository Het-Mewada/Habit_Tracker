import { db } from '../db';
import { generateAnalyticsSummary, HabitAnalyticsSummary } from './aggregator';
import { generateHeuristicInsights, StructuredAiInsight } from './heuristic';
import { DEFAULT_TIMEZONE } from '../date-utils';

const SYSTEM_PROMPT = `
You are an expert behavioral scientist and personal habit coach AI assistant.
Analyze the provided JSON summary of habit tracking data and return a JSON object with actionable, deeply insightful analysis.

CRITICAL VOICE & PERSPECTIVE DIRECTIVES:
- ALWAYS address the user directly in the SECOND PERSON ("you", "your", "you've", "your routine").
- NEVER refer to the user in the third person. DO NOT use terms like "the user", "this user", "their", or "user has".
- Speak directly to the user as their dedicated senior habit coach.
- INCORRECT EXAMPLES: "The user has completed 50%", "The user performs best on Saturdays."
- CORRECT EXAMPLES: "You have completed 50% of your habits.", "You perform best on Saturdays."

Do NOT simply repeat numbers. Produce real behavioral analysis identifying patterns, momentum shifts, strength areas, weaknesses, and actionable recommendations.

Return ONLY valid JSON matching this exact structure:
{
  "overallPerformance": {
    "summaryText": "string (must address the user as 'you')",
    "score": number (0-100),
    "statusLabel": "string"
  },
  "strongestHabits": [
    {
      "name": "string",
      "icon": "string",
      "completionRate": number,
      "streak": number,
      "insight": "string (addressed directly to 'you')"
    }
  ],
  "strugglingHabits": [
    {
      "name": "string",
      "icon": "string",
      "completionRate": number,
      "missedDays": number,
      "insight": "string (addressed directly to 'you')"
    }
  ],
  "improvingTrends": [
    {
      "name": "string",
      "icon": "string",
      "delta": number,
      "insight": "string (addressed directly to 'you')"
    }
  ],
  "decliningTrends": [
    {
      "name": "string",
      "icon": "string",
      "delta": number,
      "insight": "string (addressed directly to 'you')"
    }
  ],
  "behavioralPatterns": ["string (each pattern addressed directly to 'you')"],
  "recommendations": ["string (each recommendation addressed directly to 'you')"]
}
`;

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

const GROQ_MODELS = ['groq/compound', 'groq/compound-mini'];

async function callGroqApi(
  apiKey: string,
  summary: HabitAnalyticsSummary
): Promise<{ insight: StructuredAiInsight | null; errorReason?: string }> {
  let lastError = '';

  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Analyze this user habit performance summary:\n\n${JSON.stringify(
                summary,
                null,
                2
              )}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        lastError = `HTTP ${response.status} ${response.statusText} for model '${model}'${errText ? `: ${errText.slice(0, 150)}` : ''}`;
        console.warn(`❌ [GROQ API MODEL '${model}' FAILED] ${lastError}`);
        continue;
      }

      const data = await response.json();
      const contentStr = data?.choices?.[0]?.message?.content;
      if (!contentStr) {
        lastError = `Response body from '${model}' missing choices[0].message.content`;
        console.warn(`❌ [GROQ API ERROR] ${lastError}`);
        continue;
      }

      const cleanedStr = cleanJsonResponse(contentStr);
      const parsed = JSON.parse(cleanedStr);
      console.log(`✅ [GROQ API SUCCESS] Model '${model}' generated insights successfully!`);
      return {
        insight: {
          ...parsed,
          provider: 'groq',
          modelUsed: model,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      lastError = `Network/Fetch Exception for '${model}': ${err?.message || String(err)}`;
      console.error(`❌ [GROQ API EXCEPTION] ${lastError}`);
    }
  }

  return { insight: null, errorReason: lastError };
}

async function callGeminiApi(
  apiKey: string,
  summary: HabitAnalyticsSummary
): Promise<{ insight: StructuredAiInsight | null; errorReason?: string }> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const promptText = `${SYSTEM_PROMPT}\n\nHabit Data:\n${JSON.stringify(summary, null, 2)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      const reason = `HTTP ${response.status} ${response.statusText}${errText ? `: ${errText.slice(0, 150)}` : ''}`;
      console.warn(`❌ [GEMINI API ERROR] ${reason}`);
      return { insight: null, errorReason: reason };
    }

    const data = await response.json();
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      const reason = 'Response body missing candidates[0].content.parts[0].text structure';
      console.warn(`❌ [GEMINI API ERROR] ${reason}`);
      return { insight: null, errorReason: reason };
    }

    const cleanedStr = cleanJsonResponse(textResult);
    const parsed = JSON.parse(cleanedStr);
    return {
      insight: {
        ...parsed,
        provider: 'gemini',
        modelUsed: 'gemini-1.5-flash',
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    const reason = `Network/Fetch Exception: ${err?.message || String(err)}`;
    console.error(`❌ [GEMINI API EXCEPTION] ${reason}`);
    return { insight: null, errorReason: reason };
  }
}

export async function getUserDataDaysCount(userId: string): Promise<{ availableDays: number; uniqueLoggedDays: number; spanDays: number }> {
  const uniqueLoggedDates = await db.habitLog.groupBy({
    by: ['date'],
    where: { userId },
  });

  const earliestHabit = await db.habit.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });

  const earliestLog = await db.habitLog.findFirst({
    where: { userId },
    orderBy: { date: 'asc' },
    select: { date: true },
  });

  let spanDays = 0;
  if (earliestHabit) {
    const habitMs = Date.now() - new Date(earliestHabit.createdAt).getTime();
    spanDays = Math.max(1, Math.ceil(habitMs / (1000 * 60 * 60 * 24)));
  }
  if (earliestLog?.date) {
    const logMs = Date.now() - new Date(`${earliestLog.date}T00:00:00`).getTime();
    const logSpan = Math.max(1, Math.ceil(logMs / (1000 * 60 * 60 * 24)));
    spanDays = Math.max(spanDays, logSpan);
  }

  const availableDays = Math.max(uniqueLoggedDates.length, spanDays);
  return { availableDays, uniqueLoggedDays: uniqueLoggedDates.length, spanDays };
}

export async function getOrGenerateAiInsights(
  userId: string,
  userTimezone: string = DEFAULT_TIMEZONE,
  forceRefresh: boolean = false
): Promise<{ insight: StructuredAiInsight; isCached: boolean }> {
  // 1. Check for cached insight if forceRefresh is false
  if (!forceRefresh) {
    const cached = await db.aiInsight.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (cached) {
      try {
        const parsedInsight: StructuredAiInsight = JSON.parse(cached.insightContent);
        console.log(`\n==================================================`);
        console.log(`📦 [AI SERVICE] Serviced from Database Cache`);
        console.log(`   • Provider  : ${parsedInsight.provider.toUpperCase()}`);
        console.log(`   • Model Used: ${parsedInsight.modelUsed || parsedInsight.provider}`);
        console.log(`==================================================\n`);
        return { insight: parsedInsight, isCached: true };
      } catch {
        // Fall through if parsing fails
      }
    }
  }

  // 2. Fetch User API Keys & Settings
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { groqApiKey: true, geminiApiKey: true, requireMin7DaysAi: true },
  });

  const groqKey = user?.groqApiKey || process.env.GROQ_API_KEY;
  const geminiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY;
  const requireMin7Days = user?.requireMin7DaysAi !== false; // Default ON (true)

  // 3. Gatekeeper Check: Skip AI calls if < 7 days data available and requirement is enabled
  const dataDaysInfo = await getUserDataDaysCount(userId);
  if (requireMin7Days && dataDaysInfo.availableDays < 7) {
    console.log(`\n==================================================`);
    console.log(`🛑 [AI SERVICE GATEKEEPER] Skipped AI API calls: Available data (${dataDaysInfo.availableDays} days) < 7 days required.`);
    console.log(`   • Requirement Setting: ENABLED (requireMin7DaysAi = true)`);
    console.log(`==================================================\n`);

    const insufficientDataInsight: StructuredAiInsight = {
      provider: 'insufficient_data',
      modelUsed: '7-Day Data Gatekeeper',
      generatedAt: new Date().toISOString(),
      overallPerformance: {
        score: 0,
        statusLabel: 'Insufficient Data (7 Days Recommended)',
        summaryText: `AI Analysis is currently paused because you have ${dataDaysInfo.availableDays} day(s) of tracking history available. A minimum of 7 days of data is required for meaningful behavioral intelligence. You can toggle this setting OFF anytime in Settings to generate insights earlier.`,
      },
      strongestHabits: [],
      strugglingHabits: [],
      improvingTrends: [],
      decliningTrends: [],
      behavioralPatterns: [
        `Data available: ${dataDaysInfo.availableDays} day(s) logged / elapsed out of 7 required.`,
        'Keep logging daily habits for a full week to unlock deep behavioral predictions and pattern detection.',
      ],
      recommendations: [
        'Track your habits consistently over the next few days to reach 7 days of data.',
        'Or go to Settings -> AI Settings and turn OFF "Require 7+ Days Data for AI Analysis" to force AI API generation now.',
      ],
    };

    return { insight: insufficientDataInsight, isCached: false };
  }

  // 4. Generate structured analytics summary
  const summary = await generateAnalyticsSummary(userId, userTimezone, 30);

  let resultInsight: StructuredAiInsight | null = null;
  const failureLog: { groq?: string; gemini?: string } = {};

  console.log(`\n==================================================`);
  console.log(`🤖 [AI SERVICE] Generating New AI Insights (forceRefresh: ${forceRefresh})...`);

  // Tier 1: Try Groq API
  if (groqKey) {
    console.log(`[AI SERVICE] 1️⃣ Calling Primary Provider: GROQ API...`);
    const res = await callGroqApi(groqKey, summary);
    if (res.insight) {
      resultInsight = res.insight;
      console.log(`✅ [AI SERVICE SUCCESS] Groq API Succeeded!`);
      console.log(`   • Provider  : GROQ`);
      console.log(`   • Model Used: ${res.insight.modelUsed}`);
    } else {
      failureLog.groq = res.errorReason || 'Unknown Groq failure';
      console.warn(`⚠️ [AI SERVICE FALLBACK] Groq API failed (${failureLog.groq}). Falling back to Gemini...`);
    }
  } else {
    failureLog.groq = 'API Key not provided in settings or environment variables (.env)';
    console.log(`ℹ️ [AI SERVICE INFO] Groq API skipped: ${failureLog.groq}`);
  }

  // Tier 2: Try Gemini API if Groq failed or key not available
  if (!resultInsight && geminiKey) {
    console.log(`[AI SERVICE] 2️⃣ Calling Secondary Provider: GEMINI API...`);
    const res = await callGeminiApi(geminiKey, summary);
    if (res.insight) {
      resultInsight = res.insight;
      console.log(`✅ [AI SERVICE SUCCESS] Gemini API Succeeded!`);
      console.log(`   • Provider  : GEMINI`);
      console.log(`   • Model Used: ${res.insight.modelUsed}`);
    } else {
      failureLog.gemini = res.errorReason || 'Unknown Gemini failure';
      console.warn(`⚠️ [AI SERVICE FALLBACK] Gemini API failed (${failureLog.gemini}). Falling back to Custom Heuristic Engine...`);
    }
  } else if (!resultInsight) {
    failureLog.gemini = geminiKey
      ? 'Skipped because Groq succeeded'
      : 'API Key not provided in settings or environment variables (.env)';
    console.log(`ℹ️ [AI SERVICE INFO] Gemini API skipped: ${failureLog.gemini}`);
  }

  // Tier 3: Deterministic Heuristic Engine Fallback
  if (!resultInsight) {
    resultInsight = generateHeuristicInsights(summary);

    console.log(`\n--------------------------------------------------`);
    console.log(`⚡ [AI SERVICE FALLBACK TRIGGERED] Switching to Custom Offline Heuristic Engine`);
    console.log(`   • Provider  : CUSTOM (Offline Heuristic Engine)`);
    console.log(`   • Model Used: ${resultInsight.modelUsed}`);
    console.log(`📋 [FAILURE AUDIT REASONS]:`);
    console.log(`   • Groq Failure Reason  : ${failureLog.groq}`);
    console.log(`   • Gemini Failure Reason: ${failureLog.gemini}`);
    console.log(`--------------------------------------------------\n`);
  }

  console.log(`==================================================\n`);

  // 4. Save to Database Cache
  await db.aiInsight.upsert({
    where: { id: (await db.aiInsight.findFirst({ where: { userId } }))?.id || 'new_id' },
    create: {
      userId,
      period: summary.period,
      provider: resultInsight.provider,
      summaryPayload: JSON.stringify(summary),
      insightContent: JSON.stringify(resultInsight),
    },
    update: {
      period: summary.period,
      provider: resultInsight.provider,
      summaryPayload: JSON.stringify(summary),
      insightContent: JSON.stringify(resultInsight),
      updatedAt: new Date(),
    },
  });

  return { insight: resultInsight, isCached: false };
}
