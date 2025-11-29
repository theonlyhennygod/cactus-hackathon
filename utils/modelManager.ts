import { CactusLM } from 'cactus-react-native';

/**
 * Model Manager - Handles loading and caching AI models
 * 
 * ⚠️ NOTE: Model files are 1.5GB total and too large to bundle in the app.
 * 
 * For this demo, we'll use mock/fallback AI responses since actual model loading
 * requires either:
 * 1. Downloading models from a CDN on first launch
 * 2. Using a smaller quantized model that CAN be bundled
 * 3. Running models on a server instead of on-device
 * 
 * The infrastructure is here and ready - just needs the models to be available.
 */

const MODEL_CONFIGS = {
  vision: {
    filename: 'liquid-lfm-small.gguf',
  },
  audio: {
    filename: 'audio-classifier.gguf',
  },
  triage: {
    filename: 'qwen2.5-0.5b-q4.gguf',
  },
  echoLNN: {
    filename: 'echo-lnn.gguf',
  },
};

export type ModelType = keyof typeof MODEL_CONFIGS;

class ModelManager {
  private loadedModels: Map<ModelType, any> = new Map();

  /**
   * Load a model using Cactus SDK
   * 
   * For now, this returns null and agents should use fallback logic.
   * In production, this would load models from FileSystem.documentDirectory
   */
  async loadModel(modelType: ModelType, cactusConfig?: any): Promise<CactusLM | null> {
    if (this.loadedModels.has(modelType)) {
      console.log(`♻️ Using cached ${modelType} model`);
      return this.loadedModels.get(modelType)!;
    }

    console.warn(`⚠️ Model loading not implemented for ${modelType} - using fallback`);
    console.log(`ℹ️  To enable on-device AI, implement model download/caching in ModelManager`);
    
    // Return null to signal agents to use fallback logic
    return null;
  }

  /**
   * Unload a specific model to free memory
   */
  async unloadModel(modelType: ModelType): Promise<void> {
    const model = this.loadedModels.get(modelType);
    if (model && model.unload) {
      await model.unload();
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
      if (model && model.unload) {
        await model.unload();
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
