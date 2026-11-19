export const ENV = {
    get GEMINI_API_KEY(): string {
        let key = "";
        try {
            // @ts-ignore
            key = GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
        } catch (e) {
            // @ts-ignore
            key = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
        }

        if (!key || key === "" || key.includes("PLACEHOLDER")) {
            throw new Error("CHAVE NÃO ENCONTRADA NO BUILD. Verifique se o nome na Vercel é exatamente GEMINI_API_KEY.");
        }
        
        return key;
    },

    get GEMINI_TEXT_MODEL(): string {
        try {
            // @ts-ignore
            return process.env.GEMINI_TEXT_MODEL || "gemini-4-argon";
        } catch (e) {
            return "gemini-4-argon";
        }
    },

    get GEMINI_SUPPORT_MODEL(): string {
        try {
            // @ts-ignore
            return process.env.GEMINI_SUPPORT_MODEL || "gemini-4-argon";
        } catch (e) {
            return "gemini-4-argon";
        }
    },

    get GEMINI_SUPPORT_FALLBACK_MODEL(): string {
        try {
            // @ts-ignore
            return process.env.GEMINI_SUPPORT_FALLBACK_MODEL || "gemini-3.1-pro-preview";
        } catch (e) {
            return "gemini-3.1-pro-preview";
        }
    }
};
