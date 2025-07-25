import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import AudioPlayer from '@/components/admin/AudioPlayer';
import AdminHeader from '@/components/AdminHeader';

interface Asset {
  id: string;
  title?: string; // Add title field at top level
  theme: string;
  type: 'image' | 'audio' | 'video' | 'prompt';
  status: 'pending' | 'approved' | 'rejected';
  file_url?: string;
  prompt?: string;
  tags?: string[];
  created_at: string;
  metadata?: {
    title?: string;
    description?: string;
    project_id?: string;
    prompt?: string;
    personalization?: 'general' | 'personalized';
    child_name?: string;
    template?: 'lullaby' | 'name-video' | 'letter-hunt' | 'general';
    volume?: number; // Added volume to metadata interface
    audio_data?: string; // Added audio_data for base64 audio content
    script?: string; // Added script for audio content
    voice?: string; // Added voice for audio content
    speed?: number; // Added speed for audio content
    audio_class?: string; // Added audio_class for audio assets
    duration?: number; // Added duration for audio/video assets
    template_context?: {
      template_type?: string;
      asset_purpose?: string;
      child_name?: string;
      template_specific?: boolean;
    };
    review?: {
      safe_zone?: ('left_safe' | 'right_safe' | 'center_safe' | 'intro_safe' | 'outro_safe' | 'all_ok' | 'not_applicable')[];
      approval_notes?: string;
      rejection_reason?: string;
      reviewed_at?: string;
      reviewed_by?: string;
    };
    letter?: string; // Added letter to metadata interface
    // Enhanced metadata for prompt generation context
    imageType?: 'titleCard' | 'signImage' | 'bookImage' | 'groceryImage' | 'endingImage' | 'characterImage' | 'sceneImage';
    artStyle?: string;
    aspectRatio?: '16:9' | '9:16';
    ageRange?: string;
    safeZone?: 'left_safe' | 'right_safe' | 'center_safe' | 'intro_safe' | 'outro_safe' | 'all_ok' | 'not_applicable' | 'frame' | 'slideshow';
    targetLetter?: string;
    additionalContext?: string;
    generatedAt?: string;
    variations?: string[];
  };
}

export default function AssetManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadForm, setUploadForm] = useState({
    theme: '',
    type: 'image' as 'image' | 'audio' | 'video' | 'prompt',
    description: '',
    tags: '',
    project_id: '',
    prompt: '',
    personalization: 'general' as 'general' | 'personalized',
    child_name: '',
    template: '' as 'lullaby' | 'name-video' | 'letter-hunt' | 'general' | '',
    volume: 1.0,
    audio_class: '' as string | undefined,
    letter: ''
  });
  const [reviewForm, setReviewForm] = useState({
    safe_zone: [] as ('left_safe' | 'right_safe' | 'center_safe' | 'intro_safe' | 'outro_safe' | 'all_ok' | 'not_applicable')[],
    approval_notes: '',
    rejection_reason: ''
  });
  const [editForm, setEditForm] = useState({
    title: '',
    theme: '',
    description: '',
    tags: '',
    prompt: '',
    personalization: 'general' as 'general' | 'personalized',
    child_name: '',
    template: '' as 'lullaby' | 'name-video' | 'letter-hunt' | 'general' | '',
    volume: 1.0,
    audio_class: '' as string | undefined,
    letter: '',
    // Enhanced fields for prompt generation context
    imageType: '' as 'titleCard' | 'signImage' | 'bookImage' | 'groceryImage' | 'endingImage' | 'characterImage' | 'sceneImage' | '',
    artStyle: '',
    aspectRatio: '16:9' as '16:9' | '9:16',
    ageRange: '',
    safeZone: 'center_safe' as 'left_safe' | 'right_safe' | 'center_safe' | 'intro_safe' | 'outro_safe' | 'all_ok' | 'not_applicable' | 'frame' | 'slideshow',
    targetLetter: '',
    additionalContext: ''
  });
  const [bulkUploadForm, setBulkUploadForm] = useState({
    description: '',
    tags: '',
    prompt: '',
    personalization: 'general' as 'general' | 'personalized',
    child_name: '',
    template: '' as 'lullaby' | 'name-video' | 'letter-hunt' | 'general' | '',
    volume: 1.0,
    audio_class: '' as string | undefined
  });
  const [filter, setFilter] = useState({
    status: 'all',
    type: 'all',
    template: 'all',
    search: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'all' | 'review' | 'viewer'>('all');
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [pendingAssetsCount, setPendingAssetsCount] = useState(0);
  const assetsPerPage = 50;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    fetchAssets(1, filter);
  }, []);

  // Reset filters when view changes
  useEffect(() => {
    if (view === 'review') {
      setFilter(prev => ({ ...prev, status: 'pending' }));
    } else if (view === 'all') {
      setFilter(prev => ({ ...prev, status: 'all' }));
    }
  }, [view]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter(prev => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Refetch assets when filters change
  useEffect(() => {
    if (view === 'all') {
      setCurrentPage(1);
      fetchAssets(1, filter);
    }
  }, [filter.status, filter.type, filter.template, filter.search, view]);

  // Fetch user names for reviewer display
  useEffect(() => {
    const fetchUserNames = async () => {
      const reviewerIds = new Set<string>();
      
      // Collect all reviewer IDs from assets
      assets.forEach(asset => {
        if (asset.metadata?.review?.reviewed_by) {
          reviewerIds.add(asset.metadata.review.reviewed_by);
        }
      });

      if (reviewerIds.size === 0) return;

      // Fetch user names from Supabase
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', Array.from(reviewerIds));

      if (!error && users) {
        const nameMap: Record<string, string> = {};
        users.forEach(user => {
          nameMap[user.id] = user.name || user.email || user.id;
        });
        setUserNames(nameMap);
      }
    };

    if (assets.length > 0) {
      fetchUserNames();
    }
  }, [assets]);

  const isAudioOrVideo = (type: string): boolean => {
    return ['audio', 'video'].includes(type);
  };

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['content_manager', 'asset_creator', 'video_ops'].includes(userData.role)) {
      router.push('/dashboard');
      return;
    }
  };

  const fetchAssets = async (page: number = 1, filters = filter) => {
    setLoading(true);
    
    // Build query based on filters
    let query = supabase.from('assets').select('*');
    
    // Apply status filter
    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    // Apply type filter
    if (filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    
    // Apply template filter
    if (filters.template !== 'all') {
      query = query.eq('metadata->template', filters.template);
    }
    
    // Apply search filter
    if (filters.search) {
      // Search across multiple fields using OR conditions
      query = query.or(`theme.ilike.%${filters.search}%,prompt.ilike.%${filters.search}%,metadata->description.ilike.%${filters.search}%,metadata->child_name.ilike.%${filters.search}%,metadata->prompt.ilike.%${filters.search}%,metadata->audio_class.ilike.%${filters.search}%,metadata->letter.ilike.%${filters.search}%`);
    }
    
    // Get total count for pagination with filters applied
    let countQuery = supabase.from('assets').select('*', { count: 'exact', head: true });
    
    // Apply the same filters to count query
    if (filters.status !== 'all') {
      countQuery = countQuery.eq('status', filters.status);
    }
    if (filters.type !== 'all') {
      countQuery = countQuery.eq('type', filters.type);
    }
    if (filters.template !== 'all') {
      countQuery = countQuery.eq('metadata->template', filters.template);
    }
    if (filters.search) {
      countQuery = countQuery.or(`theme.ilike.%${filters.search}%,prompt.ilike.%${filters.search}%,metadata->description.ilike.%${filters.search}%,metadata->child_name.ilike.%${filters.search}%,metadata->prompt.ilike.%${filters.search}%,metadata->audio_class.ilike.%${filters.search}%,metadata->letter.ilike.%${filters.search}%`);
    }
    
    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error fetching total count:', countError);
    } else {
      setTotalAssets(totalCount || 0);
    }
    
    // Get pending assets count for review queue
    const { count: pendingCount, error: pendingError } = await supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('Error fetching pending count:', pendingError);
    } else {
      setPendingAssetsCount(pendingCount || 0);
    }
    
    // Calculate pagination
    const from = (page - 1) * assetsPerPage;
    const to = from + assetsPerPage - 1;
    
    // Apply pagination and ordering
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching assets:', error);
    } else {
      console.log('Fetched assets:', data);
      
      // Log audio assets specifically
      const audioAssets = data?.filter(asset => asset.type === 'audio') || [];
      console.log('Audio assets found:', audioAssets.length);
      audioAssets.forEach((asset, index) => {
        console.log(`Audio asset ${index + 1}:`, {
          id: asset.id,
          theme: asset.theme,
          has_audio_data: !!asset.metadata?.audio_data,
          has_file_url: !!asset.file_url,
          metadata_keys: asset.metadata ? Object.keys(asset.metadata) : [],
          file_url: asset.file_url
        });
      });
      
      setAssets(data || []);
    }
    setLoading(false);
  };

  const fetchPendingAssets = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending assets:', error);
    } else {
      console.log('Fetched pending assets:', data);
      setAssets(data || []);
    }
  };

  const handleApprove = async (assetId: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Authentication error:', userError);
      alert('Authentication error: ' + userError.message);
      return;
    }

    if (!user) {
      console.error('No user authenticated');
      alert('No user authenticated. Please log in.');
      return;
    }

    console.log('Authenticated user:', user.id, user.email);
    
    // Get current asset to preserve existing metadata
    const { data: currentAsset } = await supabase
      .from('assets')
      .select('metadata')
      .eq('id', assetId)
      .single();
    
    const { error } = await supabase
      .from('assets')
      .update({ 
        status: 'approved',
        title: editForm.title,
        theme: editForm.theme,
        prompt: editForm.prompt,
        metadata: {
          ...currentAsset?.metadata,
          ...editForm,
          prompt: undefined, // Remove from metadata since it's now top-level
          letter: editForm.audio_class === 'letter_audio' ? editForm.letter : undefined,
          review: {
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id
          }
        }
      })
      .eq('id', assetId);

    if (error) {
      console.error('Error approving asset:', error);
      alert('Error approving asset: ' + error.message);
    } else {
      console.log('Asset approved successfully');
      if (view === 'review') {
        fetchPendingAssets();
      } else {
        fetchAssets(currentPage, filter);
      }
      setShowModal(false);
    }
  };

  const handleReject = async (assetId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get current asset to preserve existing metadata
    const { data: currentAsset } = await supabase
      .from('assets')
      .select('metadata')
      .eq('id', assetId)
      .single();
    
    const { error } = await supabase
      .from('assets')
      .update({ 
        status: 'rejected',
        metadata: {
          ...currentAsset?.metadata,
          review: {
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id
          }
        }
      })
      .eq('id', assetId);

    if (error) {
      console.error('Error rejecting asset:', error);
    } else {
      if (view === 'review') {
        fetchPendingAssets();
      } else {
        fetchAssets(currentPage, filter);
      }
      setShowModal(false);
    }
  };

  const handleApproveWithReview = async (assetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('No user authenticated. Please log in.');
        return;
      }

      console.log('Updating asset with data:', {
        status: 'approved',
        theme: editForm.theme,
        tags: editForm.tags ? editForm.tags.split(',').map(tag => tag.trim()) : [],
        metadata: {
          description: editForm.description,
          prompt: editForm.prompt,
          personalization: editForm.personalization,
          child_name: editForm.child_name,
          template: editForm.template,
          volume: (selectedAsset && isAudioOrVideo(selectedAsset.type)) ? editForm.volume : undefined,
          audio_class: (selectedAsset && selectedAsset.type === 'audio') ? editForm.audio_class : undefined,
          letter: (selectedAsset && selectedAsset.type === 'audio' && editForm.audio_class === 'letter_audio') ? editForm.letter : undefined,
          // Enhanced metadata fields
          imageType: (selectedAsset && selectedAsset.type === 'image') ? 
            (editForm.safeZone === 'slideshow' ? 'bedtime_scene' : editForm.imageType) : undefined,
          artStyle: (selectedAsset && selectedAsset.type === 'image') ? editForm.artStyle : undefined,
          aspectRatio: (selectedAsset && selectedAsset.type === 'image') ? editForm.aspectRatio : undefined,
          ageRange: editForm.ageRange || undefined,
          safeZone: (selectedAsset && selectedAsset.type === 'image') ? editForm.safeZone : undefined,
          asset_class: (selectedAsset && selectedAsset.type === 'image' && editForm.safeZone === 'slideshow') ? 'bedtime_scene' : undefined,
          targetLetter: editForm.targetLetter || undefined,
          additionalContext: editForm.additionalContext || undefined,
          review: {
            safe_zone: reviewForm.safe_zone,
            approval_notes: reviewForm.approval_notes,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id
          }
        }
      });

      const { data, error } = await supabase
        .from('assets')
        .update({ 
          status: 'approved',
          title: editForm.title,
          theme: editForm.theme,
          prompt: editForm.prompt,
          tags: editForm.tags ? editForm.tags.split(',').map(tag => tag.trim()) : [],
          metadata: {
            description: editForm.description,
            personalization: editForm.personalization,
            child_name: editForm.child_name,
            template: editForm.template,
            volume: (selectedAsset && isAudioOrVideo(selectedAsset.type)) ? editForm.volume : undefined,
            audio_class: (selectedAsset && selectedAsset.type === 'audio') ? editForm.audio_class : undefined,
            letter: (selectedAsset && selectedAsset.type === 'audio' && editForm.audio_class === 'letter_audio') ? editForm.letter : undefined,
            // Enhanced metadata fields
            imageType: (selectedAsset && selectedAsset.type === 'image') ? editForm.imageType : undefined,
            artStyle: (selectedAsset && selectedAsset.type === 'image') ? editForm.artStyle : undefined,
            aspectRatio: (selectedAsset && selectedAsset.type === 'image') ? editForm.aspectRatio : undefined,
            ageRange: editForm.ageRange || undefined,
            safeZone: (selectedAsset && selectedAsset.type === 'image') ? editForm.safeZone : undefined,
            targetLetter: editForm.targetLetter || undefined,
            additionalContext: editForm.additionalContext || undefined,
            review: {
              safe_zone: reviewForm.safe_zone,
              approval_notes: reviewForm.approval_notes,
              reviewed_at: new Date().toISOString(),
              reviewed_by: user.id
            }
          }
        })
        .eq('id', assetId)
        .select('*');

      if (error) {
        console.error('Error approving asset:', error);
        alert('Error approving asset: ' + error.message);
      } else {
        console.log('Asset updated successfully:', data);
        if (view === 'review') {
          await fetchPendingAssets(); // Wait for assets to refresh
        } else {
          await fetchAssets(currentPage, filter); // Wait for assets to refresh
        }
        openNextAsset(assetId); // Auto-advance to next asset
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Unexpected error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleRejectWithReview = async (assetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('No user authenticated. Please log in.');
        return;
      }

      const isSlideshow = (selectedAsset && selectedAsset.type === 'image' && editForm.safeZone === 'slideshow');
      const imageTypeValue = isSlideshow ? 'bedtime_scene' : (selectedAsset && selectedAsset.type === 'image' ? editForm.imageType : undefined);
      const assetClassValue = isSlideshow ? 'bedtime_scene' : undefined;

      const { data, error } = await supabase
        .from('assets')
        .update({ 
          status: 'rejected',
          title: editForm.title,
          theme: editForm.theme,
          prompt: editForm.prompt,
          tags: editForm.tags ? editForm.tags.split(',').map(tag => tag.trim()) : [],
          metadata: {
            description: editForm.description,
            personalization: editForm.personalization,
            child_name: editForm.child_name,
            template: editForm.template,
            volume: (selectedAsset && isAudioOrVideo(selectedAsset.type)) ? editForm.volume : undefined,
            audio_class: (selectedAsset && selectedAsset.type === 'audio') ? editForm.audio_class : undefined,
            letter: (selectedAsset && selectedAsset.type === 'audio' && editForm.audio_class === 'letter_audio') ? editForm.letter : undefined,
            // Enhanced metadata fields
            imageType: imageTypeValue,
            artStyle: (selectedAsset && selectedAsset.type === 'image') ? editForm.artStyle : undefined,
            aspectRatio: (selectedAsset && selectedAsset.type === 'image') ? editForm.aspectRatio : undefined,
            ageRange: editForm.ageRange || undefined,
            safeZone: (selectedAsset && selectedAsset.type === 'image') ? editForm.safeZone : undefined,
            asset_class: assetClassValue,
            targetLetter: editForm.targetLetter || undefined,
            additionalContext: editForm.additionalContext || undefined,
            review: {
              safe_zone: reviewForm.safe_zone,
              rejection_reason: reviewForm.rejection_reason,
              reviewed_at: new Date().toISOString(),
              reviewed_by: user.id
            }
          }
        })
        .eq('id', assetId)
        .select('*');

      if (error) {
        console.error('Error rejecting asset:', error);
        alert('Error rejecting asset: ' + error.message);
      } else {
        console.log('Asset rejected successfully:', data);
        if (view === 'review') {
          await fetchPendingAssets(); // Wait for assets to refresh
        } else {
          await fetchAssets(currentPage, filter); // Wait for assets to refresh
        }
        openNextAsset(assetId); // Auto-advance to next asset
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Unexpected error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Auto-detect type based on file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    let detectedType = 'image';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) detectedType = 'audio';
    else if (['mp4', 'avi', 'mov', 'webm'].includes(extension || '')) detectedType = 'video';
    else if (['txt', 'md', 'doc', 'docx'].includes(extension || '')) detectedType = 'prompt';
    
    setUploadForm(prev => ({ ...prev, type: detectedType as any }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleBulkFileSelect = (files: FileList) => {
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
  };

  const handleBulkDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleBulkFileSelect(e.dataTransfer.files);
    }
  };

  const initializeEditForm = (asset: Asset) => {
    setEditForm({
      title: asset.title || '',
      theme: asset.theme || '',
      description: asset.metadata?.description || '',
      tags: asset.tags ? asset.tags.join(', ') : '',
      prompt: asset.prompt || asset.metadata?.prompt || '',
      personalization: asset.metadata?.personalization || 'general',
      child_name: asset.metadata?.child_name || '',
      template: asset.metadata?.template || '',
      volume: asset.metadata?.volume ?? 1.0,
      audio_class: asset.metadata?.audio_class || '',
      letter: asset.metadata?.letter || '',
      // Enhanced metadata fields
      imageType: asset.metadata?.imageType || '',
      artStyle: asset.metadata?.artStyle || '',
      aspectRatio: asset.metadata?.aspectRatio || '16:9',
      ageRange: asset.metadata?.ageRange || '',
      safeZone: asset.metadata?.safeZone || 'center_safe',
      targetLetter: asset.metadata?.targetLetter || '',
      additionalContext: asset.metadata?.additionalContext || ''
    });
    setReviewForm({
      safe_zone: asset.metadata?.review?.safe_zone || [],
      approval_notes: asset.metadata?.review?.approval_notes || '',
      rejection_reason: asset.metadata?.review?.rejection_reason || ''
    });
  };

  const findNextPendingAsset = (currentAssetId: string) => {
    const pendingAssets = assets.filter(asset => asset.status === 'pending');
    const currentIndex = pendingAssets.findIndex(asset => asset.id === currentAssetId);
    
    if (currentIndex === -1 || currentIndex === pendingAssets.length - 1) {
      // No more pending assets or this was the last one
      return null;
    }
    
    return pendingAssets[currentIndex + 1];
  };

  const handleGenerateAsset = async (assetId: string) => {
    try {
      const response = await fetch('/api/assets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Asset generation started:', result);
        
        // Refresh assets to show updated status
        setTimeout(() => {
          fetchAssets(currentPage, filter);
        }, 2000);
      } else {
        console.error('Failed to generate asset');
        alert('Failed to generate asset. Please try again.');
      }
    } catch (error) {
      console.error('Error generating asset:', error);
      alert('Error generating asset. Please try again.');
    }
  };

  const openNextAsset = (currentAssetId: string) => {
    const nextAsset = findNextPendingAsset(currentAssetId);
    
    if (nextAsset) {
      setSelectedAsset(nextAsset);
      initializeEditForm(nextAsset);
      setReviewForm({ safe_zone: [], approval_notes: '', rejection_reason: '' });
      // Scroll to top of modal
      setTimeout(() => {
        const modal = document.querySelector('.modal-content');
        if (modal) {
          modal.scrollTop = 0;
        }
      }, 100);
    } else {
      // No more assets to review, close modal
      setShowModal(false);
      setSelectedAsset(null);
      setReviewForm({ safe_zone: [], approval_notes: '', rejection_reason: '' });
      setEditForm({ 
        title: '',
        theme: '', 
        description: '', 
        tags: '', 
        prompt: '', 
        personalization: 'general', 
        child_name: '', 
        template: '', 
        volume: 1.0, 
        audio_class: '', 
        letter: '',
        // Enhanced fields with defaults
        imageType: '',
        artStyle: '',
        aspectRatio: '16:9',
        ageRange: '',
        safeZone: 'center_safe',
        targetLetter: '',
        additionalContext: ''
      });
    }
  };

  // Keyboard shortcuts for faster moderation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!showModal || !selectedAsset) return;
      
      // Prevent shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      
      switch (event.key) {
        case 'a':
        case 'A':
          event.preventDefault();
          if (reviewForm.safe_zone.length > 0 && editForm.theme.trim()) {
            handleApproveWithReview(selectedAsset.id);
          }
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          handleRejectWithReview(selectedAsset.id);
          break;
        case 'Escape':
          event.preventDefault();
          setShowModal(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showModal, selectedAsset, reviewForm.safe_zone, editForm.theme, handleApproveWithReview, handleRejectWithReview]);

  const uploadAsset = async () => {
    if (!selectedFile || !uploadForm.theme) return;

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `assets/${uploadForm.type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // Create asset record in database
      const { error: dbError } = await supabase
        .from('assets')
        .insert({
          theme: uploadForm.theme,
          type: uploadForm.type,
          prompt: uploadForm.prompt || null,
          file_url: publicUrl,
          tags: uploadForm.tags ? uploadForm.tags.split(',').map(tag => tag.trim()) : [],
          status: 'pending',
          metadata: {
            description: uploadForm.description,
            project_id: uploadForm.project_id || null,
            personalization: uploadForm.personalization,
            child_name: uploadForm.personalization === 'personalized' ? uploadForm.child_name : null,
            template: uploadForm.template || null,
            volume: (isAudioOrVideo(uploadForm.type)) ? uploadForm.volume : undefined,
            audio_class: uploadForm.type === 'audio' ? uploadForm.audio_class : undefined,
            letter: (uploadForm.type === 'audio' && uploadForm.audio_class === 'letter_audio') ? uploadForm.letter : undefined
          }
        });

      if (dbError) throw dbError;

      // Reset form and close modal
      setUploadForm({
        theme: '',
        type: 'image',
        description: '',
        tags: '',
        project_id: '',
        prompt: '',
        personalization: 'general',
        child_name: '',
        template: '',
        volume: 1.0,
        audio_class: '',
        letter: ''
      });
      setSelectedFile(null);
      setShowUploadModal(false);
      if (view === 'review') {
        fetchPendingAssets();
      } else {
        fetchAssets(currentPage, filter);
      }

    } catch (error) {
      console.error('Error uploading asset:', error);
      alert('Error uploading asset. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const uploadBulkAssets = async () => {
    if (selectedFiles.length === 0) return;

    setBulkUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        // Auto-detect type based on file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        let detectedType = 'image';
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) detectedType = 'audio';
        else if (['mp4', 'avi', 'mov', 'webm'].includes(extension || '')) detectedType = 'video';
        else if (['txt', 'md', 'doc', 'docx'].includes(extension || '')) detectedType = 'prompt';

        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `assets/${detectedType}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          return null;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath);

        // Create asset record in database
        const { error: dbError } = await supabase
          .from('assets')
          .insert({
            theme: file.name.replace(/\.[^/.]+$/, ''), // Use filename without extension as theme
            type: detectedType,
            prompt: bulkUploadForm.prompt,
            file_url: publicUrl,
            tags: bulkUploadForm.tags ? bulkUploadForm.tags.split(',').map(tag => tag.trim()) : [],
            status: 'pending',
            metadata: {
              description: bulkUploadForm.description,
              personalization: bulkUploadForm.personalization,
              child_name: bulkUploadForm.personalization === 'personalized' ? bulkUploadForm.child_name : null,
              template: bulkUploadForm.template,
              volume: (isAudioOrVideo(detectedType)) ? bulkUploadForm.volume : undefined
            }
          });

        if (dbError) {
          console.error('Error creating asset record:', dbError);
          return null;
        }

        return { success: true, filename: file.name };
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result !== null);

      console.log(`Successfully uploaded ${successfulUploads.length} out of ${selectedFiles.length} files`);

      // Reset form and close modal
      setBulkUploadForm({
        description: '',
        tags: '',
        prompt: '',
        personalization: 'general' as 'general' | 'personalized',
        child_name: '',
        template: '' as 'lullaby' | 'name-video' | 'letter-hunt' | 'general' | '',
        volume: 1.0,
        audio_class: '' as string | undefined
      });
      setSelectedFiles([]);
      setShowBulkUploadModal(false);
      if (view === 'review') {
        fetchPendingAssets();
      } else {
        fetchAssets(currentPage, filter);
      }
    } catch (error) {
      console.error('Error uploading bulk assets:', error);
      alert('Error uploading bulk assets. Please try again.');
    } finally {
      setBulkUploading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'audio': return '🎵';
      case 'video': return '🎬';
      case 'prompt': return '📄';
      default: return '📄';
    }
  };

  // Use assets directly since filtering is now done server-side
  const filteredAssets = assets;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader 
          title="Asset Review" 
          subtitle="Review and approve submitted assets"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mb-6">
            <button
              onClick={() => router.push('/admin/ai-generator')}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
            >
              Generate with AI
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              Upload Asset
            </button>
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
            >
              Bulk Upload
            </button>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <span className="text-lg">📋</span>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Total Assets</p>
                  <p className="text-xl font-semibold text-gray-900">{assets.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <span className="text-lg">⏳</span>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Pending</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {assets.filter(a => a.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <span className="text-lg">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Approved</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {assets.filter(a => a.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-red-100 text-red-600">
                  <span className="text-lg">❌</span>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Rejected</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {assets.filter(a => a.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm mb-4">
            <div className="p-4">
              {/* Active filters indicator */}
              {(filter.status !== 'all' || filter.type !== 'all' || filter.template !== 'all' || filter.search) && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800 font-medium">Active Filters:</span>
                    <button
                      onClick={() => {
                        setFilter({ status: 'all', type: 'all', template: 'all', search: '' });
                        setSearchTerm('');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {filter.status !== 'all' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Status: {filter.status}</span>
                    )}
                    {filter.type !== 'all' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Type: {filter.type}</span>
                    )}
                    {filter.template !== 'all' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Template: {filter.template}</span>
                    )}
                    {filter.search && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Search: "{filter.search}"</span>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search by theme, description, child name, tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={filter.type}
                    onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                    <option value="prompt">Prompt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select
                    value={filter.template}
                    onChange={(e) => setFilter(prev => ({ ...prev, template: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Templates</option>
                    <option value="lullaby">Lullaby</option>
                    <option value="name-video">Name Video</option>
                    <option value="letter-hunt">Letter Hunt</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilter({ status: 'all', type: 'all', template: 'all', search: '' });
                      setSearchTerm('');
                    }}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Assets Grid */}
          {/* View Navigation */}
          <div className="bg-white rounded-lg shadow-sm mb-4">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Asset Management</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setView('all');
                      setCurrentPage(1);
                      fetchAssets(1, filter);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      view === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All Assets
                  </button>
                  <button
                    onClick={() => {
                      setView('review');
                      setCurrentPage(1);
                      fetchPendingAssets();
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      view === 'review' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    Review Queue ({pendingAssetsCount})
                  </button>
                  <button
                    onClick={() => setView('viewer')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      view === 'viewer' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Asset Viewer
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {view === 'all' && `All Assets (${filteredAssets.length} of ${assets.length} assets)`}
                {view === 'review' && `Review Queue (${filteredAssets.length} of ${pendingAssetsCount} assets)`}
                {view === 'viewer' && `Asset Viewer (${filteredAssets.length} assets)`}
              </h2>
            </div>
            <div className="p-4">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📁</div>
                  <p className="text-gray-600">No assets found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssets.map((asset: Asset) => (
                    <div key={asset.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                      {/* Asset Preview */}
                      {asset.file_url && (
                        <div className="h-32 bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden">
                          {asset.type === 'image' && (
                            <img 
                              src={asset.file_url} 
                              alt={asset.theme}
                              className="w-full h-32 object-contain"
                              style={{ height: '128px' }}
                            />
                          )}
                          {asset.type === 'video' && (
                            <div className="relative w-full h-32">
                              <video 
                                className="w-full h-32 object-contain"
                                preload="metadata"
                                muted
                              >
                                <source src={asset.file_url} type="video/mp4" />
                                <source src={asset.file_url} type="video/webm" />
                                <source src={asset.file_url} type="video/ogg" />
                              </video>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black bg-opacity-50 rounded-full p-2">
                                  <div className="text-white text-lg">▶</div>
                                </div>
                              </div>
                            </div>
                          )}
                          {asset.type === 'audio' && (
                            <AudioPlayer 
                              asset={asset} 
                              className="w-full h-full flex items-center justify-center"
                              showControls={true}
                            />
                          )}
                          {asset.type === 'prompt' && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                              <div className="text-3xl mb-2">📄</div>
                              <div className="text-xs text-center">Prompt File</div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Asset Info */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl">{getTypeIcon(asset.type)}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            asset.status === 'approved' ? 'bg-green-100 text-green-800' :
                            asset.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {asset.status}
                          </span>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-2">
                          {asset.title || asset.theme}
                        </h3>
                        {asset.title && asset.title !== asset.theme && (
                          <p className="text-sm text-gray-600 mb-1">Theme: {asset.theme}</p>
                        )}
                        <p className="text-sm text-gray-600 mb-2">Type: {asset.type}</p>
                        
                        {/* Show letter assignment if available */}
                        {asset.metadata?.targetLetter && (
                          <p className="text-sm text-gray-600 mb-1">
                            Letter: <span className="font-semibold">{asset.metadata.targetLetter}</span>
                          </p>
                        )}
                        
                        {/* Show template if available */}
                        {asset.metadata?.template && (
                          <p className="text-sm text-gray-600 mb-1">Template: {asset.metadata.template}</p>
                        )}
                        
                        {/* Show child name if available */}
                        {asset.metadata?.child_name && (
                          <p className="text-sm text-gray-600 mb-1">Child: {asset.metadata.child_name}</p>
                        )}
                        
                        {asset.tags && asset.tags.length > 0 && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {asset.tags.map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mb-4">
                          Created: {new Date(asset.created_at).toLocaleDateString()}
                        </p>
                        

                        {asset.metadata?.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{asset.metadata.description}</p>
                        )}

                        {/* Show the prompt (generation prompt) on the preview card */}
                        {(asset.prompt || asset.metadata?.prompt) && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-700 mb-1">Prompt:</h4>
                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded line-clamp-3">
                              {asset.prompt || asset.metadata?.prompt}
                            </p>
                          </div>
                        )}
                        
                        {asset.metadata?.personalization && (
                          <div className="flex items-center mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              asset.metadata.personalization === 'personalized' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {asset.metadata.personalization === 'personalized' ? 'Personalized' : 'General'}
                            </span>
                            {asset.metadata.personalization === 'personalized' && asset.metadata.child_name && (
                              <span className="ml-2 text-sm text-gray-600">for {asset.metadata.child_name}</span>
                            )}
                          </div>
                        )}

                        {asset.metadata?.template && (
                          <div className="mb-2">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                              {asset.metadata.template.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                        )}

                        {asset.metadata?.review && (
                          <div className="mb-2 space-y-1">
                            {asset.metadata.review.safe_zone && Array.isArray(asset.metadata.review.safe_zone) && asset.metadata.review.safe_zone.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {asset.metadata.review.safe_zone.map((zone, index) => (
                                  <span key={index} className={`px-2 py-1 text-xs rounded-full ${
                                    zone === 'all_ok' 
                                      ? 'bg-green-100 text-green-800'
                                      : zone === 'center_safe'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : zone === 'intro_safe'
                                      ? 'bg-blue-100 text-blue-800'
                                      : zone === 'outro_safe'
                                      ? 'bg-purple-100 text-purple-800'
                                      : zone === 'not_applicable'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {zone.replace('_', ' ').toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            )}
                            {asset.metadata.review.reviewed_at && (
                              <div className="text-xs text-gray-500">
                                Reviewed: {new Date(asset.metadata.review.reviewed_at).toLocaleDateString()}
                                {asset.metadata.review.reviewed_by && (
                                  <span className="ml-1">by {userNames[asset.metadata.review.reviewed_by] || asset.metadata.review.reviewed_by}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        {asset.status === 'pending' && (view === 'review' || view === 'all') && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleGenerateAsset(asset.id)}
                              className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-md text-sm hover:bg-purple-700"
                            >
                              Generate
                            </button>
                            <button
                              onClick={() => {
                                console.log('Review button clicked for asset:', asset);
                                setSelectedAsset(asset);
                                initializeEditForm(asset);
                                setShowModal(true);
                                // Scroll to top when modal opens
                                setTimeout(() => {
                                  const modal = document.querySelector('.modal-content');
                                  if (modal) {
                                    modal.scrollTop = 0;
                                  }
                                }, 100);
                                console.log('Modal state set to true');
                              }}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleApprove(asset.id)}
                              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(asset.id)}
                              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {/* Viewer Actions */}
                        {view === 'viewer' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                initializeEditForm(asset);
                                setShowModal(true);
                                // Scroll to top when modal opens
                                setTimeout(() => {
                                  const modal = document.querySelector('.modal-content');
                                  if (modal) {
                                    modal.scrollTop = 0;
                                  }
                                }, 100);
                              }}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                            >
                              View Details
                            </button>
                          </div>
                        )}
                        {asset.status === 'approved' && (
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              initializeEditForm(asset);
                              setShowModal(true);
                              setTimeout(() => {
                                const modal = document.querySelector('.modal-content');
                                if (modal) modal.scrollTop = 0;
                              }, 100);
                            }}
                            className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-md text-sm hover:bg-yellow-700"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination - Show for all views when there are many assets */}
              {totalAssets > assetsPerPage && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * assetsPerPage) + 1} to {Math.min(currentPage * assetsPerPage, totalAssets)} of {totalAssets} assets
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const newPage = currentPage - 1;
                        setCurrentPage(newPage);
                        fetchAssets(newPage, filter);
                      }}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, Math.ceil(totalAssets / assetsPerPage)) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              fetchAssets(pageNum, filter);
                            }}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => {
                        const newPage = currentPage + 1;
                        setCurrentPage(newPage);
                        fetchAssets(newPage, filter);
                      }}
                      disabled={currentPage >= Math.ceil(totalAssets / assetsPerPage)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage >= Math.ceil(totalAssets / assetsPerPage)
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Upload New Asset</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {selectedFile ? (
                      <div>
                        <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="mt-2 text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600">Drag and drop a file here, or</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          browse files
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                {/* Form Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme/Title *</label>
                  <input
                    type="text"
                    value={uploadForm.theme}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Happy Birthday, Space Adventure"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                    <option value="prompt">Prompt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe the asset..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., birthday, space, adventure (comma separated)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project ID (optional)</label>
                  <input
                    type="text"
                    value={uploadForm.project_id}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, project_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Link to a content project"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Used (optional)</label>
                  <textarea
                    value={uploadForm.prompt}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter the prompt that was used to generate this asset..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personalization Type</label>
                  <select
                    value={uploadForm.personalization}
                    onChange={(e) => setUploadForm(prev => ({ 
                      ...prev, 
                      personalization: e.target.value as 'general' | 'personalized',
                      child_name: e.target.value === 'general' ? '' : prev.child_name
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="personalized">Personalized</option>
                  </select>
                </div>

                {(isAudioOrVideo(uploadForm.type) && uploadForm.type === 'audio' && uploadForm.audio_class !== 'letter_audio') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Child Name</label>
                    <input
                      type="text"
                      value={uploadForm.child_name}
                      onChange={e => setUploadForm(prev => ({ ...prev, child_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter child's name (if personalized)"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select
                    value={uploadForm.template}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, template: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template...</option>
                    <option value="lullaby">Lullaby</option>
                    <option value="name-video">Name Video</option>
                    <option value="letter-hunt">Letter Hunt</option>
                    <option value="general">General</option>
                  </select>
                </div>

                {/* Audio Class Assignment (for audio assets) */}
                {uploadForm.type === 'audio' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Audio Class</label>
                    <select
                      value={uploadForm.audio_class || ''}
                      onChange={(e) => setUploadForm(prev => ({ 
                        ...prev, 
                        audio_class: e.target.value || undefined 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select audio class...</option>
                      <option value="background_music">Background Music</option>
                      <option value="intro_audio">Intro Audio</option>
                      <option value="outro_audio">Outro Audio</option>
                      <option value="letter_audio">Letter Audio</option>
                      <option value="name_audio">Name Audio</option>
                      <option value="name_encouragement">Name Encouragement</option>
                      <option value="bedtime_greeting">Bedtime Greeting</option>
                      <option value="goodnight_message">Goodnight Message</option>
                      <option value="voice_narration">Voice Narration</option>
                      <option value="sound_effect">Sound Effect</option>
                    </select>
                  </div>
                )}

                {/* Letter field for letter audio */}
                {uploadForm.type === 'audio' && uploadForm.audio_class === 'letter_audio' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Letter</label>
                    <input
                      type="text"
                      maxLength={1}
                      value={uploadForm.letter || ''}
                      onChange={e => setUploadForm(prev => ({ ...prev, letter: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the letter (A-Z)"
                    />
                  </div>
                )}

                {(isAudioOrVideo(uploadForm.type)) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Volume (0–1)</label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={uploadForm.volume}
                      onChange={e => setUploadForm(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={uploadAsset}
                  disabled={
                    !selectedFile || 
                    !uploadForm.theme || 
                    uploading ||
                    (uploadForm.personalization === 'personalized' && uploadForm.audio_class !== 'letter_audio' && !uploadForm.child_name)
                  }
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploading ? 'Uploading...' : 'Upload Asset'}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Review Asset</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {(() => {
                      const pendingAssets = assets.filter(asset => asset.status === 'pending');
                      const currentIndex = pendingAssets.findIndex(asset => asset.id === selectedAsset.id);
                      const remaining = pendingAssets.length - (currentIndex + 1);
                      return `${remaining} more asset${remaining !== 1 ? 's' : ''} in queue`;
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Asset Preview */}
                {selectedAsset.file_url && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    {selectedAsset.type === 'image' && (
                      <img 
                        src={selectedAsset.file_url} 
                        alt={selectedAsset.theme}
                        className="max-h-64 mx-auto object-contain"
                      />
                    )}
                    {selectedAsset.type === 'video' && (
                      <video 
                        controls
                        className="max-h-64 mx-auto object-contain w-full"
                        preload="metadata"
                        ref={el => { if (el) el.volume = editForm.volume ?? 1.0; }}
                      >
                        <source src={selectedAsset.file_url} type="video/mp4" />
                        <source src={selectedAsset.file_url} type="video/webm" />
                        <source src={selectedAsset.file_url} type="video/ogg" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    {selectedAsset.type === 'audio' && (
                      <AudioPlayer 
                        asset={selectedAsset} 
                        className="w-full"
                        showControls={true}
                      />
                    )}
                    {selectedAsset.type === 'prompt' && (
                      <div className="bg-white border border-gray-300 rounded p-3 max-h-64 overflow-y-auto">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedAsset.file_url ? (
                            <a 
                              href={selectedAsset.file_url} 
                              target="_blank" 
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              View Prompt File
                            </a>
                          ) : (
                            'No prompt file available'
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Editable Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme *</label>
                  <input
                    type="text"
                    value={editForm.theme}
                    onChange={(e) => setEditForm(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter theme"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <p className="text-gray-600 bg-gray-50 px-3 py-2 rounded-md">{selectedAsset.type}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Used</label>
                  <textarea
                    value={editForm.prompt}
                    onChange={(e) => setEditForm(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter prompt"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personalization</label>
                  <select
                    value={editForm.personalization}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      personalization: e.target.value as 'general' | 'personalized',
                      child_name: e.target.value === 'general' ? '' : prev.child_name
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="personalized">Personalized</option>
                  </select>
                </div>

                {editForm.personalization === 'personalized' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Child Name</label>
                    <input
                      type="text"
                      value={editForm.child_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, child_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the child's name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select
                    value={editForm.template}
                    onChange={(e) => setEditForm(prev => ({ ...prev, template: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template...</option>
                    <option value="lullaby">Lullaby</option>
                    <option value="name-video">Name Video</option>
                    <option value="letter-hunt">Letter Hunt</option>
                    <option value="general">General</option>
                  </select>
                </div>

                {/* Template Context Display */}
                {selectedAsset.metadata?.template_context && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <h4 className="font-medium text-indigo-900 mb-2">🎬 Template Context</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium text-indigo-700">Template Type:</span>
                        <span className="ml-2 text-indigo-600">{selectedAsset.metadata.template_context.template_type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-indigo-700">Asset Purpose:</span>
                        <span className="ml-2 text-indigo-600">{selectedAsset.metadata.template_context.asset_purpose}</span>
                      </div>
                      {selectedAsset.metadata.template_context.child_name && (
                        <div>
                          <span className="font-medium text-indigo-700">Child Name:</span>
                          <span className="ml-2 text-indigo-600">{selectedAsset.metadata.template_context.child_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Class Assignment (for audio assets) */}
                {selectedAsset.type === 'audio' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Audio Class</label>
                    <select
                      value={editForm.audio_class || ''}
                      onChange={(e) => {
                        const audioClass = e.target.value;
                        setEditForm(prev => ({ 
                          ...prev, 
                          audio_class: audioClass || undefined 
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select audio class...</option>
                      <option value="background_music">Background Music</option>
                      <option value="intro_audio">Intro Audio</option>
                      <option value="outro_audio">Outro Audio</option>
                      <option value="letter_audio">Letter Audio</option>
                      <option value="name_audio">Name Audio</option>
                      <option value="name_encouragement">Name Encouragement</option>
                      <option value="bedtime_greeting">Bedtime Greeting</option>
                      <option value="goodnight_message">Goodnight Message</option>
                      <option value="voice_narration">Voice Narration</option>
                      <option value="sound_effect">Sound Effect</option>
                    </select>
                  </div>
                )}

                {/* Duration Display (for audio/video assets) */}
                {(selectedAsset.type === 'audio' || selectedAsset.type === 'video') && selectedAsset.metadata?.duration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <p className="text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                      {selectedAsset.metadata.duration.toFixed(2)} seconds 
                      ({Math.floor(selectedAsset.metadata.duration / 60)}:{(selectedAsset.metadata.duration % 60).toFixed(0).padStart(2, '0')})
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tags separated by commas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File URL</label>
                  <p className="text-gray-600 break-all bg-gray-50 px-3 py-2 rounded-md">{selectedAsset.file_url || 'No file attached'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                  <p className="text-gray-600 bg-gray-50 px-3 py-2 rounded-md">{new Date(selectedAsset.created_at).toLocaleString()}</p>
                </div>

                {selectedAsset.metadata?.review && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Review Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Safe Zone: </span>
                        {selectedAsset.metadata.review.safe_zone && selectedAsset.metadata.review.safe_zone.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedAsset.metadata.review.safe_zone.map((zone, index) => (
                              <span key={index} className={`px-2 py-1 text-xs rounded-full ${
                                zone === 'all_ok' 
                                  ? 'bg-green-100 text-green-800'
                                  : zone === 'center_safe'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : zone === 'intro_safe'
                                  ? 'bg-blue-100 text-blue-800'
                                  : zone === 'outro_safe'
                                  ? 'bg-purple-100 text-purple-800'
                                  : zone === 'not_applicable'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {zone.replace('_', ' ').toUpperCase()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">None selected</span>
                        )}
                      </div>
                      {selectedAsset.metadata.review.approval_notes && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Approval Notes: </span>
                          <p className="text-gray-600 text-sm">{selectedAsset.metadata.review.approval_notes}</p>
                        </div>
                      )}
                      {selectedAsset.metadata.review.rejection_reason && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Rejection Reason: </span>
                          <p className="text-gray-600 text-sm">{selectedAsset.metadata.review.rejection_reason}</p>
                        </div>
                      )}
                      {selectedAsset.metadata.review.reviewed_at && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Reviewed: </span>
                          <span className="text-gray-600 text-sm">
                            {new Date(selectedAsset.metadata.review.reviewed_at).toLocaleString()}
                            {selectedAsset.metadata.review.reviewed_by && (
                              <span className="ml-1">by {userNames[selectedAsset.metadata.review.reviewed_by] || selectedAsset.metadata.review.reviewed_by}</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedAsset.type === 'audio' && editForm.audio_class === 'letter_audio' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Letter</label>
                    <input
                      type="text"
                      maxLength={1}
                      value={editForm.letter}
                      onChange={e => setEditForm(prev => ({ ...prev, letter: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the letter (A-Z)"
                    />
                  </div>
                )}
              </div>

              {/* Enhanced Context Display for Images */}
              {(selectedAsset.type === 'image' || router.query.template) && (
                <div className="border-t pt-4 mt-6">
                  {/* Inherited Context Display - More Prominent */}
                  {router.query.template && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg mb-4">
                      <div className="flex items-center mb-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <h4 className="text-sm font-semibold text-blue-900">
                          Inherited from Prompt Generator
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
                        {router.query.template && (
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <strong className="text-blue-900">Template:</strong> {router.query.template}
                          </div>
                        )}
                        {router.query.theme && (
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <strong className="text-blue-900">Theme:</strong> {router.query.theme}
                          </div>
                        )}
                        {router.query.imageType && (
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <strong className="text-blue-900">Image Type:</strong> {router.query.imageType}
                          </div>
                        )}
                        {router.query.ageRange && (
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <strong className="text-blue-900">Age Range:</strong> {router.query.ageRange}
                          </div>
                        )}
                        {router.query.childName && (
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <strong className="text-blue-900">Child Name:</strong> {router.query.childName}
                          </div>
                        )}
                        {router.query.targetLetter && (
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <strong className="text-blue-900">Target Letter:</strong> {router.query.targetLetter}
                          </div>
                        )}
                        {router.query.safeZone && (
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <strong className="text-blue-900">Safe Zone:</strong> {router.query.safeZone}
                          </div>
                        )}
                        {router.query.artStyle && (
                          <div className="bg-white p-2 rounded border border-blue-200">
                            <strong className="text-blue-900">Art Style:</strong> {router.query.artStyle}
                          </div>
                        )}
                        {router.query.additionalContext && (
                          <div className="col-span-2 bg-white p-2 rounded border border-blue-200">
                            <strong className="text-blue-900">Context:</strong> {router.query.additionalContext}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <h4 className="font-medium text-gray-900 mb-3">Image Generation Context</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Image Type */}
                    {(selectedAsset.metadata?.template === 'letter-hunt' || router.query.template === 'letter-hunt') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center">
                            Image Type
                            {router.query.imageType && (
                              <div className="ml-2 flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                                <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded">
                                  auto-filled
                                </span>
                              </div>
                            )}
                          </div>
                        </label>
                        <select
                          value={editForm.imageType}
                          onChange={(e) => setEditForm(prev => ({ ...prev, imageType: e.target.value as any }))}
                          className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            router.query.imageType 
                              ? 'border-blue-400 bg-blue-50 text-blue-900 font-medium' 
                              : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Image Type</option>
                          <option value="titleCard">Title Card - "Letter Hunt for [NAME]"</option>
                          <option value="signImage">Sign Image - Letter on street signs</option>
                          <option value="bookImage">Book Image - Letter on book covers</option>
                          <option value="groceryImage">Grocery Image - Letter on products</option>
                          <option value="endingImage">Ending Image - Celebratory finale</option>
                          <option value="characterImage">Character Image - Themed character</option>
                          <option value="sceneImage">Scene Image - Environmental scene</option>
                        </select>
                      </div>
                    )}

                    {/* Art Style */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          Art Style
                          {router.query.artStyle && (
                            <div className="ml-2 flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                              <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded">
                                auto-filled
                              </span>
                            </div>
                          )}
                        </div>
                      </label>
                      <input
                        type="text"
                        value={editForm.artStyle}
                        onChange={(e) => setEditForm(prev => ({ ...prev, artStyle: e.target.value }))}
                        className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          router.query.artStyle 
                            ? 'border-blue-400 bg-blue-50 text-blue-900 font-medium' 
                            : 'border-gray-300'
                        }`}
                        placeholder="e.g., 2D Pixar Style, watercolor, realistic..."
                      />
                    </div>

                    {/* Age Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          Age Range
                          {router.query.ageRange && (
                            <div className="ml-2 flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                              <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded">
                                auto-filled
                              </span>
                            </div>
                          )}
                        </div>
                      </label>
                      <input
                        type="text"
                        value={editForm.ageRange}
                        onChange={(e) => setEditForm(prev => ({ ...prev, ageRange: e.target.value }))}
                        className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          router.query.ageRange 
                            ? 'border-blue-400 bg-blue-50 text-blue-900 font-medium' 
                            : 'border-gray-300'
                        }`}
                        placeholder="e.g., 3-5, 2-4, 4-6..."
                      />
                    </div>

                    {/* Safe Zone (single selection) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          Safe Zone (Primary)
                          {router.query.safeZone && (
                            <div className="ml-2 flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                              <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded">
                                auto-filled
                              </span>
                            </div>
                          )}
                        </div>
                      </label>
                      <select
                        value={editForm.safeZone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, safeZone: e.target.value as any }))}
                        className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          router.query.safeZone 
                            ? 'border-blue-400 bg-blue-50 text-blue-900 font-medium' 
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="center_safe">Center Safe</option>
                        <option value="left_safe">Left Safe</option>
                        <option value="right_safe">Right Safe</option>
                        <option value="intro_safe">Intro Safe</option>
                        <option value="outro_safe">Outro Safe</option>
                        <option value="all_ok">All OK</option>
                        <option value="not_applicable">Not Applicable</option>
                        <option value="frame">Frame</option>
                        <option value="slideshow">Slideshow</option>
                      </select>
                    </div>

                    {/* Target Letter for Letter Hunt */}
                    {(selectedAsset.metadata?.template === 'letter-hunt' || router.query.template === 'letter-hunt') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center">
                            Target Letter
                            {router.query.targetLetter && (
                              <div className="ml-2 flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                                <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded">
                                  auto-filled
                                </span>
                              </div>
                            )}
                          </div>
                        </label>
                        <input
                          type="text"
                          maxLength={1}
                          value={editForm.targetLetter}
                          onChange={(e) => setEditForm(prev => ({ ...prev, targetLetter: e.target.value.toUpperCase() }))}
                          className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            router.query.targetLetter 
                              ? 'border-blue-400 bg-blue-50 text-blue-900 font-medium' 
                              : 'border-gray-300'
                          }`}
                          placeholder="A-Z"
                        />
                      </div>
                    )}

                    {/* Aspect Ratio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                      <select
                        value={editForm.aspectRatio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, aspectRatio: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Portrait)</option>
                      </select>
                    </div>
                  </div>

                  {/* Additional Context */}
                  {router.query.additionalContext && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          Additional Context
                          <div className="ml-2 flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                            <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded">
                              auto-filled
                            </span>
                          </div>
                        </div>
                      </label>
                      <textarea
                        value={editForm.additionalContext}
                        onChange={(e) => setEditForm(prev => ({ ...prev, additionalContext: e.target.value }))}
                        className="w-full px-3 py-2 border-2 border-blue-400 bg-blue-50 text-blue-900 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Additional context from prompt generator"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Safe Zone Review */}
              <div className="border-t pt-4 mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Safe Zone Review (Select all that apply)</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="left_safe"
                      checked={reviewForm.safe_zone.includes('left_safe')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: [...prev.safe_zone, 'left_safe']
                          }));
                        } else {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: prev.safe_zone.filter(zone => zone !== 'left_safe')
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Left Safe Zone</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="right_safe"
                      checked={reviewForm.safe_zone.includes('right_safe')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: [...prev.safe_zone, 'right_safe']
                          }));
                        } else {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: prev.safe_zone.filter(zone => zone !== 'right_safe')
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Right Safe Zone</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="center_safe"
                      checked={reviewForm.safe_zone.includes('center_safe')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: [...prev.safe_zone, 'center_safe']
                          }));
                        } else {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: prev.safe_zone.filter(zone => zone !== 'center_safe')
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Center Safe Zone</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="intro_safe"
                      checked={reviewForm.safe_zone.includes('intro_safe')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: [...prev.safe_zone, 'intro_safe']
                          }));
                        } else {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: prev.safe_zone.filter(zone => zone !== 'intro_safe')
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Intro Safe Zone</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="outro_safe"
                      checked={reviewForm.safe_zone.includes('outro_safe')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: [...prev.safe_zone, 'outro_safe']
                          }));
                        } else {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: prev.safe_zone.filter(zone => zone !== 'outro_safe')
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Outro Safe Zone</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="all_ok"
                      checked={reviewForm.safe_zone.includes('all_ok')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: [...prev.safe_zone, 'all_ok']
                          }));
                        } else {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: prev.safe_zone.filter(zone => zone !== 'all_ok')
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">All OK</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="not_applicable"
                      checked={reviewForm.safe_zone.includes('not_applicable')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: [...prev.safe_zone, 'not_applicable']
                          }));
                        } else {
                          setReviewForm(prev => ({ 
                            ...prev, 
                            safe_zone: prev.safe_zone.filter(zone => zone !== 'not_applicable')
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Not Applicable</span>
                  </label>
                </div>
              </div>

              {/* Approval Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Notes (optional)</label>
                <textarea
                  value={reviewForm.approval_notes}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, approval_notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add any notes about this approval..."
                />
              </div>

              {/* Rejection Reason */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason (optional)</label>
                <textarea
                  value={reviewForm.rejection_reason}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, rejection_reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add reason for rejection if applicable..."
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleApproveWithReview(selectedAsset.id)}
                  disabled={reviewForm.safe_zone.length === 0 || !editForm.theme.trim()}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  Approve <span className="text-xs opacity-75">(A)</span>
                </button>
                <button
                  onClick={() => handleRejectWithReview(selectedAsset.id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Reject <span className="text-xs opacity-75">(R)</span>
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setReviewForm({ safe_zone: [], approval_notes: '', rejection_reason: '' });
                    setEditForm({ 
                      title: '',
                      theme: '', 
                      description: '', 
                      tags: '', 
                      prompt: '', 
                      personalization: 'general', 
                      child_name: '', 
                      template: '', 
                      volume: 1.0, 
                      audio_class: '', 
                      letter: '',
                      // Enhanced fields with defaults
                      imageType: '',
                      artStyle: '',
                      aspectRatio: '16:9',
                      ageRange: '',
                      safeZone: 'center_safe',
                      targetLetter: '',
                      additionalContext: ''
                    });
                  }}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel <span className="text-xs opacity-75">(Esc)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Bulk Upload Assets</h3>
                <button
                  onClick={() => setShowBulkUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Files</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleBulkDrop}
                  >
                    {selectedFiles.length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Selected {selectedFiles.length} files:</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="text-xs text-gray-500 flex justify-between items-center">
                              <span>{file.name}</span>
                              <button
                                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                className="text-red-600 hover:text-red-800 ml-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setSelectedFiles([])}
                          className="mt-2 text-red-600 hover:text-red-800 text-sm"
                        >
                          Clear All
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600">Drag and drop multiple files here, or</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 text-green-600 hover:text-green-800"
                        >
                          browse files
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          Supported formats: Images (jpg, png, gif), Audio (mp3, wav, ogg, m4a), Video (mp4, avi, mov, webm), Text (txt, md, doc, docx)
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleBulkFileSelect(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* Common Form Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (applied to all files)</label>
                  <textarea
                    value={bulkUploadForm.description}
                    onChange={(e) => setBulkUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Describe the assets..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (applied to all files)</label>
                  <input
                    type="text"
                    value={bulkUploadForm.tags}
                    onChange={(e) => setBulkUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., birthday, space, adventure (comma separated)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Used (applied to all files)</label>
                  <textarea
                    value={bulkUploadForm.prompt}
                    onChange={(e) => setBulkUploadForm(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Enter the prompt that was used to generate these assets..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personalization Type</label>
                  <select
                    value={bulkUploadForm.personalization}
                    onChange={(e) => setBulkUploadForm(prev => ({ 
                      ...prev, 
                      personalization: e.target.value as 'general' | 'personalized',
                      child_name: e.target.value === 'general' ? '' : prev.child_name
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="general">General</option>
                    <option value="personalized">Personalized</option>
                  </select>
                </div>

                {bulkUploadForm.personalization === 'personalized' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Child Name</label>
                    <input
                      type="text"
                      value={bulkUploadForm.child_name}
                      onChange={(e) => setBulkUploadForm(prev => ({ ...prev, child_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter the child's name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select
                    value={bulkUploadForm.template}
                    onChange={(e) => setBulkUploadForm(prev => ({ ...prev, template: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a template...</option>
                    <option value="lullaby">Lullaby</option>
                    <option value="name-video">Name Video</option>
                    <option value="letter-hunt">Letter Hunt</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-600">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Bulk Upload Information</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>All files will be uploaded with status "pending" for review</li>
                          <li>File types will be auto-detected based on file extensions</li>
                          <li>Themes will be set to the filename (without extension)</li>
                          <li>Common metadata (description, tags, prompt, etc.) will be applied to all files</li>
                          <li>You can review and edit individual assets after upload</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={uploadBulkAssets}
                    disabled={selectedFiles.length === 0 || bulkUploading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {bulkUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files`}
                  </button>
                  <button
                    onClick={() => setShowBulkUploadModal(false)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}