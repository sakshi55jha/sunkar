type Intent = "story" | "chat" | "suggest" | "continue" | "off_topic";
export declare function addToHistory(sessionId: string, role: "user" | "model", text: string): void;
export declare function clearSession(sessionId: string): void;
export declare function executeSunkarPipelineStream(prompt: string, sessionId?: string): AsyncGenerator<{
    type: string;
    data: string;
} | {
    type: string;
    data: {
        storyId: string;
        finishReason: string;
        intent: Intent;
        wordCount: number;
        wasTruncated: boolean;
        messageCount: number;
    };
}, void, unknown>;
export {};
//# sourceMappingURL=aiService.d.ts.map