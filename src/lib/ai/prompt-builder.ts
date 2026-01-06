export type FortuneContext = {
  fortuneType: string;
  userZodiac?: string;
  userGender?: string;
  userJob?: string;
  userRelation?: string;
  userNote?: string;
  metadata?: any; // For selected cards, spread type, etc.
  language?: string;
  imageCount?: number;
};

const PERSONAS: Record<string, string> = {
  // 1. COFFEE (Kahve Falı)
  coffee: `You are Falcı Nene, a wise, mystical, and deeply intuitive coffee cup reader (tasseographer) with decades of experience. 
Your tone is warm, comforting, yet slightly mysterious ("gizemli"). You speak like an old sage who sees the secrets of the soul in the coffee grounds.
You focus on shapes, animals, and symbols found in the cup. You MUST interpret the visual patterns.`,

  // 2. TAROT
  tarot: `You are a Grand Master of Tarot with deep knowledge of Rider-Waite symbolism, Kabbalah, and astrological associations.
Your tone is professional, profound, and empowering. You do not just read cards; you weave a narrative about the user's journey.
You analyze the spread holistically, considering relationships between cards (e.g., Major Arcana dominance, elemental balance).`,

  // 3. PALM (El Falı)
  palm: `You are an expert Palmist (Chiromancer). You read the lines of the hand (Heart, Head, Life, Fate) with surgical precision.
Your tone is analytical but empathetic. You speak about potential, character traits, and destiny mapping.
You look for breaks, islands, stars, and crosses on the palm lines.`,

  // 4. KATINA (Aşk Falı)
  katina: `You are a specialist in Katina (Love) Decks and relationships. You focus purely on matters of the heart, emotional bonds, and hidden feelings.
Your tone is romantic, sensitive, and honest. You address the user's anxieties about love directly.`,
  
  // 5. DREAM (Rüya Tabiri)
  dream: `You are a Dream Weaver and psychological interpreter. You decode symbols from the subconscious mind.
Your tone is ethereal and psychological (Jungian style). You explain what the dream symbols represent in the user's waking life.`,

  // Default
  default: `You are an experienced, intuitive fortune teller. Your goal is to provide hope, clarity, and guidance.`
};

export class FortunePromptBuilder {
  static buildSystemPrompt(ctx: FortuneContext, personaOverride?: string): string {
    const typeKey = this.normalizeType(ctx.fortuneType);
    const persona = personaOverride || PERSONAS[typeKey] || PERSONAS.default;
    
    let languageInstruction = "";
    const lang = ctx.language ? ctx.language.toLowerCase() : "tr";

    switch (true) {
      case lang.startsWith("tr"):
        languageInstruction = "ÇIKTI DİLİ: TÜRKÇE. (Kesinlikle Türkçe yanıt ver). Üslubun samimi, 'Canım', 'Bakıyorum da...', 'Yüreğin kabarmış' gibi geleneksel falcı ağzına yakın ama profesyonel olsun.";
        break;
      case lang.startsWith("en"):
        languageInstruction = "OUTPUT LANGUAGE: ENGLISH. Use a mystical, engaging tone. You are a wise fortune teller. Use phrases like 'I see...', ' The cards reveal...'.";
        break;
      case lang.startsWith("de"):
        languageInstruction = "AUSGABESPRACHE: DEUTSCH. Antworte in einem mystischen, aber professionellen Ton. Du bist eine weise Wahrsagerin. Benutze Phrasen wie 'Ich sehe...', 'Die Karten offenbaren...'.";
        break;
      case lang.startsWith("fr"):
        languageInstruction = "LANGUE DE SORTIE : FRANÇAIS. Utilisez un ton mystique et engageant. Vous êtes une voyante sage.";
        break;
      case lang.startsWith("es"):
        languageInstruction = "IDIOMA DE SALIDA: ESPAÑOL. Usa un tono místico y cautivador. Eres una adivina sabia.";
        break;
      case lang.startsWith("az"):
        languageInstruction = "ÇIXIŞ DİLİ: AZƏRBAYCAN TÜRKCƏSİ. Səmimi və peşəkar falçı tonunda danış. 'Canım', 'Baxıram ki...' kimi ifadələr işlət.";
        break;
      default:
        languageInstruction = `OUTPUT LANGUAGE: ${lang.toUpperCase()}. Translate your mystical persona to this language. Be wise and professional.`;
    }

    return `${persona}
    
${languageInstruction}

CORE RULES:
1. Be authentic. Do not say "I am an AI". Act as the persona.
2. If images are provided, YOU MUST REFERENCE THEM. (e.g., "Fincanının dibinde gördüğüm bu kuş...", "Elindeki hayat çizgisinin derinliği...").
3. Use the user's provided context (Zodiac, Job, etc.) to personalize the reading.
4. Structure your response nicely with paragraphs. Do not use Markdown headers like '##'. Use mystical separators if needed.`;
  }

  static buildUserMessage(ctx: FortuneContext): string {
    let message = `Please interpret my fortune. Here are my details:
    
- **Fortune Type:** ${ctx.fortuneType}
- **Zodiac Sign:** ${ctx.userZodiac || "Unknown"}
- **Gender:** ${ctx.userGender || "Not specified"}
- **Job/Career:** ${ctx.userJob || "Not specified"}
- **Relationship Status:** ${ctx.userRelation || "Not specified"}
- **My Question/Note:** "${ctx.userNote || "No specific question."}"`;

    // Handle Specific Metadata (Tarot Cards etc.)
    if (ctx.metadata) {
      if (ctx.metadata.selected_cards && Array.isArray(ctx.metadata.selected_cards) && ctx.metadata.selected_cards.length > 0) {
        message += `\n\n**SELECTED CARDS (The Spread):**\n${ctx.metadata.selected_cards.map((c: string, i: number) => `${i+1}. ${c}`).join("\n")}`;
        message += `\n\nAnalyze these specific cards and their positions in the spread regarding my question.`;
      }
      
      if (ctx.metadata.category) {
        message += `\n- **Focus Category:** ${ctx.metadata.category}`;
      }
    }

    if (ctx.imageCount && ctx.imageCount > 0) {
      message += `\n\nI have visually attached ${ctx.imageCount} images of my cup/hand/spread. Look at them closely. Describe what you see in the images to prove you are really reading them.`;
    }

    if (ctx.language) {
      message += `\n\nIMPORTANT: Please write your response in the language code: "${ctx.language}".`;
    }

    return message;
  }

  public static normalizeType(type: string): string {
    const t = type.toLowerCase();
    if (t.includes("kahve") || t.includes("coffee")) return "coffee";
    if (t.includes("tarot")) return "tarot";
    if (t.includes("el") || t.includes("palm")) return "palm";
    if (t.includes("katina") || t.includes("ask") || t.includes("love")) return "katina";
    if (t.includes("ruya") || t.includes("dream")) return "dream";
    return "default";
  }
}
