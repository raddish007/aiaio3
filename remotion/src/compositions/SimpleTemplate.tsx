import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SimpleTemplateProps {
  childName: string;
  template: {
    id: string;
    name: string;
    type: string;
    global_elements: Array<{
      id: string;
      type: 'audio' | 'image';
      asset_purpose: string;
      description: string;
      required: boolean;
      asset_type: 'class' | 'specific';
      asset_class?: string;
      specific_asset_id?: string;
      specific_asset_name?: string;
    }>;
    parts: Array<{
      id: string;
      name: string;
      type: 'intro' | 'slideshow' | 'outro' | 'custom';
      order: number;
      duration: number;
      audio_elements: Array<{
        id: string;
        asset_purpose: string;
        description: string;
        required: boolean;
        asset_type: 'class' | 'specific';
        asset_class?: string;
        specific_asset_id?: string;
        specific_asset_name?: string;
      }>;
      image_elements: Array<{
        id: string;
        asset_purpose: string;
        description: string;
        safe_zone: string;
        required: boolean;
        asset_type: 'class' | 'specific';
        asset_class?: string;
        specific_asset_id?: string;
        specific_asset_name?: string;
      }>;
    }>;
  };
  assets: {
    [assetId: string]: {
      id: string;
      type: 'audio' | 'image';
      theme: string;
      file_url: string;
      tags?: string[];
      metadata?: any;
    };
  };
}

export const SimpleTemplate: React.FC<SimpleTemplateProps> = ({ 
  childName, 
  template, 
  assets 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Get global audio assets
  const globalAudioAssets = template.global_elements
    ?.filter(el => el.type === 'audio' && el.asset_type === 'specific' && el.specific_asset_id)
    .map(el => ({
      id: el.id,
      url: assets[el.specific_asset_id!]?.file_url,
      purpose: el.asset_purpose
    }))
    .filter(asset => asset.url) || [];

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Global Audio Elements */}
      {globalAudioAssets.map((audio, index) => (
        <audio
          key={audio.id}
          src={audio.url}
          autoPlay={index === 0}
          loop={audio.purpose.includes('background')}
        />
      ))}
    </AbsoluteFill>
  );
}; 