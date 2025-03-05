/**
 * OpenAI Provider
 * 
 * This file exports the OpenAI client and related utilities.
 */

import OpenAI from 'openai';
import { openAIConfig } from '../../config';

// Initialize the OpenAI client
export const openai = new OpenAI({
  apiKey: openAIConfig.apiKey,
  organization: openAIConfig.organization,
});

export * from './chat';
export * from './embeddings';
