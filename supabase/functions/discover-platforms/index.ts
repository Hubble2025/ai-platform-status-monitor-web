import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DiscoverySource {
  name: string;
  url: string;
  type: 'github' | 'directory' | 'api';
}

interface PlatformCandidate {
  name: string;
  websiteUrl?: string;
  statusPageUrl?: string;
  statusApiUrl?: string;
  apiType?: string;
  category?: string;
}

const DISCOVERY_SOURCES: DiscoverySource[] = [
  {
    name: 'AI Directory',
    url: 'https://ai-collection.org/',
    type: 'directory'
  }
];

// Known status page patterns
const STATUS_PAGE_PATTERNS = [
  /status\.\w+\.com/,
  /\w+\.statuspage\.io/,
  /status\.\w+\.ai/,
  /\w+\.status\.\w+/,
  /uptime\.\w+/,
];

// API format detection patterns
const API_PATTERNS = {
  statuspage: {
    pattern: /statuspage\.io/,
    apiPath: '/api/v2/summary.json',
    type: 'statuspage.io'
  },
  atlassian: {
    pattern: /atlassian\.net/,
    apiPath: '/status.json',
    type: 'atlassian'
  },
  custom: {
    pattern: /\/status|api\/status/,
    apiPath: '',
    type: 'custom'
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, platformUrl, platformName } = await req.json().catch(() => ({
      action: 'discover'
    }));

    let result;

    switch (action) {
      case 'verify':
        // Verify a specific platform URL
        result = await verifyPlatform(supabase, platformUrl, platformName);
        break;
      
      case 'discover':
      default:
        // Run discovery process
        result = await runDiscovery(supabase);
        break;
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Discovery error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function runDiscovery(supabase: any) {
  const discoveredPlatforms: PlatformCandidate[] = [];
  const logs: any[] = [];

  // For MVP, we'll focus on manual verification rather than full crawling
  // This keeps the function lightweight and avoids complex web scraping
  
  const log = {
    source: 'auto-discovery',
    platform_name: 'Discovery System',
    status_url: null,
    success: true,
    error_message: null,
    metadata: {
      message: 'Discovery system initialized. Use verify action to check specific platforms.',
      timestamp: new Date().toISOString()
    }
  };

  await supabase
    .from('discovery_logs')
    .insert(log);

  return {
    success: true,
    discovered: discoveredPlatforms.length,
    platforms: discoveredPlatforms,
    message: 'Discovery system ready. Use verify action to validate specific platforms.'
  };
}

async function verifyPlatform(
  supabase: any, 
  statusUrl: string, 
  platformName: string
): Promise<any> {
  try {
    // Detect API type and format
    const apiInfo = detectApiType(statusUrl);
    
    if (!apiInfo) {
      await logDiscovery(supabase, {
        source: 'manual-verify',
        platform_name: platformName,
        status_url: statusUrl,
        success: false,
        error_message: 'Could not detect API type from URL'
      });
      
      return {
        success: false,
        error: 'Could not detect API type. URL must be a known status page format.'
      };
    }

    // Try to fetch from the API
    const apiUrl = apiInfo.apiUrl;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'AI-Status-Monitor/1.0',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      await logDiscovery(supabase, {
        source: 'manual-verify',
        platform_name: platformName,
        status_url: statusUrl,
        success: false,
        error_message: `API returned status ${response.status}`
      });
      
      return {
        success: false,
        error: `API returned status ${response.status}`,
        apiType: apiInfo.type
      };
    }

    const data = await response.json();
    
    // Validate the response has expected structure
    const isValid = validateApiResponse(data, apiInfo.type);
    
    if (!isValid) {
      await logDiscovery(supabase, {
        source: 'manual-verify',
        platform_name: platformName,
        status_url: statusUrl,
        success: false,
        error_message: 'API response does not match expected format'
      });
      
      return {
        success: false,
        error: 'API response format not recognized',
        apiType: apiInfo.type
      };
    }

    // Check if platform already exists in registry
    const { data: existing } = await supabase
      .from('platform_registry')
      .select('id, name')
      .eq('status_api_url', apiUrl)
      .single();

    if (existing) {
      return {
        success: true,
        exists: true,
        platform: existing,
        message: 'Platform already exists in registry'
      };
    }

    // Add to platform registry as pending
    const { data: newPlatform, error: insertError } = await supabase
      .from('platform_registry')
      .insert({
        name: platformName,
        status_page_url: statusUrl,
        status_api_url: apiUrl,
        api_type: apiInfo.type,
        api_config: apiInfo.config || {},
        verification_status: 'pending',
        auto_discovered: false,
        check_count: 1,
        success_count: 1,
        last_check_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    await logDiscovery(supabase, {
      source: 'manual-verify',
      platform_name: platformName,
      status_url: statusUrl,
      success: true,
      error_message: null,
      metadata: {
        api_type: apiInfo.type,
        api_url: apiUrl,
        registry_id: newPlatform.id
      }
    });

    return {
      success: true,
      platform: newPlatform,
      apiType: apiInfo.type,
      apiUrl: apiUrl,
      message: 'Platform verified and added to registry'
    };

  } catch (error) {
    await logDiscovery(supabase, {
      source: 'manual-verify',
      platform_name: platformName,
      status_url: statusUrl,
      success: false,
      error_message: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

function detectApiType(statusUrl: string): { type: string; apiUrl: string; config?: any } | null {
  try {
    const url = new URL(statusUrl);
    
    // Statuspage.io detection
    if (statusUrl.includes('statuspage.io') || statusUrl.includes('/api/v2/')) {
      const baseUrl = `${url.protocol}//${url.hostname}`;
      return {
        type: 'statuspage.io',
        apiUrl: `${baseUrl}/api/v2/summary.json`
      };
    }
    
    // Atlassian status page
    if (statusUrl.includes('atlassian.net')) {
      const baseUrl = `${url.protocol}//${url.hostname}`;
      return {
        type: 'atlassian',
        apiUrl: `${baseUrl}/api/v2/status.json`
      };
    }
    
    // Try common patterns
    const patterns = [
      { suffix: '/api/v2/summary.json', type: 'statuspage.io' },
      { suffix: '/api/v2/status.json', type: 'statuspage.io' },
      { suffix: '/status.json', type: 'custom' },
      { suffix: '/api/status', type: 'custom' },
    ];
    
    for (const pattern of patterns) {
      const testUrl = `${url.protocol}//${url.hostname}${pattern.suffix}`;
      return {
        type: pattern.type,
        apiUrl: testUrl
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

function validateApiResponse(data: any, apiType: string): boolean {
  if (!data) return false;
  
  switch (apiType) {
    case 'statuspage.io':
      return (
        data.page !== undefined &&
        data.status !== undefined
      );
    
    case 'atlassian':
      return (
        data.status !== undefined ||
        data.state !== undefined
      );
    
    case 'custom':
      return (
        data.status !== undefined ||
        data.state !== undefined ||
        data.operational !== undefined
      );
    
    default:
      return false;
  }
}

async function logDiscovery(supabase: any, log: any) {
  await supabase
    .from('discovery_logs')
    .insert(log);
}
