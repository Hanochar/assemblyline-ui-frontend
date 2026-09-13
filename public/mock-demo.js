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
      const apiPath = new OrigURL(url, window.location.origin).pathname;

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
                default: { priority: 1000, description: 'Default profile' }
              }
            },
            configuration: {
              auth: { allow_2fa: true, allow_apikeys: true, allow_extended_apikeys: true, allow_security_tokens: true, apikey_max_dtl: null },
              core: { archiver: { alternate_dtl: 0, minimum_required_services: [], use_metadata: false }, ingester: { default_max_extracted: 0, default_max_supplementary: 0 }, scaler: { service_defaults: { min_instances: 0 } } },
              datastore: { archive: { enabled: true } },
              retrohunt: { dtl: 30, enabled: true, max_dtl: 0 },
              submission: {
                dtl: 30,
                file_sources: {
                  md5: { auto_selected: ['Assemblyline'], pattern: '^[a-f0-9]{32}$', sources: ['Assemblyline'] },
                  sha1: { auto_selected: [], pattern: '^[a-f0-9]{40}$', sources: ['Assemblyline'] },
                  sha256: { auto_selected: [], pattern: '^[a-f0-9]{64}$', sources: ['Assemblyline'] }
                },
                max_dtl: 0,
                max_file_size: 104857600,
                metadata: { archive: {}, submit: {}, strict_schemes: [] }
              },
              system: { version: '4.6.0', name: 'Assemblyline', type: 'production' },
              ui: { ai: { enabled: false }, apps: [], tos: false, api_proxies: {}, audit: false, enforce_classification: false }
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

      if (/\/api\/v4\/search\/(facet|histogram|fields|stats)\//.test(apiPath)) return mockResponse({});
      if (/\/api\/v4\/(service\/all|service\/installing)\/$/.test(apiPath)) return mockResponse([]);
      if (apiPath === '/api/v4/service/updates/') return mockResponse({});
      if (apiPath === '/api/v4/system/status/ALL/') return mockResponse({ dispatcher: true, ingester: true });
      if (/\/api\/v4\/alert\/(statuses|priorities|labels)\/$/.test(apiPath)) return mockResponse([]);
      if (apiPath === '/api/v4/alert/statistics/') return mockResponse({});
      if (apiPath === '/api/v4/signature/sources/') return mockResponse({});
      if (apiPath === '/api/v4/help/configuration/') return mockResponse({});

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
