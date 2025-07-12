import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  parent_id: string;
  parent_email?: string;
}

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
}

interface MissingVideoInfo {
  child: Child;
  missingTemplates: VideoTemplate[];
  lastVideoDate?: string;
}

interface MissingVideoTrackerProps {
  videoType: string; // 'lullaby', 'letter-hunt', 'name-video', etc.
  templateName: string; // Human readable name like "Lullaby Video", "Letter Hunt", etc.
  className?: string;
  onChildSelect?: (child: Child) => void;
}

export const MissingVideoTracker: React.FC<MissingVideoTrackerProps> = ({
  videoType,
  templateName,
  className = '',
  onChildSelect
}) => {
  const [childrenMissingVideos, setChildrenMissingVideos] = useState<MissingVideoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchChildrenMissingVideos();
  }, [videoType]);

  const fetchChildrenMissingVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the new video assignments API
      console.log(`🔄 Fetching assignments for ${templateName} (${videoType})...`);
      const apiUrl = `/api/admin/video-assignments?templateType=${videoType}`;
      console.log(`📡 API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📋 API Response:`, data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch assignment data');
      }

      console.log(`📊 Checking assignments for ${templateName}:`, data);

      // Transform the data to match our interface
      const missingVideos: MissingVideoInfo[] = data.childrenMissingVideos.map((child: any) => ({
        child: {
          id: child.id,
          name: child.name,
          age: child.age,
          primary_interest: child.primary_interest,
          parent_id: '', // Not needed for this component
          parent_email: child.parent_email
        },
        missingTemplates: [{
          id: videoType,
          name: templateName,
          description: child.missingReason
        }],
        lastVideoDate: child.assigned_at
      }));

      console.log(`⚠️ Found ${missingVideos.length} children needing attention for ${templateName}`);
      setChildrenMissingVideos(missingVideos);

    } catch (error) {
      console.error('Error checking video assignments:', error);
      
      // Fallback: Get basic children data directly from Supabase
      try {
        console.log('📋 Attempting fallback: Loading children directly from database...');
        const { data: children, error: childrenError } = await supabase
          .from('children')
          .select('id, name, age, primary_interest, parent_id')
          .order('name');
        
        if (childrenError) {
          throw childrenError;
        }
        
        if (children && children.length > 0) {
          // Show all children as potentially needing this video type
          const fallbackData: MissingVideoInfo[] = children.map((child: any) => ({
            child: {
              id: child.id,
              name: child.name,
              age: child.age,
              primary_interest: child.primary_interest,
              parent_id: child.parent_id,
              parent_email: undefined
            },
            missingTemplates: [{
              id: videoType,
              name: templateName,
              description: `Potentially needs ${templateName} (assignment data unavailable)`
            }],
            lastVideoDate: undefined
          }));
          
          setChildrenMissingVideos(fallbackData);
          setError(`Assignment tracking unavailable, showing all children. Original error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } else {
          setError('No children found in database');
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setError(`Failed to load children data: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChildClick = (child: Child) => {
    if (onChildSelect) {
      onChildSelect(child);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-800">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (childrenMissingVideos.length === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="text-green-800">
          ✅ All children have recent {templateName} videos!
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div className="text-yellow-800 font-semibold">
            ⚠️ {childrenMissingVideos.length} children missing {templateName} videos
          </div>
          <div className="text-yellow-700 text-sm">
            Click to {expanded ? 'hide' : 'show'} details
          </div>
        </div>
        <div className="text-yellow-600">
          {expanded ? '▼' : '▶'}
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-yellow-200 p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {childrenMissingVideos.map((info, index) => (
              <div 
                key={info.child.id}
                className={`bg-white border border-yellow-200 rounded p-3 ${
                  onChildSelect ? 'cursor-pointer hover:bg-yellow-50' : ''
                }`}
                onClick={() => handleChildClick(info.child)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {info.child.name}
                      <span className="text-gray-500 text-sm ml-2">
                        (age {info.child.age}, {info.child.primary_interest})
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm">
                      {info.child.parent_email}
                    </div>
                    {info.lastVideoDate && (
                      <div className="text-yellow-600 text-xs mt-1">
                        Last video: {new Date(info.lastVideoDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {onChildSelect && (
                    <div className="text-blue-600 text-sm">
                      Select →
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-yellow-200">
            <button
              onClick={fetchChildrenMissingVideos}
              className="text-yellow-700 text-sm hover:text-yellow-800"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissingVideoTracker;
