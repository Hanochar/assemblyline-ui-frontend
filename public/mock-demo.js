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
    if (typeof base === 'string' && (base.startsWith('/') || (!base.includes('://') && !base.startsWith('data:')))) {
      base = window.location.origin + (base.startsWith('/') ? base : '/' + base);
    }
    return new OrigURL(url, base);
  }
  CustomURL.prototype = OrigURL.prototype;
  Object.setPrototypeOf(CustomURL, OrigURL);
  window.URL = CustomURL;

  // 3. Intercept Location.prototype.pathname for React Router (basename="/")
  if (basePath) {
    const origPathnameDesc = Object.getOwnPropertyDescriptor(Location.prototype, 'pathname');
    if (origPathnameDesc && origPathnameDesc.get) {
      Object.defineProperty(Location.prototype, 'pathname', {
        get() {
          const raw = origPathnameDesc.get.call(this);
          if (raw.startsWith(basePath)) {
            const stripped = raw.slice(basePath.length);
            return stripped.startsWith('/') ? stripped : '/' + stripped;
          }
          return raw;
        },
        configurable: true
      });
    }

    // Intercept history.pushState and history.replaceState to re-attach basePath
    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;

    history.pushState = function (state, title, url) {
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith(basePath)) {
        url = basePath + url;
      }
      return origPushState.call(this, state, title, url);
    };

    history.replaceState = function (state, title, url) {
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith(basePath)) {
        url = basePath + url;
      }
      return origReplaceState.call(this, state, title, url);
    };
  }

  // 3. Intercept window.fetch for API mocks and asset URL rewrites
  const origFetch = window.fetch;
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
            roles: ['administration'],
            security_tokens: [],
            submission_async_quota: 0,
            submission_daily_quota: 0,
            submission_quota: 0,
            type: ['user'],
            uname: 'admin',
            username: 'admin',
            configuration: {
              system: { version: '4.6.0' },
              ui: {
                apps: [],
                tos: false,
                api_proxies: {}
              }
            }
          },
          api_server_version: '4.6.0',
          api_status_code: 200
        };

        return Promise.resolve(
          new Response(JSON.stringify(mockWhoAmI), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        );
      }

      // Default mock API response for other API requests
      return Promise.resolve(
        new Response(
          JSON.stringify({
            api_error_message: '',
            api_response: {},
            api_server_version: '4.6.0',
            api_status_code: 200
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      );
    }

    // B. Fix root asset fetches (e.g. /theme.json) when running under a subpath
    if (basePath && typeof input === 'string' && input.startsWith('/') && !input.startsWith(basePath)) {
      input = basePath + input;
    }

    return origFetch.call(this, input, init);
  };

  // 4. Intercept DOM attribute setting for asset resources (images, scripts, links)
  if (basePath) {
    const origSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (
        (name === 'src' || name === 'href') &&
        typeof value === 'string' &&
        value.startsWith('/') &&
        !value.startsWith(basePath) &&
        !value.startsWith('//')
      ) {
        value = basePath + value;
      }
      return origSetAttribute.call(this, name, value);
    };
  }
})();
