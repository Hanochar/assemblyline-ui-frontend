(function () {
  // 1. Determine base path (e.g. '/assemblyline-ui-frontend')
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  let basePath = '';

  if (window.location.hostname.endsWith('.github.io') && pathSegments.length > 0) {
    basePath = '/' + pathSegments[0];
  } else if (window.location.pathname.startsWith('/assemblyline-ui-frontend')) {
    basePath = '/assemblyline-ui-frontend';
  }

  // 2. Safeguard URL constructor in case relative base URL is passed (e.g. new URL('theme.json', '/'))
  const OrigURL = window.URL;
  function CustomURL(url, base) {
    if (base !== undefined && typeof base === 'string' && (base.startsWith('/') || (!base.includes('://') && !base.startsWith('data:')))) {
      base = window.location.origin + (base.startsWith('/') ? base : '/' + base);
    }
    if (base === undefined) {
      return new OrigURL(url);
    }
    return new OrigURL(url, base);
  }
  CustomURL.prototype = OrigURL.prototype;
  Object.setPrototypeOf(CustomURL, OrigURL);
  Object.assign(CustomURL, OrigURL);
  window.URL = CustomURL;

  // 3. Intercept window.fetch for API mocks and asset URL rewrites
  const origFetch = window.fetch;
  const allRoles = [
    'administration',
    'alert_manage',
    'alert_view',
    'apikey_access',
    'archive_comment',
    'archive_download',
    'archive_manage',
    'archive_trigger',
    'archive_view',
    'assistant_use',
    'badlist_manage',
    'badlist_view',
    'bundle_download',
    'external_query',
    'file_detail',
    'file_download',
    'file_purge',
    'heuristic_view',
    'obo_access',
    'replay_system',
    'replay_trigger',
    'retrohunt_run',
    'retrohunt_view',
    'safelist_manage',
    'safelist_view',
    'self_manage',
    'signature_download',
    'signature_import',
    'signature_manage',
    'signature_view',
    'submission_create',
    'submission_customize',
    'submission_delete',
    'submission_manage',
    'submission_view',
    'workflow_manage',
    'workflow_view'
  ];
  const indexNames = [
    'alert',
    'badlist',
    'error',
    'file',
    'heuristic',
    'result',
    'retrohunt',
    'safelist',
    'service',
    'signature',
    'submission',
    'user',
    'workflow'
  ];
  const emptySearchResponse = { items: [], total: 0, offset: 0, rows: 25 };
  const demoBannerId = 'assemblyline-demo-banner';
  const demoBannerText = 'Demo mode: this is not a live Assemblyline system. File uploads and submission creation are disabled.';

  const demoServices = [
    {
      name: 'Extract',
      category: 'Static Analysis',
      description: 'Extraction and metadata enrichment for files and archives.',
      enabled: true,
      version: '4.6.0',
      accepts: '.*',
      rejects: '',
      config: { timeout: 30 },
      is_external: false
    },
    {
      name: 'YARA',
      category: 'Static Analysis',
      description: 'YARA rule-based detection for malicious indicators.',
      enabled: true,
      version: '4.6.0',
      accepts: '.*',
      rejects: '',
      config: { timeout: 30 },
      is_external: false
    },
    {
      name: 'CAPA',
      category: 'Static Analysis',
      description: 'Capabilities and behavior extraction from binary artifacts.',
      enabled: true,
      version: '4.6.0',
      accepts: '.*',
      rejects: '',
      config: { timeout: 30 },
      is_external: false
    },
    {
      name: 'Networking',
      category: 'Dynamic Analysis',
      description: 'Network behavior and IOC correlation for sandbox results.',
      enabled: true,
      version: '4.6.0',
      accepts: '(?:application|text)/.*',
      rejects: '',
      config: { timeout: 60 },
      is_external: false
    }
  ];

  const demoAlerts = [
    {
      alert_id: 'AL-202606-000001',
      type: 'network',
      ts: '2026-06-13T10:24:33.000Z',
      score: 725,
      verdict: 'malicious',
      source: 'email',
      owner: 'admin',
      classification: 'TLP:CLEAR',
      response: { service_name: 'YARA' },
      metadata: { filename: 'invoice.pdf', sha256: 'abc123...' }
    },
    {
      alert_id: 'AL-202606-000002',
      type: 'file',
      ts: '2026-06-13T09:14:11.000Z',
      score: 420,
      verdict: 'suspicious',
      source: 'upload',
      owner: 'demo',
      classification: 'TLP:AMBER',
      response: { service_name: 'Extract' },
      metadata: { filename: 'eml_sample.eml', sha256: 'def456...' }
    }
  ];

  const demoSubmissions = [
    {
      id: '2d4d4db3f1f7d4c7d2b0543dc40e1bf7',
      sid: '2d4d4db3f1f7d4c7d2b0543dc40e1bf7',
      submitter: 'admin',
      profile: 'default',
      state: 'completed',
      times: { submitted: '2026-06-13T10:30:00.000Z', completed: '2026-06-13T10:31:30.000Z' },
      classification: 'TLP:CLEAR',
      file_count: 1,
      total_errors: 0,
      error_count: 0,
      max_score: 725,
      services: ['Extract', 'YARA', 'CAPA'],
      params: {
        description: 'Suspicious invoice PDF for triage',
        submitter: 'admin'
      }
    },
    {
      id: '9d8d4a751b1d7fa4d4f0d0d885d6f343',
      sid: '9d8d4a751b1d7fa4d4f0d0d885d6f343',
      submitter: 'analyst',
      profile: 'default',
      state: 'running',
      times: { submitted: '2026-06-13T09:00:00.000Z' },
      classification: 'TLP:GREEN',
      file_count: 2,
      total_errors: 1,
      error_count: 1,
      max_score: 420,
      services: ['Extract', 'Networking'],
      params: {
        description: 'Email attachment investigation',
        submitter: 'analyst'
      }
    }
  ];

  const demoFiles = [
    {
      sha256: 'abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      name: 'invoice.pdf',
      size: 385240,
      type: 'document/pdf',
      classification: 'TLP:CLEAR',
      score: 725,
      state: 'completed'
    },
    {
      sha256: 'def4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      name: 'eml_sample.eml',
      size: 125210,
      type: 'message/rfc822',
      classification: 'TLP:AMBER',
      score: 420,
      state: 'completed'
    }
  ];

  const demoSignatures = [
    {
      id: 'YARA-001',
      name: 'Suspicious_PDF_Indicator',
      type: 'yara',
      state: 'enabled',
      classification: 'TLP:CLEAR',
      source: 'community'
    },
    {
      id: 'YARA-002',
      name: 'Office_Macro_Heuristic',
      type: 'yara',
      state: 'enabled',
      classification: 'TLP:CLEAR',
      source: 'custom'
    }
  ];

  const demoWorkflows = [
    {
      name: 'Priority triage',
      enabled: true,
      description: 'Auto-assigns high-risk submissions to analysis queue.',
      classification: 'TLP:CLEAR'
    },
    {
      name: 'Finance alerts',
      enabled: true,
      description: 'Prioritizes invoice and banking themed malware alerts.',
      classification: 'TLP:AMBER'
    }
  ];

  const demoUsers = [
    {
      id: 'admin',
      uname: 'admin',
      name: 'Demo Admin',
      email: 'admin@cyber.gc.ca',
      is_active: true,
      type: ['admin']
    },
    {
      id: 'analyst',
      uname: 'analyst',
      name: 'Demo Analyst',
      email: 'analyst@example.com',
      is_active: true,
      type: ['user']
    }
  ];

  const getDemoSearchData = function (indexName) {
    return {
      alert: demoAlerts,
      file: demoFiles,
      result: demoResults,
      service: demoServices,
      signature: demoSignatures,
      submission: demoSubmissions,
      user: demoUsers,
      workflow: demoWorkflows
    }[indexName] || [];
  };

  const makeSearchResult = function (items, indexName) {
    return {
      items,
      total: items.length,
      offset: 0,
      rows: 25,
      facets: {
        index: indexName,
        count: items.length
      }
    };
  };

  const demoConfiguration = {
    auth: { allow_2fa: true, allow_apikeys: true, allow_extended_apikeys: true, allow_security_tokens: true, apikey_max_dtl: null },
    core: { archiver: { alternate_dtl: 0, minimum_required_services: [], use_metadata: false }, ingester: { default_max_extracted: 0, default_max_supplementary: 0 }, scaler: { service_defaults: { min_instances: 0 } } },
    datastore: { archive: { enabled: true } },
    retrohunt: { enabled: true, dtl: 30, max_dtl: 30 },
    submission: {
      dtl: 30,
      file_sources: {
        md5: { auto_selected: ['Assemblyline'], pattern: '^[a-f0-9]{32}$', sources: ['Assemblyline'] },
        sha1: { auto_selected: [], pattern: '^[a-f0-9]{40}$', sources: ['Assemblyline'] },
        sha256: { auto_selected: [], pattern: '^[a-f0-9]{64}$', sources: ['Assemblyline'] },
        ssdeep: { auto_selected: [], pattern: '^[0-9]{1,18}:[a-zA-Z0-9/+]{0,64}:[a-zA-Z0-9/+]{0,64}$', sources: [] },
        url: { auto_selected: [], pattern: '', sources: [] }
      },
      max_dtl: 30,
      max_file_size: 104857600,
      metadata: { archive: {}, submit: {}, strict_schemes: [] },
      profiles: {
        default: {
          description: 'Default profile',
          priority: 1000,
          services: { selected: ['Extract', 'YARA', 'CAPA'] },
          service_spec: {}
        }
      },
      verdicts: { info: 0, suspicious: 300, highly_suspicious: 700, malicious: 1000 }
    },
    system: { organisation: 'Demo Org', support: { email: 'support@example.com', url: 'https://example.com/support' }, version: '4.6.0', name: 'Assemblyline', type: 'production' },
    ui: {
      ai: { enabled: false },
      alerting_meta: { important: [], subject: [], url: [] },
      allow_malicious_hinting: true,
      allow_raw_downloads: true,
      allow_zip_downloads: true,
      allow_replay: false,
      allow_url_submissions: true,
      api_proxies: {},
      apps: [],
      banner: {
        en: 'Demo mode: this is not a live Assemblyline system. File uploads and submission creation are disabled.',
        fr: 'Mode démo : il ne s’agit pas d’un système Assemblyline en direct. Les téléversements de fichiers et la création de soumissions sont désactivés.'
      },
      banner_level: 'info',
      enforce_classification: false,
      external_links: {},
      external_sources: [],
      external_source_tags: {},
      fqdn: 'hanochar.github.io',
      read_only: false,
      rss_feeds: [],
      services_feed: '',
      community_feed: '',
      tos: true,
      tos_lockout: false,
      tos_lockout_notify: false,
      url_submission_auto_service_selection: []
    }
  };

  const demoResults = [
    {
      id: 'result-001',
      sha256: 'abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      score: 725,
      classification: 'TLP:CLEAR',
      type: 'analysis',
      result: {
        sections: {
          heuristic: { heur_id: 'H0001', heur_name: 'Suspicious PDF' },
          tags: { file: { rule: { yara: ['Suspicious_PDF_Indicator'] } } }
        }
      }
    },
    {
      id: 'result-002',
      sha256: 'def4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      score: 420,
      classification: 'TLP:AMBER',
      type: 'analysis',
      result: {
        sections: {
          heuristic: { heur_id: 'H0002', heur_name: 'Macro-based Office sample' },
          tags: { file: { rule: { yara: ['Office_Macro_Heuristic'] } } }
        }
      }
    }
  ];

  const demoFileDetail = {
    file_info: {
      sha256: 'abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      md5: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
      sha1: 'abcd1234efgh5678ijkl9012mnop3456qrst7890',
      size: 385240,
      name: 'invoice.pdf',
      type: 'document/pdf',
      classification: 'TLP:CLEAR',
      seen: { first: '2026-06-13T10:30:00.000Z', last: '2026-06-13T10:31:30.000Z' },
      score: 725,
      labels: ['pdf', 'suspicious']
    },
    results: demoResults,
    tags: {
      file: {
        yara: ['Suspicious_PDF_Indicator']
      }
    },
    metadata: {
      author: 'Demo User',
      subject: 'Urgent invoice',
      filename: 'invoice.pdf'
    }
  };

  const demoSubmissionDetail = {
    sid: '2d4d4db3f1f7d4c7d2b0543dc40e1bf7',
    submitter: 'admin',
    state: 'completed',
    profile: 'default',
    classification: 'TLP:CLEAR',
    times: { submitted: '2026-06-13T10:30:00.000Z', completed: '2026-06-13T10:31:30.000Z' },
    file_count: 1,
    files: [demoFileDetail.file_info],
    results: demoResults,
    summary: {
      malicious: 1,
      suspicious: 1,
      info: 0,
      total: 2
    },
    malware: [{ family: 'Suspicious PDF', score: 725 }],
    services: ['Extract', 'YARA', 'CAPA']
  };

  const ensureDemoBanner = function () {
    if (document.getElementById(demoBannerId)) return;

    const banner = document.createElement('div');
    banner.id = demoBannerId;
    banner.textContent = demoBannerText;
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.right = '0';
    banner.style.zIndex = '2147483647';
    banner.style.background = '#8d1f1f';
    banner.style.color = '#fff';
    banner.style.fontSize = '12px';
    banner.style.fontWeight = '700';
    banner.style.letterSpacing = '0.04em';
    banner.style.textAlign = 'center';
    banner.style.padding = '8px 12px';
    banner.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    banner.style.lineHeight = '1.4';
    document.body.prepend(banner);
  };

  const blockDemoSubmission = function () {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          api_error_message: 'Demo mode: file uploads and submission creation are disabled on this GitHub Pages demo instance.',
          api_response: {},
          api_server_version: '4.6.0',
          api_status_code: 403
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    );
  };

  const mockResponse = function (apiResponse, status) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          api_error_message: '',
          api_response: apiResponse,
          api_server_version: '4.6.0',
          api_status_code: status || 200
        }),
        { status: status || 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureDemoBanner, { once: true });
  } else {
    ensureDemoBanner();
  }

  const demoWriteActions = ['/api/v4/file/upload/', '/api/v4/submit/', '/api/v4/submission/'];
  const isWriteAction = function (method, targetUrl) {
    const methodName = (method || 'GET').toUpperCase();
    return methodName !== 'GET' && methodName !== 'HEAD' && targetUrl && demoWriteActions.some(prefix => targetUrl.includes(prefix));
  };

  window.addEventListener('submit', event => {
    const action = (event.target && event.target.action) || '';
    if (action.includes('/api/v4/') || action.includes('/submit') || action.includes('/submission')) {
      event.preventDefault();
      ensureDemoBanner();
      const toast = document.createElement('div');
      toast.textContent = demoBannerText;
      toast.style.position = 'fixed';
      toast.style.left = '50%';
      toast.style.bottom = '24px';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = '#16191f';
      toast.style.color = '#fff';
      toast.style.padding = '10px 14px';
      toast.style.borderRadius = '8px';
      toast.style.fontSize = '12px';
      toast.style.fontWeight = '700';
      toast.style.zIndex = '2147483647';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }
  });

  window.fetch = function (input, init) {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      url = String(input);
    }

    // A. Intercept API requests
    if (url.includes('/api/v4/') || url.includes('/api/')) {
      const methodName = (init && init.method ? init.method : 'GET').toUpperCase();
      const apiPath = new OrigURL(url, window.location.origin).pathname;

      if (isWriteAction(methodName, url) && demoWriteActions.some(prefix => url.includes(prefix))) {
        return blockDemoSubmission();
      }

      if (url.includes('whoami')) {
        const mockWhoAmI = {
          api_error_message: '',
          api_response: {
            agrees_with_tos: Date.now().toString(),
            api_daily_quota: 0,
            api_quota: 0,
            apikeys: {},
            apps: {},
            avatar: null,
            can_impersonate: true,
            classification: 'TLP:CLEAR',
            default_view: null,
            dn: null,
            dynamic_group: null,
            email: 'admin@cyber.gc.ca',
            groups: ['default'],
            id: 'admin',
            is_active: true,
            is_admin: true,
            name: 'Demo Admin',
            otp_sk: null,
            password: '',
            roles: allRoles,
            security_tokens: [],
            submission_async_quota: 0,
            submission_daily_quota: 0,
            submission_quota: 0,
            type: ['admin'],
            uname: 'admin',
            username: 'admin',
            c12nDef: {
              RESTRICTED: 'TLP:AMBER',
              UNRESTRICTED: 'TLP:CLEAR',
              access_req_aliases: {},
              access_req_map_lts: {},
              access_req_map_stl: {},
              description: { 'TLP:CLEAR': 'Clear', 'TLP:GREEN': 'Green', 'TLP:AMBER': 'Amber', 'TLP:RED': 'Red' },
              dynamic_groups: false,
              dynamic_groups_type: 'email',
              enforce: false,
              groups_aliases: {},
              groups_auto_select: [],
              groups_auto_select_short: [],
              groups_map_lts: {},
              groups_map_stl: {},
              invalid_mode: false,
              levels_aliases: {},
              levels_map: { '100': 'TLP:CLEAR', '200': 'TLP:GREEN', '300': 'TLP:AMBER', '400': 'TLP:RED', 'TLP:CLEAR': '100', 'TLP:GREEN': '200', 'TLP:AMBER': '300', 'TLP:RED': '400' },
              levels_map_lts: { 'TLP:CLEAR': 'TLP:CLEAR', 'TLP:GREEN': 'TLP:GREEN', 'TLP:AMBER': 'TLP:AMBER', 'TLP:RED': 'TLP:RED' },
              levels_map_stl: { 'TLP:CLEAR': 'TLP:CLEAR', 'TLP:GREEN': 'TLP:GREEN', 'TLP:AMBER': 'TLP:AMBER', 'TLP:RED': 'TLP:RED' },
              levels_styles_map: {
                'TLP:CLEAR': { color: 'default' },
                'TLP:GREEN': { color: 'success' },
                'TLP:AMBER': { color: 'warning' },
                'TLP:RED': { color: 'error' }
              },
              original_definition: {
                dynamic_groups: false,
                dynamic_groups_type: 'email',
                enforce: false,
                groups: [],
                levels: [
                  { lvl: 100, name: 'TLP:CLEAR', short_name: 'TLP:CLEAR', aliases: [], description: 'N/A', css: { color: 'default' } }
                ],
                required: [],
                restricted: 'TLP:AMBER',
                subgroups: [],
                unrestricted: 'TLP:CLEAR'
              },
              params_map: { 'TLP:CLEAR': {}, 'TLP:GREEN': {}, 'TLP:AMBER': {}, 'TLP:RED': {} },
              subgroups_aliases: {},
              subgroups_map_lts: {},
              subgroups_map_stl: {}
            },
            classification_aliases: { 'TLP:CLEAR': 'TLP:CLEAR', 'TLP:GREEN': 'TLP:GREEN', 'TLP:AMBER': 'TLP:AMBER', 'TLP:RED': 'TLP:RED' },
            indexes: Object.fromEntries(indexNames.map(name => [name, {}])),
            settings: {
              default_external_sources: [],
              default_zip_password: 'infected',
              download_encoding: 'cart',
              executive_summary: true,
              expand_min_score: 500,
              preferred_submission_profile: 'default',
              service_spec: [],
              services: { selected: ['Extract', 'YARA', 'CAPA'] },
              submission_profiles: {
                default: { excluded: [], selected: ['Extract', 'YARA', 'CAPA'], service_spec: {} }
              },
              submission_view: 'report',
              default_metadata: {}
            },
            configuration: {
              auth: {
                allow_2fa: true,
                allow_apikeys: true,
                allow_extended_apikeys: true,
                allow_security_tokens: true,
                apikey_max_dtl: null
              },
              core: {
                archiver: { alternate_dtl: 0, minimum_required_services: [], use_metadata: false },
                ingester: { default_max_extracted: 0, default_max_supplementary: 0 },
                scaler: { service_defaults: { min_instances: 0 } }
              },
              datastore: { archive: { enabled: true } },
              retrohunt: { dtl: 30, enabled: true, max_dtl: 30 },
              submission: {
                dtl: 30,
                file_sources: {
                  md5: { auto_selected: ['Assemblyline'], pattern: '^[a-f0-9]{32}$', sources: ['Assemblyline'] },
                  sha1: { auto_selected: [], pattern: '^[a-f0-9]{40}$', sources: ['Assemblyline'] },
                  sha256: { auto_selected: [], pattern: '^[a-f0-9]{64}$', sources: ['Assemblyline'] },
                  ssdeep: { auto_selected: [], pattern: '^[0-9]{1,18}:[a-zA-Z0-9/+]{0,64}:[a-zA-Z0-9/+]{0,64}$', sources: [] },
                  tlsh: { auto_selected: [], pattern: '^((?:T1)?[0-9a-fA-F]{70})$', sources: [] },
                  url: { auto_selected: [], pattern: '', sources: [] }
                },
                max_dtl: 30,
                max_file_size: 104857600,
                metadata: { archive: {}, submit: {}, strict_schemes: [] },
                profiles: {
                  default: {
                    description: 'Default profile',
                    priority: 1000,
                    services: { selected: ['Extract', 'YARA', 'CAPA'] },
                    service_spec: {}
                  }
                },
                verdicts: { info: 0, suspicious: 300, highly_suspicious: 700, malicious: 1000 }
              },
              system: { organisation: 'Demo Org', support: { email: 'support@example.com', url: 'https://example.com/support' }, version: '4.6.0', name: 'Assemblyline', type: 'production' },
              ui: {
                ai: { enabled: false },
                alerting_meta: { important: [], subject: [], url: [] },
                allow_malicious_hinting: true,
                allow_raw_downloads: true,
                allow_zip_downloads: true,
                allow_replay: false,
                allow_url_submissions: true,
                api_proxies: {},
                apps: [],
                banner: {
                  en: 'Demo mode: this is not a live Assemblyline system. File uploads and submission creation are disabled.',
                  fr: 'Mode démo : il ne s’agit pas d’un système Assemblyline en direct. Les téléversements de fichiers et la création de soumissions sont désactivés.'
                },
                banner_level: 'info',
                enforce_classification: false,
                external_links: {},
                external_sources: [],
                external_source_tags: {},
                fqdn: 'hanochar.github.io',
                read_only: false,
                rss_feeds: [],
                services_feed: '',
                community_feed: '',
                tos: true,
                tos_lockout: false,
                tos_lockout_notify: false,
                url_submission_auto_service_selection: []
              },
              user: {
                api_priv_map: {},
                priv_role_dependencies: {},
                roles: ['administration', 'user'],
                role_dependencies: {},
                types: ['admin', 'user']
              }
            }
          },
          api_server_version: '4.6.0',
          api_status_code: 200
        };

        return Promise.resolve(new Response(JSON.stringify(mockWhoAmI), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }

      if (url.includes('/help/constants/')) {
        return mockResponse({ max_file_size: 104857600 });
      }

      if (apiPath === '/api/v4/help/configuration/') {
        return mockResponse(demoConfiguration);
      }

      if (apiPath === '/api/v4/system/status/ALL/') {
        return mockResponse({ dispatcher: true, ingester: true, retrohunt: true, scaler: true, elastic: true });
      }

      if (apiPath === '/api/v4/alert/statistics/') {
        return mockResponse({
          total: demoAlerts.length,
          counts: {
            malicious: 1,
            suspicious: 1,
            info: 0,
            high: 0,
            medium: 1
          }
        });
      }

      if (/\/api\/v4\/user\/settings\/.+\/$/.test(apiPath)) {
        return mockResponse({
          default_external_sources: [],
          default_zip_password: 'infected',
          download_encoding: 'cart',
          executive_summary: true,
          expand_min_score: 500,
          preferred_submission_profile: 'default',
          submission_profiles: {
            default: {
              excluded: [],
              selected: ['Extract', 'YARA', 'CAPA'],
              service_spec: {}
            }
          },
          submission_view: 'report',
          default_metadata: {}
        });
      }

      if (/\/api\/v4\/user\/submission_params\/.+\/.+\/$/.test(apiPath)) {
        return mockResponse({
          classification: 'TLP:CLEAR',
          description: 'Demo submission',
          groups: ['default'],
          ignore_cache: false,
          ignore_filtering: false,
          priority: 1000,
          service_spec: {},
          services: ['Extract', 'YARA', 'CAPA'],
          submitter: 'admin',
          ttl: 30
        });
      }

      if (/\/api\/v4\/(service\/all|service\/installing)\/$/.test(apiPath)) {
        return mockResponse(demoServices);
      }

      if (/\/api\/v4\/search\/(alert|submission|file|signature|service|workflow)\//.test(apiPath)) {
        const indexName = apiPath.split('/').filter(Boolean)[3];
        return mockResponse(makeSearchResult(getDemoSearchData(indexName), indexName || 'alert'));
      }

      if (/\/api\/v4\/search\/result\//.test(apiPath)) {
        return mockResponse(makeSearchResult(demoResults, 'result'));
      }

      if (/\/api\/v4\/file\/info\/.+\/$/.test(apiPath) || /\/api\/v4\/file\/result\/.+\/$/.test(apiPath)) {
        return mockResponse(demoFileDetail);
      }

      if (/\/api\/v4\/submission\/[A-Za-z0-9]+\/$/.test(apiPath) || /\/api\/v4\/submission\/summary\/.+\/$/.test(apiPath) || /\/api\/v4\/submission\/tree\/.+\/$/.test(apiPath) || /\/api\/v4\/submission\/verdict\/.+\/.+\/$/.test(apiPath)) {
        return mockResponse(demoSubmissionDetail);
      }

      if (/\/api\/v4\/search\/(facet|histogram|fields|stats)\//.test(apiPath)) {
        return mockResponse({
          items: [
            { value: 'Extract', count: 3 },
            { value: 'YARA', count: 2 },
            { value: 'CAPA', count: 1 }
          ],
          total: 3,
          offset: 0,
          rows: 25
        });
      }

      if (apiPath === '/api/v4/service/updates/') return mockResponse({});
      if (/\/api\/v4\/alert\/(statuses|priorities|labels)\/$/.test(apiPath)) return mockResponse([]);
      if (apiPath === '/api/v4/signature/sources/') return mockResponse({});
      if (/\/api\/v4\/profile\//.test(apiPath) || /\/api\/v4\/user\//.test(apiPath)) return mockResponse({});
      if (/\/api\/v4\/submission\//.test(apiPath) && methodName === 'GET') {
        return mockResponse(makeSearchResult(demoSubmissions, 'submission'));
      }

      const searchMatch = apiPath.match(/^\/api\/v4\/search\/([^/]+)\/$/);
      if (searchMatch) {
        const indexName = searchMatch[1];
        return mockResponse(makeSearchResult(getDemoSearchData(indexName), indexName));
      }

      return mockResponse(emptySearchResponse);
    }

    // B. Fix root asset fetches (e.g. /theme.json) when running under a subpath
    if (basePath && typeof input === 'string' && input.startsWith('/') && !input.startsWith(basePath)) {
      input = basePath + input;
    }

    return origFetch.call(this, input, init);
  };

  // 4. Intercept DOM attribute setting for asset resources (images, scripts, links)
  if (basePath) {
    const fixUrl = function (val) {
      if (typeof val === 'string' && val.startsWith('/') && !val.startsWith(basePath) && !val.startsWith('//')) {
        return basePath + val;
      }
      return val;
    };

    const origSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (name === 'src' || name === 'href') {
        value = fixUrl(value);
      }
      return origSetAttribute.call(this, name, value);
    };

    // Override HTMLImageElement.prototype.src descriptor to catch direct property assignments (e.g. img.src = '/images/...')
    const imgSrcDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (imgSrcDesc && imgSrcDesc.set) {
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        get() {
          return imgSrcDesc.get.call(this);
        },
        set(val) {
          imgSrcDesc.set.call(this, fixUrl(val));
        },
        configurable: true,
        enumerable: true
      });
    }
  }
})();
