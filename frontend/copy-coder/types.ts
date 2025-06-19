
export interface AppState {
  selectedImageFile: File | null;
  imagePreviewUrl: string | null;
  generatedUiCode: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  apiKeyExists: boolean;
}

export interface ImageMimeData {
  base64Data: string;
  mimeType: string;
}
