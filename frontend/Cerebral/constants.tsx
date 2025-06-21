
import React from 'react';
import * as THREE from 'three';
import { BrainSectionId, BrainSectionConfig } from './types.ts';

export const BRAIN_SECTION_CONFIGS: BrainSectionConfig[] = [
  {
    id: BrainSectionId.FRONTAL_LOBE,
    name: 'Short-term Memory',
    memoryType: 'Short-term Memory',
    position: new THREE.Vector3(0, 1.2, 0.7), // Fallback position if GLB mesh not found
    color: '#FF6B6B', 
    highlightColor: '#FF3B3B',
    description: 'Holds a small amount of information in an active, readily available state for a short period. Essential for immediate tasks and processing.'
  },
  {
    id: BrainSectionId.TEMPORAL_LOBE,
    name: 'Long-term Memory',
    memoryType: 'Long-term Memory',
    position: new THREE.Vector3(-1.0, -0.2, 0.8), // Fallback position
    color: '#4ECDC4', 
    highlightColor: '#2DBFBF',
    description: 'Stores vast amounts of information for an extended period, from days to years. Includes explicit (declarative) and implicit (procedural) memories.'
  },
  {
    id: BrainSectionId.PARIETAL_LOBE,
    name: 'Working Memory',
    memoryType: 'Working Memory',
    position: new THREE.Vector3(1.0, -0.2, 0.8), // Fallback position
    color: '#45B7D1', 
    highlightColor: '#27A0C0',
    description: 'A system for temporarily storing and managing information required to carry out complex cognitive tasks such as learning, reasoning, and comprehension.'
  },
  {
    id: BrainSectionId.OCCIPITAL_LOBE,
    name: 'Personal Memory',
    memoryType: 'Episodic & Autobiographical Memory',
    position: new THREE.Vector3(0, 0.8, -1.2), // Fallback position
    color: '#F7B801', 
    highlightColor: '#E0A000',
    description: 'Stores personal experiences and specific events in time, forming the autobiographical record of an individual. Includes emotions and contextual details.'
  },
  {
    id: BrainSectionId.CEREBELLUM,
    name: 'Central Storage',
    memoryType: 'General Cognitive Archive',
    position: new THREE.Vector3(0, -1.2, -0.8), // Fallback position
    color: '#9A61B2', 
    highlightColor: '#804F96',
    description: 'Represents a centralized repository for various types of processed information and learned skills, accessible for recall and application.'
  },
];

export const MODEL_PATH = './brain/brainmodel.glb'; // Updated path for the GLB model

// SVG Icons

// Moved IconDocumentText up
export const IconDocumentText = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export const IconUpload = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const IconLink = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

export const IconPencilSquare = (props: React.SVGProps<SVGSVGElement>) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

export const IconTrash = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.171m0 0c-.316.05-.612.098-.882.143m0 0l-1.996 1.43L2.25 9m14.344 0L18 9m0 0l2.25 2.25M12 12m-2.25 2.25a2.25 2.25 0 000 4.5 2.25 2.25 0 000-4.5zm0 0V9m0 0A2.25 2.25 0 009.75 6.75 2.25 2.25 0 0012 9zm0 0h.008v.008H12V9z" />
  </svg>
);

export const IconXCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconPhoto = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);
