import { CactusLM } from 'cactus-react-native';

/**
 * Model Manager - Handles loading and caching AI models using Cactus SDK
 * 
 * Uses on-device inference for privacy and offline capability.
 * Models are downloaded once and cached locally.
 */

// Model configurations using Cactus model names
// Available models: qwen3-0.6, lfm2-vl-450m (vision), whisper-small (STT)
const MODEL_CONFIGS = {
  triage: {
    // Qwen3-0.6B - Small but capable model for wellness triage
    model: 'qwen3-0.6',
    contextSize: 2048,
  },
  vision: {
    // LFM2-VL-450m - Vision-language model for face/skin analysis
    model: 'lfm2-vl-450m',
    contextSize: 2048,
  },
  audio: {
    // Audio uses CactusSTT separately (in AudioAgent)
    model: null as string | null,
    contextSize: 1024,
  },
  echoLNN: {
    // Time-series uses signal processing, not LLM
    model: null as string | null,
    contextSize: 1024,
  },
};

export type ModelType = keyof typeof MODEL_CONFIGS;

// Download progress callback type
type ProgressCallback = (progress: number) => void;

// Model status for UI
export interface ModelStatus {
  isDownloading: boolean;
  isReady: boolean;
  progress: number;
  error: string | null;
}

class ModelManager {
  private loadedModels: Map<ModelType, CactusLM> = new Map();
  private downloadProgress: Map<ModelType, number> = new Map();
  private isDownloading: Map<ModelType, boolean> = new Map();
  private modelErrors: Map<ModelType, string> = new Map();
  private statusListeners: Set<() => void> = new Set();

  /**
   * Subscribe to model status changes
   */
  subscribe(listener: () => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notifyListeners(): void {
    this.statusListeners.forEach(listener => listener());
  }

  /**
   * Get status for all models
   */
  getAllStatus(): Record<ModelType, ModelStatus> {
    const types: ModelType[] = ['triage', 'vision', 'audio', 'echoLNN'];
    const status: Record<string, ModelStatus> = {};
    
    for (const type of types) {
      status[type] = {
        isDownloading: this.isDownloading.get(type) ?? false,
        isReady: this.loadedModels.has(type),
        progress: this.downloadProgress.get(type) ?? 0,
        error: this.modelErrors.get(type) ?? null,
      };
    }
    
    return status as Record<ModelType, ModelStatus>;
  }

  /**
   * Get current download progress for a model (0-1)
   */
  getDownloadProgress(modelType: ModelType): number {
    return this.downloadProgress.get(modelType) ?? 0;
  }

  /**
   * Check if a model is currently downloading
   */
  isModelDownloading(modelType: ModelType): boolean {
    return this.isDownloading.get(modelType) ?? false;
  }

  /**
   * Check if any model is currently downloading
   */
  isAnyDownloading(): boolean {
    return Array.from(this.isDownloading.values()).some(v => v);
  }

  /**
   * Pre-download all configured models
   */
  async preloadModels(onProgress?: (model: string, progress: number) => void): Promise<void> {
    const modelsToLoad: ModelType[] = ['triage', 'vision'];
    
    for (const modelType of modelsToLoad) {
      const config = MODEL_CONFIGS[modelType];
      if (config.model) {
        console.log('📦 Pre-loading ' + modelType + ' model...');
        await this.loadModel(modelType, {
          onProgress: (p) => onProgress?.(modelType, p),
        });
      }
    }
  }

  /**
   * Load a model using Cactus SDK with automatic download
   */
  async loadModel(modelType: ModelType, options?: { onProgress?: ProgressCallback }): Promise<CactusLM | null> {
    // Return cached model if available
    if (this.loadedModels.has(modelType)) {
      console.log('♻️ Using cached ' + modelType + ' model');
      return this.loadedModels.get(modelType)!;
    }

    const config = MODEL_CONFIGS[modelType];
    
    // Use fallback for models without model ID configured
    if (!config.model) {
      console.log('ℹ️ ' + modelType + ' using intelligent fallback (no model configured)');
      return null;
    }

    // Prevent concurrent downloads of the same model
    if (this.isDownloading.get(modelType)) {
      console.log('⏳ ' + modelType + ' model is already downloading...');
      return null;
    }

    try {
      console.log('🚀 Initializing ' + modelType + ' model: ' + config.model);
      this.isDownloading.set(modelType, true);
      this.downloadProgress.set(modelType, 0);
      this.modelErrors.delete(modelType);
      this.notifyListeners();

      // Create CactusLM instance with model name and context size
      const lm = new CactusLM({ 
        model: config.model,
        contextSize: config.contextSize || 2048,
      });

      // Download model with progress tracking
      console.log('⬇️ Downloading ' + modelType + ' model...');
      await lm.download({
        onProgress: (progress: number) => {
          this.downloadProgress.set(modelType, progress);
          if (options?.onProgress) {
            options.onProgress(progress);
          }
          this.notifyListeners();
          // Log progress at intervals
          if (Math.floor(progress * 100) % 25 === 0) {
            console.log('📥 ' + modelType + ': ' + Math.round(progress * 100) + '%');
          }
        },
      });
      
      // Initialize the model for inference (REQUIRED after download!)
      console.log('🚀 Initializing ' + modelType + ' for inference...');
      await lm.init();

      console.log('🎉 ' + modelType + ' model ready for inference!');

      // Cache the loaded model
      this.loadedModels.set(modelType, lm);
      this.isDownloading.set(modelType, false);
      this.downloadProgress.set(modelType, 1);
      this.notifyListeners();

      return lm;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      // Don't use console.error for expected failures (simulator, unsupported device)
      console.log('ℹ️ ' + modelType + ' model not available: ' + errorMsg + ' (using fallback)');
      this.isDownloading.set(modelType, false);
      this.modelErrors.set(modelType, errorMsg);
      this.notifyListeners();
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
    this.notifyListeners();
    console.log('🗑️ ' + modelType + ' model unloaded');
  }

  /**
   * Unload all models
   */
  async unloadAll(): Promise<void> {
    const entries = Array.from(this.loadedModels.entries());
    for (const [, model] of entries) {
      if (model) {
        await model.destroy();
      }
    }
    this.loadedModels.clear();
    this.notifyListeners();
    console.log('🗑️ All models unloaded');
  }

  /**
   * Check if a model is loaded
   */
  isLoaded(modelType: ModelType): boolean {
    return this.loadedModels.has(modelType);
  }

  /**
   * Get count of loaded models
   */
  getLoadedCount(): number {
    return this.loadedModels.size;
  }
}

export const modelManager = new ModelManager();
