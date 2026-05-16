import "dotenv/config";
import textToSpeech from "@google-cloud/text-to-speech";
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from "stream";
const VOICE_MAP = {
    "en-female-soft": "en-IN-Neural2-D",
    "en-female-warm": "en-IN-Neural2-A",
    "en-female-bright": "en-IN-Neural2-A",
    "en-female-deep": "en-IN-Neural2-D",
    "en-male-deep": "en-IN-Neural2-C",
    "en-male-storyteller": "en-IN-Neural2-B",
    "en-male-calm": "en-IN-Neural2-B",
    "en-male-rich": "en-IN-Neural2-C",
    "hi-female-soft": "hi-IN-Neural2-D",
    "hi-female-warm": "hi-IN-Neural2-A",
    "hi-female-bright": "hi-IN-Neural2-A",
    "hi-female-deep": "hi-IN-Neural2-D",
    "hi-male-deep": "hi-IN-Neural2-C",
    "hi-male-storyteller": "hi-IN-Neural2-B",
    "hi-male-calm": "hi-IN-Neural2-B",
    "hi-male-rich": "hi-IN-Neural2-C",
};
const DEFAULT_VOICE = "en-female-soft";
const MAX_CHARACTERS = 5000;
const ttsClient = new textToSpeech.v1beta1.TextToSpeechClient();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
async function uploadAudioToCloudinary(audioBuffer, storyId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            resource_type: "video",
            folder: "sunkar-audio",
            public_id: `story_${storyId}`,
            format: "mp3",
            overwrite: true
        }, (error, result) => {
            if (error || !result) {
                reject(error || new Error("cloudinary upload failed"));
                return;
            }
            resolve(result.secure_url);
        });
        const readable = new Readable();
        readable.push(audioBuffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
}
export async function generateAndUploadAudio(storyText, voiceModel, storyId) {
    if (storyText.length > MAX_CHARACTERS) {
        throw new Error(`Story too Long. Max character Allowed is ${MAX_CHARACTERS}`);
    }
    const voiceName = VOICE_MAP[voiceModel] ?? VOICE_MAP[DEFAULT_VOICE] ?? "en-IN-Neural2-D";
    const [response] = await ttsClient.synthesizeSpeech({
        input: { text: storyText },
        voice: {
            languageCode: voiceName.startsWith("hi-IN") ? "hi-IN" : "en-IN",
            name: voiceName
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            volumeGainDb: 1.0,
        }
    });
    const audioBuffer = Buffer.from(response.audioContent);
    const audioUrl = await uploadAudioToCloudinary(audioBuffer, storyId);
    return audioUrl;
}
//# sourceMappingURL=audioService.js.map