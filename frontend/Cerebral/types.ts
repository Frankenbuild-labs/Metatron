
import * as THREE from 'three';

export enum BrainSectionId {
  FRONTAL_LOBE = 'FRONTAL_LOBE',
  TEMPORAL_LOBE = 'TEMPORAL_LOBE',
  PARIETAL_LOBE = 'PARIETAL_LOBE',
  OCCIPITAL_LOBE = 'OCCIPITAL_LOBE',
  CEREBELLUM = 'CEREBELLUM',
}

export interface BrainSectionConfig {
  id: BrainSectionId;
  name: string;
  memoryType: string;
  position: THREE.Vector3; // For placeholder spheres
  color: THREE.ColorRepresentation;
  highlightColor: THREE.ColorRepresentation;
  description: string;
}

export interface UploadedItem {
  id: string; // Unique ID for the item
  name: string; // File name or URL display name
  url: string; // Data URL for images, or the input URL, or a placeholder for docs
  file?: File; // Original file object, if applicable
  type: 'image' | 'document' | 'url' | 'note';
  noteContent?: string; // For notes
}

export interface SectionContent {
  items: UploadedItem[];
}

export type BrainDataState = Record<BrainSectionId, SectionContent>;

export type OptionalBrainSectionId = BrainSectionId | null;
