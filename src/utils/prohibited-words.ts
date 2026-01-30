/**
 * Prohibited Words Detection for Portuguese Language
 * Simple heuristic-based detection (no AI/ML)
 */

import { ViolationSeverity } from "../models/language-violation";

// Portuguese profanity and offensive terms
const PROFANITY = [
  "porra", "caralho", "puta", "fdp", "cuzão", "merda", "bosta",
  "foda-se", "filha da puta", "filho da puta", "vai tomar no cu",
  "vai se foder", "cu", "arrombado", "desgraça"
];

// Threats and violence
const THREATS = [
  "vou te matar", "vou te bater", "vou acabar com você",
  "vai morrer", "te mato", "te pego", "te espanco",
  "vou te destruir", "vou acabar contigo", "ameaça"
];

// Hate speech and discrimination
const HATE_SPEECH = [
  "macaco", "preto imundo", "viado", "bicha", "sapatão",
  "retardado", "mongol", "imbecil", "débil mental",
  "vai morrer", "mata", "terrorista"
];

// Harassment and intimidation
const HARASSMENT = [
  "stalker", "perseguir", "obsessão", "assédio",
  "te persigo", "sei onde você mora", "vou te pegar"
];

export interface LanguageCheckResult {
  isInappropriate: boolean;
  detectedWords: string[];
  severity: ViolationSeverity;
  matchedPatterns: string[];
}

/**
 * Check text for inappropriate language
 */
export function checkLanguage(text: string): LanguageCheckResult {
  if (!text || text.trim().length === 0) {
    return {
      isInappropriate: false,
      detectedWords: [],
      severity: ViolationSeverity.LOW,
      matchedPatterns: []
    };
  }

  const normalizedText = text.toLowerCase();
  const detectedWords: string[] = [];
  const matchedPatterns: string[] = [];
  let highestSeverity = ViolationSeverity.LOW;

  // Check for threats (HIGH severity)
  for (const threat of THREATS) {
    if (containsWord(normalizedText, threat)) {
      detectedWords.push(threat);
      matchedPatterns.push("threat");
      highestSeverity = ViolationSeverity.HIGH;
    }
  }

  // Check for hate speech (HIGH severity)
  for (const hate of HATE_SPEECH) {
    if (containsWord(normalizedText, hate)) {
      detectedWords.push(hate);
      matchedPatterns.push("hate_speech");
      highestSeverity = ViolationSeverity.HIGH;
    }
  }

  // Check for harassment (MEDIUM severity)
  for (const harassment of HARASSMENT) {
    if (containsWord(normalizedText, harassment)) {
      detectedWords.push(harassment);
      matchedPatterns.push("harassment");
      if (highestSeverity === ViolationSeverity.LOW) {
        highestSeverity = ViolationSeverity.MEDIUM;
      }
    }
  }

  // Check for profanity (LOW/MEDIUM severity)
  for (const profanity of PROFANITY) {
    if (containsWord(normalizedText, profanity)) {
      detectedWords.push(profanity);
      matchedPatterns.push("profanity");
      if (highestSeverity === ViolationSeverity.LOW) {
        highestSeverity = ViolationSeverity.MEDIUM;
      }
    }
  }

  return {
    isInappropriate: detectedWords.length > 0,
    detectedWords: [...new Set(detectedWords)], // Remove duplicates
    severity: highestSeverity,
    matchedPatterns: [...new Set(matchedPatterns)],
  };
}

/**
 * Check if text contains a word with word boundaries
 */
function containsWord(text: string, word: string): boolean {
  // Create regex with word boundaries
  const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
  return regex.test(text);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
