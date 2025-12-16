
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    dangerouslyAllowBrowser: true,
});

// Initialize Gemini client
// Note: We initialize lazily or handle missing key gracefully
const geminiGenAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

export type AIModel = 'gpt-4o-mini' | 'gpt-3.5-turbo' | 'gpt-4o'; // Used for OpenAI
export type AIProvider = 'openai' | 'gemini';

export interface AIFile {
    data: Buffer | string; // Buffer or Base64 string
    mimeType: string;
}

interface AIRequestOptions<T> {
    messages: any[]; // OpenAI format: [{role: 'user', content: '...'}]
    model?: AIModel; // Used for OpenAI
    provider?: AIProvider; // Preferred provider
    temperature?: number;
    maxRetries?: number; // Note: Retries are handled internally by provider functions or by falling back to another provider
    file?: AIFile; // New: Support for file upload
    fallback?: () => T | Promise<T>;
    parser?: (text: string) => T;
}

/**
 * A robust AI Client that handles:
 * 1. Fallback between OpenAI and Gemini
 * 2. Automatic Fallback to Mock Data (if provided)
 * 3. Consistent Error Handling
 */
export const aiClient = {
    /**
     * Request a JSON response.
     * Logic: Try Primary Provider -> Try Fallback Provider (Gemini if free) -> Try Mock Fallback
     */
    async json<T>(options: AIRequestOptions<T>): Promise<T> {
        const {
            messages,
            model = 'gpt-4o-mini',
            provider = 'gemini', // Default to Gemini (Free) as requested by user
            temperature = 0.3,
            fallback,
            file, // Extract file
        } = options;

        let result: T | null = null;
        let error: any = null;

        // 1. Try Primary Provider (Gemini is best for files)
        if (provider === 'gemini') {
            try {
                result = await tryGeminiJSON<T>(messages, temperature, file); // Pass file
                if (result) return result;
            } catch (e) {
                console.warn('⚠️ Gemini Primary Failed:', e);
                error = e;
            }
        } else { // provider === 'openai'
            // OpenAI Vision support could be added here, but user wants Gemini
            // If file is present and provider is OpenAI, we might default to text-only if we didn't implement OpenAI Vision
            // But assuming text-only fallback for OpenAI logic
            try {
                result = await tryOpenAIJSON<T>(messages, model, temperature);
                if (result) return result;
            } catch (e) {
                console.warn('⚠️ OpenAI Primary Failed:', e);
                error = e;
            }
        }

        // 2. Try Fallback Provider if primary failed
        if (!result) {
            if (provider === 'gemini') { // Gemini was primary, try OpenAI as fallback
                try {
                    // Fallback to OpenAI (Text Only - we assume text was extracted elsewhere or just use prompt)
                    // If we relied on the FILE, this fallback might be weak, but better than nothing.
                    result = await tryOpenAIJSON<T>(messages, model, temperature);
                    if (result) return result;
                } catch (e) {
                    console.warn('⚠️ OpenAI Fallback Failed:', e);
                    error = e; // Keep the latest error
                }
            } else { // OpenAI was primary, try Gemini as fallback
                try {
                    result = await tryGeminiJSON<T>(messages, temperature, file);
                    if (result) return result;
                } catch (e) {
                    console.warn('⚠️ Gemini Fallback Failed:', e);
                    error = e; // Keep the latest error
                }
            }
        }

        // 3. Mock Fallback
        if (fallback) {
            console.warn('🔴 All AI Providers failed. Executing Rule-Based Fallback.');
            return fallback();
        }

        throw error || new Error('All AI providers failed and no fallback provided.');
    },

    /**
     * Request standard text response
     */
    async text(options: AIRequestOptions<string>): Promise<string> {
        const {
            messages,
            model = 'gpt-4o-mini',
            provider = 'gemini',
            temperature = 0.7,
            fallback
        } = options;

        let result: string | null = null;
        let error: any = null;

        // 1. Try Primary Provider
        if (provider === 'gemini') {
            try {
                result = await tryGeminiText(messages, temperature);
                if (result) return result;
            } catch (e) {
                console.warn('⚠️ Gemini Text Primary Failed:', e);
                error = e;
            }
        } else { // provider === 'openai'
            try {
                result = await tryOpenAIText(messages, model, temperature);
                if (result) return result;
            } catch (e) {
                console.warn('⚠️ OpenAI Text Primary Failed:', e);
                error = e;
            }
        }

        // 2. Try Fallback Provider if primary failed
        if (!result) {
            if (provider === 'gemini') { // Gemini was primary, try OpenAI as fallback
                try {
                    result = await tryOpenAIText(messages, model, temperature);
                    if (result) return result;
                } catch (e) {
                    console.warn('⚠️ OpenAI Text Fallback Failed:', e);
                    error = e;
                }
            } else { // OpenAI was primary, try Gemini as fallback
                try {
                    result = await tryGeminiText(messages, temperature);
                    if (result) return result;
                } catch (e) {
                    console.warn('⚠️ Gemini Text Fallback Failed:', e);
                    error = e;
                }
            }
        }

        // 3. Mock Fallback
        if (fallback) {
            console.warn('🔴 All AI Text Providers failed. Executing Rule-Based Fallback.');
            return fallback();
        }

        throw error || new Error('All AI text providers failed and no fallback provided.');
    }
};

// --- Helper Functions ---

async function tryOpenAIJSON<T>(messages: any[], model: string, temperature: number): Promise<T> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API Key Missing. Cannot use OpenAI.');
    }

    const response = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty OpenAI response');

    try {
        return JSON.parse(content) as T;
    } catch (e) {
        // Sometimes it returns markdown json code block
        const clean = content.replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(clean) as T;
    }
}

async function tryGeminiJSON<T>(messages: any[], temperature: number, file?: AIFile): Promise<T> {
    if (!geminiGenAI) {
        throw new Error('Gemini API Key Missing. Cannot use Gemini.');
    }

    // List of models to try in order of preference (Newest -> Oldest)
    // Based on available models: gemini-2.5-flash, gemini-2.0-flash, etc.
    const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-2.5-pro",
        "gemini-2.0-flash-001"
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[AIClient] 🤖 Trying Gemini Model: ${modelName}`);
            const model = geminiGenAI.getGenerativeModel({ model: modelName });

            const lastMessage = messages[messages.length - 1].content;
            const contextMessages = messages.slice(0, -1).map(m => m.content).join('\n');
            let fullPrompt = `${contextMessages}\n\n${lastMessage}\n\nIMPORTANT: Return ONLY raw JSON.`;

            const parts: any[] = [{ text: fullPrompt }];

            if (file) {
                let base64Data = '';
                if (Buffer.isBuffer(file.data)) {
                    base64Data = file.data.toString('base64');
                } else {
                    base64Data = file.data as string;
                }

                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: file.mimeType
                    }
                });
                console.log(`[AIClient] 📎 Attached file to Gemini request (${file.mimeType})`);
            }

            const result = await model.generateContent({
                contents: [{ role: 'user', parts }],
                generationConfig: {
                    temperature,
                    responseMimeType: "application/json",
                },
            });
            const response = await result.response;
            const text = response.text();

            try {
                const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(clean) as T;
            } catch (e) {
                // If JSON parse fails, throw to try next model or fail hard? 
                // Usually model output issue, but maybe next model is better.
                throw new Error('Failed to parse Gemini JSON: ' + text);
            }

        } catch (e: any) {
            console.warn(`[AIClient] ⚠️ Model ${modelName} failed:`, e.message?.split('\n')[0]);
            lastError = e;
            // Continue to next model
        }
    }

    throw lastError || new Error('All Gemini models failed');
}

async function tryOpenAIText(messages: any[], model: string, temperature: number): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API Key Missing. Cannot use OpenAI.');
    }
    const response = await openai.chat.completions.create({ model, messages, temperature });
    return response.choices[0].message.content || '';
}

async function tryGeminiText(messages: any[], temperature: number): Promise<string> {
    if (!geminiGenAI) {
        throw new Error('Gemini API Key Missing. Cannot use Gemini.');
    }
    const model = geminiGenAI.getGenerativeModel({ model: "gemini-pro" });

    const lastMessage = messages[messages.length - 1].content;
    const context = messages.slice(0, -1).map(m => m.content).join('\n');

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${context}\n${lastMessage}` }] }],
        generationConfig: {
            temperature,
        },
    });
    return result.response.text();
}
