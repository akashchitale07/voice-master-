export interface HindiDetectionResult {
  hasHindi: boolean;
  hindiCharCount: number;
  totalCharCount: number;
  hindiPercentage: number;
}

/**
 * Checks if the text contains Devanagari / Hindi characters.
 * Unicode range for Devanagari is \u0900-\u097F and extended \uA8E0-\uA8FF.
 */
export function detectHindi(text: string): HindiDetectionResult {
  if (!text) {
    return {
      hasHindi: false,
      hindiCharCount: 0,
      totalCharCount: 0,
      hindiPercentage: 0,
    };
  }

  const hindiRegex = /[\u0900-\u097F\uA8E0-\uA8FF]/g;
  const matches = text.match(hindiRegex);
  const hindiCharCount = matches ? matches.length : 0;
  
  // Non-whitespace character count
  const nonWhitespaceCount = text.replace(/\s/g, '').length;
  const totalCharCount = text.length;
  
  const hindiPercentage = nonWhitespaceCount > 0 
    ? Math.round((hindiCharCount / nonWhitespaceCount) * 100) 
    : 0;

  return {
    hasHindi: hindiCharCount > 0,
    hindiCharCount,
    totalCharCount,
    hindiPercentage,
  };
}

/**
 * Normalizes text: removes excess spaces, multiple blank lines, and trims ends.
 */
export function cleanHindiText(text: string): string {
  if (!text) return '';
  return text
    // Replace multiple spaces/tabs with a single space
    .replace(/[ \t]+/g, ' ')
    // Replace more than two consecutive line breaks with two
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // Trim lines
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

/**
 * Counts characters and words.
 */
export function getStats(text: string): { chars: number; words: number } {
  const chars = text.length;
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  return { chars, words };
}

/**
 * Generates formatted filename: hindi-voice-YYYY-MM-DD-HH-MM.wav
 */
export function generateVoiceFilename(extension: 'wav' | 'mp3' = 'wav'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `hindi-voice-${year}-${month}-${day}-${hours}-${minutes}.${extension}`;
}

/**
 * Formats seconds into MM:SS
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Curated Hindi sample paragraphs for instant testing.
 */
export const HINDI_SAMPLES = [
  {
    title: 'कहानी (Story)',
    text: 'नमस्ते! आपका स्वागत है। आज हम एक नई कहानी के बारे में जानेंगे। एक समय की बात है, एक सुंदर गाँव में अमन नाम का एक दयालु लड़का रहता था। वह हमेशा दूसरों की मदद करने के लिए तत्पर रहता था।',
  },
  {
    title: 'दैनिक अभिवादन (Greetings)',
    text: 'सुप्रभात! आपका दिन मंगलमय हो। आशा है कि आज का दिन आपके जीवन में सुख, शांति और समृद्धि लेकर आएगा।',
  },
  {
    title: 'समाचार (News Intro)',
    text: 'नमस्कार, मुख्य समाचारों के साथ मैं आपका स्वागत करता हूँ। देश और दुनिया की तमाम बड़ी ख़बरों को लेकर हम आपके सामने प्रस्तुत हैं। आइए जानते हैं आज की महत्वपूर्ण घटनाएँ।',
  },
  {
    title: 'शिक्षा व ज्ञान (Educational)',
    text: 'ज्ञान वह अमूल्य धन है जिसे न कोई चुरा सकता है और न ही कोई छीन सकता है। जितना अधिक हम ज्ञान बाँटते हैं, वह उतना ही बढ़ता जाता है।',
  },
  {
    title: 'प्रेरणादायक (Inspirational)',
    text: 'कोशिश करने वालों की कभी हार नहीं होती। लहरों से डर कर नौका पार नहीं होती। जब तक न सफल हो, नींद चैन को त्यागो तुम, संघर्ष का मैदान छोड़ कर मत भागो तुम।',
  },
];
