import { CactusLM } from 'cactus-react-native';

/**
 * Model Manager - Handles loading and caching AI models
 * 
 * Models are available in assets/models/ but Cactus SDK downloads models on first use.
 * Total size: ~1.5GB (liquid-lfm: 697MB, qwen2.5: 469MB, echo-lnn: 219MB, audio: 74MB)
 * 
 * Note: The SDK's download() method fetches from Cactus CDN, not from bundled assets.
 * For demo purposes, we'll use the default models.
 */

const MODEL_CONFIGS = {
  vision: {
    model: 'lfm2-vl-450m', // Vision-capable model for image analysis
  },
  audio: {
    model: 'whisper-small', // Audio transcription (use CactusSTT)
  },
  triage: {
    model: 'qwen3-0.6', // Default small LLM for triage/recommendations
  },
  echoLNN: {
    model: 'qwen3-0.6', // Fallback to LLM for time-series (Echo-LNN not in SDK)
  },
};

export type ModelType = keyof typeof MODEL_CONFIGS;

class ModelManager {
  private loadedModels: Map<ModelType, CactusLM> = new Map();
  private downloadedModels: Set<ModelType> = new Set();

  /**
   * Load a model using Cactus SDK
   * Models are downloaded on first use and cached thereafter
   */
  async loadModel(modelType: ModelType, cactusConfig?: any): Promise<CactusLM | null> {
    if (this.loadedModels.has(modelType)) {
      console.log(`♻️ Using cached ${modelType} model`);
      return this.loadedModels.get(modelType)!;
    }

    try {
      console.log(`📦 Initializing ${modelType} model...`);
      const config = MODEL_CONFIGS[modelType];
      
      // Create CactusLM instance
      const lm = new CactusLM({
        model: config.model,
        contextSize: cactusConfig?.contextSize || 2048,
      });
      
      // Download model if not already downloaded
      if (!this.downloadedModels.has(modelType)) {
        console.log(`⬇️ Downloading ${modelType} model (${config.model})...`);
        await lm.download({
          onProgress: (progress) => {
            if (progress % 0.1 < 0.01) { // Log every 10%
              console.log(`📥 ${modelType}: ${Math.round(progress * 100)}%`);
            }
          },
        });
        this.downloadedModels.add(modelType);
        console.log(`✅ ${modelType} model downloaded`);
      }
      
      // Initialize the model for inference
      console.log(`🚀 Initializing ${modelType} for inference...`);
      await lm.init();
      
      this.loadedModels.set(modelType, lm);
      console.log(`✅ ${modelType} model ready for use`);
      
      return lm;
    } catch (error) {
      console.error(`❌ Failed to load ${modelType} model:`, error);
      console.log(`⚠️ Falling back to mock data for ${modelType}`);
      return null;
    }
  }

  /**
   * Unload a specific model to free memory
   */
  async unloadModel(modelType: ModelType): Promise<void> {
    const model = this.loadedModels.get(modelType);
    if (model) {
      await model.destroy();
    }
    this.loadedModels.delete(modelType);
    console.log(`🗑️ ${modelType} model unloaded`);
  }

  /**
   * Unload all models
   */
  async unloadAll(): Promise<void> {
    const entries = Array.from(this.loadedModels.entries());
    for (const [modelType, model] of entries) {
      if (model) {
        await model.destroy();
      }
    }
    this.loadedModels.clear();
    console.log('🗑️ All models unloaded');
  }

  /**
   * Check if a model is loaded
   */
  isLoaded(modelType: ModelType): boolean {
    return this.loadedModels.has(modelType);
  }
}

export const modelManager = new ModelManager();
