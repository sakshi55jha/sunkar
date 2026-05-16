export declare function uploadImageToCloudinary(base64Image: string, storyId: string): Promise<string>;
export declare function generateUploadSignature(): {
    signature: string;
    timestamp: number;
    folder: string;
    cloudName: string;
    apiKey: string;
};
//# sourceMappingURL=imageService.d.ts.map