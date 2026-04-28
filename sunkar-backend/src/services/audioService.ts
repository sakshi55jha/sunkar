import "dotenv/config";

import textToSpeech from "@google-cloud/text-to-speech";
import {v2 as cloudinary} from 'cloudinary';
import { Readable } from "stream";


const VOICE_MAP: Record<string, string> = {
  // ── English (India) Premium Story Voices ──
  "en-female-soft": "en-IN-Chirp3-HD-Achernar",
  "en-female-warm": "en-IN-Chirp3-HD-Aoede",
  "en-female-bright": "en-IN-Chirp3-HD-Zephyr",
  "en-female-deep": "en-IN-Chirp3-HD-Sulafat",

  "en-male-deep": "en-IN-Chirp3-HD-Achird",
  "en-male-storyteller": "en-IN-Chirp3-HD-Sadachbia",
  "en-male-calm": "en-IN-Chirp3-HD-Orus",
  "en-male-rich": "en-IN-Chirp3-HD-Algenib",

  // ── Hindi Premium Story Voices ──
  "hi-female-soft": "hi-IN-Chirp3-HD-Achernar",
  "hi-female-warm": "hi-IN-Chirp3-HD-Aoede",
  "hi-female-bright": "hi-IN-Chirp3-HD-Zephyr",
  "hi-female-deep": "hi-IN-Chirp3-HD-Sulafat",

  "hi-male-deep": "hi-IN-Chirp3-HD-Achird",
  "hi-male-storyteller": "hi-IN-Chirp3-HD-Sadachbia",
  "hi-male-calm": "hi-IN-Chirp3-HD-Orus",
  "hi-male-rich": "hi-IN-Chirp3-HD-Algenib",
};

const DEFAULT_VOICE = "en-female-soft";

const MAX_CHARACTERS = 5000;

const ttsClient = new textToSpeech.TextToSpeechClient();

    cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadAudioToCloudinary(
    audioBuffer: Buffer,
    storyId: string
): Promise<string> {


  
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
  
     const voiceName = VOICE_MAP[voiceModel] || VOICE_MAP[DEFAULT_VOICE];
    const [response] = await ttsClient.synthesizeSpeech({
        input: {text: storyText},
        voice: {
            languageCode: voiceName.startsWith("hi-IN") ? "hi-IN" : "en-IN",
            name: voiceName
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.88,
            volumeGainDb: 1.0,
            
        }
    })

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
    const audioUrl = await uploadAudioToCloudinary(audioBuffer, storyId);
    return audioUrl;
}