import "dotenv/config";

import textToSpeech from "@google-cloud/text-to-speech";
import {v2 as cloudinary} from 'cloudinary';
import { Readable } from "stream";

// ── Debug logs — remove after confirming it works ────
console.log("Cloudinary Cloud:",  process.env.CLOUDINARY_CLOUD_NAME);
console.log("Cloudinary Key:",    process.env.CLOUDINARY_API_KEY);
console.log("Cloudinary Secret:", process.env.CLOUDINARY_API_SECRET);

const VOICE_MAP: Record <string, string> = {
 "warm-female":  "en-IN-Neural2-D",
  "deep-male":    "en-IN-Neural2-B",
  "storyteller":  "en-IN-Neural2-C",
  "energetic":    "en-IN-Neural2-A",
}

const DEFAULT_VOICE = "en-IN-Neural2-D";

const MAX_CHARACTERS = 5000;

const ttsClient = new textToSpeech.TextToSpeechClient();

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key:    process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// })

async function uploadAudioToCloudinary(
    audioBuffer: Buffer,
    storyId: string
): Promise<string> {

      cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

    console.log("☁️  Configuring Cloudinary with:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
return new Promise ((resolve, reject)=>{
    const uploadStream = cloudinary.uploader.upload_stream(
        {
            resource_type: "video",
            folder: "sunkar-audio",
            public_id: `story_${storyId}`,
            format: "mp3",
            overwrite: true
        },
        (error, result) =>{
            if(error || !result){
                reject(error || new Error("cloudinary upload failed"));
                return
            }
            resolve(result.secure_url)
        }
    );

    //convert buffer to readable stream and pipe to cloudinary
    const readable = new Readable();
    readable.push(audioBuffer);
    readable.push(null);
    readable.pipe(uploadStream)
})
}

//--- main Export ----

//convert story text to audio using google tts and uploads to cloudinary

export async function generateAndUploadAudio(
    storyText: string,
    voiceModel: string,
    storyId: string
): Promise<string> {
    if(storyText. length > MAX_CHARACTERS){
        throw new Error(
            `Story too Long. Max character Allowed is ${MAX_CHARACTERS}`
        );
    }
    const voiceName = VOICE_MAP[voiceModel] || DEFAULT_VOICE;

    const [response] = await ttsClient.synthesizeSpeech({
        input: {text: storyText},
        voice: {
            languageCode: 'en-IN',
            name: voiceName
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.88,
            pitch: -1.0,
            volumeGainDb: 1.0,
            effectsProfileId: ["headphone-class-device"],
        }
    })

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
    const audioUrl = await uploadAudioToCloudinary(audioBuffer, storyId);
    return audioUrl;
}