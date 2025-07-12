import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface MissingVideoSummary {
  templateType: string;
  childrenMissingVideos: {
    id: string;
    name: string;
    age: number;
    primary_interest: string;
    parent_email: string;
    missingReason: string;
    lastVideoDate?: string;
    totalVideos: number;
  }[];
  totalChildren: number;
  stats: {
    totalWithNoVideos: number;
    totalWithOldVideos: number;
  };
}

export default function VideoStatusDashboard() {
  const [summaries, setSummaries] = useState<Record<string, MissingVideoSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const templateTypes = [
    { key: 'lullaby', name: 'Lullaby Videos', link: '/admin/lullaby-video-request' },
    { key: 'letter-hunt', name: 'Letter Hunt Videos', link: '/admin/letter-hunt-request' },
    { key: 'name-video', name: 'Name Videos', link: '/test-name-video-simple' },
    { key: 'all', name: 'All Videos', link: null }
  ];

  useEffect(() => {
    fetchAllSummaries();
  }, []);

  const fetchAllSummaries = async () => {
    setLoading(true);
    setError(null);

    try {
      const summaryData: Record<string, MissingVideoSummary> = {};

      for (const template of templateTypes) {
        try {
          const response = await fetch(`/api/admin/missing-videos?templateType=${template.key}&daysThreshold=30`);
          
          if (!response.ok) {
            console.warn(`Failed to fetch data for ${template.name}: ${response.status} ${response.statusText}`);
            continue;
          }
          
          const data = await response.json();

          if (data.success && data.stats) {
            summaryData[template.key] = data;
          } else {
            console.warn(`Invalid data format for ${template.name}:`, data);
            // Provide default data structure
            summaryData[template.key] = {
              templateType: template.key,
              childrenMissingVideos: [],
              totalChildren: 0,
              stats: {
                totalWithNoVideos: 0,
                totalWithOldVideos: 0
              }
            };
          }
        } catch (err) {
          console.warn(`Failed to fetch data for ${template.name}:`, err);
          // Provide default data structure on error
          summaryData[template.key] = {
            templateType: template.key,
            childrenMissingVideos: [],
            totalChildren: 0,
            stats: {
              totalWithNoVideos: 0,
              totalWithOldVideos: 0
            }
          };
        }
      }

      setSummaries(summaryData);
    } catch (error) {
      console.error('Error fetching video summaries:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getTotalMissingAcrossAllTemplates = () => {
    const allTemplate = summaries['all'];
    return allTemplate ? allTemplate.childrenMissingVideos.length : 0;
  };

  const getTemplateColor = (templateKey: string, missingCount: number) => {
    if (missingCount === 0) return 'bg-green-50 border-green-200 text-green-800';
    if (missingCount <= 3) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Video Status Dashboard</title>
        </Head>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Video Status Dashboard</h1>
            <div className="grid gap-6">
              {templateTypes.map((template) => (
                <div key={template.key} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Video Status Dashboard</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Video Status Dashboard</h1>
            <button
              onClick={fetchAllSummaries}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              🔄 Refresh All
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {summaries['all']?.totalChildren || 0}
                </div>
                <div className="text-gray-600">Total Children</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {getTotalMissingAcrossAllTemplates()}
                </div>
                <div className="text-gray-600">Missing Recent Videos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {(summaries['all']?.totalChildren || 0) - getTotalMissingAcrossAllTemplates()}
                </div>
                <div className="text-gray-600">Up to Date</div>
              </div>
            </div>
          </div>

          {/* Template Breakdown */}
          <div className="grid gap-6">
            {templateTypes.filter(t => t.key !== 'all').map((template) => {
              const summary = summaries[template.key];
              const missingCount = summary?.childrenMissingVideos.length || 0;
              
              return (
                <div
                  key={template.key}
                  className={`rounded-lg border-2 p-6 ${getTemplateColor(template.key, missingCount)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{template.name}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold">
                        {missingCount} missing
                      </span>
                      {template.link && (
                        <Link
                          href={template.link}
                          className="bg-white text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 border border-gray-300"
                        >
                          Create Videos →
                        </Link>
                      )}
                    </div>
                  </div>                      {summary && summary.stats && (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                            <div>
                              <span className="font-medium">Total Children:</span>
                              <div className="text-lg">{summary.totalChildren || 0}</div>
                            </div>
                            <div>
                              <span className="font-medium">No Videos:</span>
                              <div className="text-lg">{summary.stats?.totalWithNoVideos || 0}</div>
                            </div>
                            <div>
                              <span className="font-medium">Old Videos:</span>
                              <div className="text-lg">{summary.stats?.totalWithOldVideos || 0}</div>
                            </div>
                            <div>
                              <span className="font-medium">Up to Date:</span>
                              <div className="text-lg">
                                {(summary.totalChildren || 0) - missingCount}
                              </div>
                            </div>
                          </div>

                      {missingCount > 0 && (
                        <details className="mt-4">
                          <summary className="cursor-pointer font-medium mb-2">
                            View {missingCount} children needing videos
                          </summary>
                          <div className="grid gap-2 max-h-64 overflow-y-auto">
                            {summary.childrenMissingVideos.map((child) => (
                              <div
                                key={child.id}
                                className="bg-white/50 rounded p-3 text-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium">{child.name}</span>
                                    <span className="text-gray-600 ml-2">
                                      (age {child.age}, {child.primary_interest})
                                    </span>
                                  </div>
                                  <div className="text-right text-xs">
                                    <div>{child.missingReason}</div>
                                    {child.lastVideoDate && (
                                      <div className="text-gray-500">
                                        Last: {new Date(child.lastVideoDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-gray-600 text-xs mt-1">
                                  {child.parent_email}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/lullaby-video-request"
                className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 text-center"
              >
                Create Lullaby Videos
              </Link>
              <Link
                href="/admin/letter-hunt-request"
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 text-center"
              >
                Create Letter Hunt Videos
              </Link>
              <Link
                href="/test-name-video-simple"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 text-center"
              >
                Create Name Videos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
