import 'dotenv/config';

async function listAvailableModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  console.log('Available models:');
  for (const model of data.models) {
    console.log({
      name: model.name,
      displayName: model.displayName,
      supportedMethods: model.supportedGenerationMethods,
    });
  }
}

listAvailableModels().catch(console.error);

// Available models:
// {
//   name: 'models/gemini-2.5-flash',
//   displayName: 'Gemini 2.5 Flash',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-2.5-pro',
//   displayName: 'Gemini 2.5 Pro',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-2.0-flash',
//   displayName: 'Gemini 2.0 Flash',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-2.0-flash-001',
//   displayName: 'Gemini 2.0 Flash 001',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-2.0-flash-exp-image-generation',
//   displayName: 'Gemini 2.0 Flash (Image Generation) Experimental',
//   supportedMethods: [ 'generateContent', 'countTokens', 'bidiGenerateContent' ]
// }
// {
//   name: 'models/gemini-2.0-flash-lite-001',
//   displayName: 'Gemini 2.0 Flash-Lite 001',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-2.0-flash-lite',
//   displayName: 'Gemini 2.0 Flash-Lite',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-2.5-flash-preview-tts',
//   displayName: 'Gemini 2.5 Flash Preview TTS',
//   supportedMethods: [ 'countTokens', 'generateContent' ]
// }
// {
//   name: 'models/gemini-2.5-pro-preview-tts',
//   displayName: 'Gemini 2.5 Pro Preview TTS',
//   supportedMethods: [ 'countTokens', 'generateContent', 'batchGenerateContent' ]
// }
// {
//   name: 'models/gemma-3-1b-it',
//   displayName: 'Gemma 3 1B',
//   supportedMethods: [ 'generateContent', 'countTokens' ]
// }
// {
//   name: 'models/gemma-3-4b-it',
//   displayName: 'Gemma 3 4B',
//   supportedMethods: [ 'generateContent', 'countTokens' ]
// }
// {
//   name: 'models/gemma-3-12b-it',
//   displayName: 'Gemma 3 12B',
//   supportedMethods: [ 'generateContent', 'countTokens' ]
// }
// {
//   name: 'models/gemma-3-27b-it',
//   displayName: 'Gemma 3 27B',
//   supportedMethods: [ 'generateContent', 'countTokens' ]
// }
// {
//   name: 'models/gemma-3n-e4b-it',
//   displayName: 'Gemma 3n E4B',
//   supportedMethods: [ 'generateContent', 'countTokens' ]
// }
// {
//   name: 'models/gemma-3n-e2b-it',
//   displayName: 'Gemma 3n E2B',
//   supportedMethods: [ 'generateContent', 'countTokens' ]
// }
// {
//   name: 'models/gemini-flash-latest',
//   displayName: 'Gemini Flash Latest',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-flash-lite-latest',
//   displayName: 'Gemini Flash-Lite Latest',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-pro-latest',
//   displayName: 'Gemini Pro Latest',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-2.5-flash-lite',
//   displayName: 'Gemini 2.5 Flash-Lite',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-2.5-flash-image',
//   displayName: 'Nano Banana',
//   supportedMethods: [ 'generateContent', 'countTokens', 'batchGenerateContent' ]
// }
// {
//   name: 'models/gemini-2.5-flash-lite-preview-09-2025',
//   displayName: 'Gemini 2.5 Flash-Lite Preview Sep 2025',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-3-pro-preview',
//   displayName: 'Gemini 3 Pro Preview',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-3-flash-preview',
//   displayName: 'Gemini 3 Flash Preview',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-3.1-pro-preview',
//   displayName: 'Gemini 3.1 Pro Preview',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-3.1-pro-preview-customtools',
//   displayName: 'Gemini 3.1 Pro Preview Custom Tools',
//   supportedMethods: [
//     'generateContent',
//     'countTokens',
//     'createCachedContent',
//     'batchGenerateContent'
//   ]
// }
// {
//   name: 'models/gemini-3-pro-image-preview',
//   displayName: 'Nano Banana Pro',
//   supportedMethods: [ 'generateContent', 'countTokens', 'batchGenerateContent' ]
// }
// {
//   name: 'models/nano-banana-pro-preview',
//   displayName: 'Nano Banana Pro',
//   supportedMethods: [ 'generateContent', 'countTokens', 'batchGenerateContent' ]
// }
// {
//   name: 'models/gemini-3.1-flash-image-preview',
//   displayName: 'Nano Banana 2',
//   supportedMethods: [ 'generateContent', 'countTokens', 'batchGenerateContent' ]
// }
// {
//   name: 'models/gemini-robotics-er-1.5-preview',
//   displayName: 'Gemini Robotics-ER 1.5 Preview',
//   supportedMethods: [ 'generateContent', 'countTokens' ]
// }
// {
//   name: 'models/gemini-2.5-computer-use-preview-10-2025',
//   displayName: 'Gemini 2.5 Computer Use Preview 10-2025',
//   supportedMethods: [ 'generateContent', 'countTokens' ]
// }
// {
//   name: 'models/deep-research-pro-preview-12-2025',
//   displayName: 'Deep Research Pro Preview (Dec-12-2025)',
//   supportedMethods: [ 'generateContent', 'countTokens' ]
// }
// {
//   name: 'models/gemini-embedding-001',
//   displayName: 'Gemini Embedding 001',
//   supportedMethods: [
//     'embedContent',
//     'countTextTokens',
//     'countTokens',
//     'asyncBatchEmbedContent'
//   ]
// }
// {
//   name: 'models/aqa',
//   displayName: 'Model that performs Attributed Question Answering.',
//   supportedMethods: [ 'generateAnswer' ]
// }
// {
//   name: 'models/imagen-4.0-generate-001',
//   displayName: 'Imagen 4',
//   supportedMethods: [ 'predict' ]
// }
// {
//   name: 'models/imagen-4.0-ultra-generate-001',
//   displayName: 'Imagen 4 Ultra',
//   supportedMethods: [ 'predict' ]
// }
// {
//   name: 'models/imagen-4.0-fast-generate-001',
//   displayName: 'Imagen 4 Fast',
//   supportedMethods: [ 'predict' ]
// }
// {
//   name: 'models/veo-2.0-generate-001',
//   displayName: 'Veo 2',
//   supportedMethods: [ 'predictLongRunning' ]
// }
// {
//   name: 'models/veo-3.0-generate-001',
//   displayName: 'Veo 3',
//   supportedMethods: [ 'predictLongRunning' ]
// }
// {
//   name: 'models/veo-3.0-fast-generate-001',
//   displayName: 'Veo 3 fast',
//   supportedMethods: [ 'predictLongRunning' ]
// }
// {
//   name: 'models/veo-3.1-generate-preview',
//   displayName: 'Veo 3.1',
//   supportedMethods: [ 'predictLongRunning' ]
// }
// {
//   name: 'models/veo-3.1-fast-generate-preview',
//   displayName: 'Veo 3.1 fast',
//   supportedMethods: [ 'predictLongRunning' ]
// }
// {
//   name: 'models/gemini-2.5-flash-native-audio-latest',
//   displayName: 'Gemini 2.5 Flash Native Audio Latest',
//   supportedMethods: [ 'countTokens', 'bidiGenerateContent' ]
// }
// {
//   name: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
//   displayName: 'Gemini 2.5 Flash Native Audio Preview 09-2025',
//   supportedMethods: [ 'countTokens', 'bidiGenerateContent' ]
// }
// {
//   name: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
//   displayName: 'Gemini 2.5 Flash Native Audio Preview 12-2025',
//   supportedMethods: [ 'countTokens', 'bidiGenerateContent' ]
// }
