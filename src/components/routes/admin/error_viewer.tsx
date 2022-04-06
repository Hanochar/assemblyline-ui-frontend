import { Grid, makeStyles, MenuItem, Select, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import CancelOutlinedIcon from '@material-ui/icons/CancelOutlined';
import PanToolOutlinedIcon from '@material-ui/icons/PanToolOutlined';
import ReportProblemOutlinedIcon from '@material-ui/icons/ReportProblemOutlined';
import useUser from 'commons/components/hooks/useAppUser';
import PageFullWidth from 'commons/components/layout/pages/PageFullWidth';
import PageHeader from 'commons/components/layout/pages/PageHeader';
import useDrawer from 'components/hooks/useDrawer';
import useMyAPI from 'components/hooks/useMyAPI';
import { CustomUser } from 'components/hooks/useMyUser';
import { ChipList } from 'components/visual/ChipList';
import Histogram from 'components/visual/Histogram';
import LineGraph from 'components/visual/LineGraph';
import SearchBar from 'components/visual/SearchBar/search-bar';
import { DEFAULT_SUGGESTION } from 'components/visual/SearchBar/search-textfield';
import SimpleSearchQuery from 'components/visual/SearchBar/simple-search-query';
import SearchPager from 'components/visual/SearchPager';
import ErrorsTable from 'components/visual/SearchResult/errors';
import SearchResultCount from 'components/visual/SearchResultCount';
import 'moment/locale/fr';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Redirect, useHistory, useLocation } from 'react-router-dom';
import { ErrorDetail } from './error_detail';

const PAGE_SIZE = 25;

const useStyles = makeStyles(theme => ({
  searchresult: {
    fontStyle: 'italic',
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end'
  },
  drawerPaper: {
    width: '80%',
    maxWidth: '800px',
    [theme.breakpoints.down('sm')]: {
      width: '100%'
    }
  }
}));

type ErrorResults = {
  items: any[];
  offset: number;
  rows: number;
  total: number;
};

const TC_MAP = {
  null: 'created:[now-24h TO now]',
  '4d': 'created:[now-4d TO now]',
  '7d': 'created:[now-7d TO now]',
  '1m': 'created:[now-1M TO now]'
};

const START_MAP = {
  null: 'now-1d',
  '4d': 'now-4d',
  '7d': 'now-7d',
  '1m': 'now-1M',
  '1y': 'now-1y'
};

const GAP_MAP = {
  null: '1h',
  '4d': '2h',
  '7d': '4h',
  '1m': '1d',
  '1y': '15d'
};

export default function ErrorViewer() {
  const { t } = useTranslation(['adminErrorViewer']);
  const [pageSize] = useState(PAGE_SIZE);
  const [searching, setSearching] = useState(false);
  const [errorResults, setErrorResults] = useState<ErrorResults>(null);
  const classes = useStyles();
  const history = useHistory();
  const [query, setQuery] = useState<SimpleSearchQuery>(null);
  const theme = useTheme();
  const { apiCall } = useMyAPI();
  const { user: currentUser } = useUser<CustomUser>();
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTION);
  const location = useLocation();
  const upMD = useMediaQuery(theme.breakpoints.up('md'));
  const filterValue = useRef<string>('');
  const { closeGlobalDrawer, setGlobalDrawer, globalDrawer } = useDrawer();
  const [histogram, setHistogram] = useState(null);
  const [types, setTypes] = useState(null);
  const [names, setNames] = useState(null);

  useEffect(() => {
    setQuery(new SimpleSearchQuery(location.search, `rows=${pageSize}&offset=0&tc=24h`));
  }, [location.pathname, location.search, pageSize]);

  useEffect(() => {
    if (errorResults !== null && globalDrawer === null && location.hash) {
      history.push(`${location.pathname}${location.search ? location.search : ''}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalDrawer]);

  useEffect(() => {
    if (location.hash) {
      setGlobalDrawer(<ErrorDetail error_key={location.hash.substr(1)} />);
    } else {
      closeGlobalDrawer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash]);

  useEffect(() => {
    if (query && currentUser.is_admin) {
      const curQuery = new SimpleSearchQuery(query.toString(), `rows=${pageSize}&offset=0`);
      const tc = curQuery.pop('tc');
      curQuery.set('rows', pageSize);
      curQuery.set('offset', 0);
      if (tc !== '1y') {
        curQuery.add('filters', TC_MAP[tc]);
      }
      setSearching(true);
      apiCall({
        url: `/api/v4/error/list/?${curQuery.toString()}`,
        onSuccess: api_data => {
          setErrorResults(api_data.api_response);
        },
        onFinalize: () => {
          setSearching(false);
        }
      });
      apiCall({
        url: `/api/v4/search/facet/error/response.service_name/?${curQuery.toString([
          'rows',
          'offset',
          'sort',
          'track_total_hits'
        ])}`,
        onSuccess: api_data => {
          setNames(api_data.api_response);
        }
      });
      apiCall({
        url: `/api/v4/search/facet/error/type/?${curQuery.toString(['rows', 'offset', 'sort', 'track_total_hits'])}`,
        onSuccess: api_data => {
          setTypes(api_data.api_response);
        }
      });
      apiCall({
        url: `/api/v4/search/histogram/error/created/?start=${START_MAP[tc]}&end=now&gap=${
          GAP_MAP[tc]
        }&mincount=0&${curQuery.toString(['rows', 'offset', 'sort', 'track_total_hits'])}`,
        onSuccess: api_data => {
          setHistogram(api_data.api_response);
        }
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    apiCall({
      url: '/api/v4/search/fields/error/',
      onSuccess: api_data => {
        setSuggestions([
          ...Object.keys(api_data.api_response).filter(name => api_data.api_response[name].indexed),
          ...DEFAULT_SUGGESTION
        ]);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onClear = useCallback(
    () => {
      if (query.getAll('filters').length !== 0) {
        query.delete('query');
        history.push(`${location.pathname}?${query.getDeltaString()}`);
      } else {
        history.push(location.pathname);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.pathname, query]
  );

  const onSearch = useCallback(
    () => {
      if (filterValue.current !== '') {
        query.set('query', filterValue.current);
        history.push(`${location.pathname}?${query.getDeltaString()}`);
      } else {
        onClear();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, location.pathname, onClear]
  );

  const onFilterValueChange = (inputValue: string) => {
    filterValue.current = inputValue;
  };

  const setErrorKey = useCallback(
    (error_key: string) => {
      history.push(`${location.pathname}${location.search ? location.search : ''}#${error_key}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.search]
  );

  return currentUser.is_admin ? (
    <PageFullWidth margin={4}>
      <Grid container spacing={2} style={{ paddingBottom: theme.spacing(2) }}>
        <Grid item xs={12} sm={7} md={9} xl={10}>
          <Typography variant="h4">{t('title')}</Typography>
        </Grid>
        <Grid item xs={12} sm={5} md={3} xl={2}>
          <Select
            margin="dense"
            disabled={searching}
            value={query ? query.get('tc') || '24h' : '24h'}
            variant="outlined"
            onChange={event => {
              query.set('tc', event.target.value);
              history.push(`${location.pathname}?${query.getDeltaString()}`);
            }}
            fullWidth
          >
            <MenuItem value="24h">{t('tc.24h')}</MenuItem>
            <MenuItem value="4d">{t('tc.4d')}</MenuItem>
            <MenuItem value="7d">{t('tc.7d')}</MenuItem>
            <MenuItem value="1m">{t('tc.1m')}</MenuItem>
            <MenuItem value="1y">{t('tc.1y')}</MenuItem>
          </Select>
        </Grid>
      </Grid>

      <PageHeader isSticky>
        <div style={{ paddingTop: theme.spacing(1) }}>
          <SearchBar
            initValue={query ? query.get('query', '') : ''}
            placeholder={t('filter')}
            searching={searching}
            suggestions={suggestions}
            onValueChange={onFilterValueChange}
            onClear={onClear}
            onSearch={onSearch}
            buttons={[
              {
                icon: <ReportProblemOutlinedIcon fontSize={upMD ? 'medium' : 'small'} />,
                tooltip: t('exception'),
                props: {
                  onClick: () => {
                    query.set('query', 'type:(EXCEPTION OR UNKNOWN)');
                    history.push(`${location.pathname}?${query.getDeltaString()}`);
                  }
                }
              },
              {
                icon: <CancelOutlinedIcon fontSize={upMD ? 'medium' : 'small'} />,
                tooltip: t('canceled'),
                props: {
                  onClick: () => {
                    query.set('query', 'type:(SERVICE* OR TASK*)');
                    history.push(`${location.pathname}?${query.getDeltaString()}`);
                  }
                }
              },
              {
                icon: <PanToolOutlinedIcon fontSize={upMD ? 'medium' : 'small'} />,
                tooltip: t('maxed'),
                props: {
                  onClick: () => {
                    query.set('query', 'type:MAX*');
                    history.push(`${location.pathname}?${query.getDeltaString()}`);
                  }
                }
              }
            ]}
          >
            {errorResults !== null && (
              <div className={classes.searchresult}>
                {errorResults.total !== 0 && (
                  <Typography variant="subtitle1" color="secondary" style={{ flexGrow: 1 }}>
                    {searching ? (
                      <span>{t('searching')}</span>
                    ) : (
                      <span>
                        <SearchResultCount count={errorResults.total} />
                        {query.get('query')
                          ? t(`filtered${errorResults.total === 1 ? '' : 's'}`)
                          : t(`total${errorResults.total === 1 ? '' : 's'}`)}
                      </span>
                    )}
                  </Typography>
                )}

                <SearchPager
                  method="GET"
                  url="/api/v4/error/list/"
                  total={errorResults.total}
                  setResults={setErrorResults}
                  pageSize={pageSize}
                  index="user"
                  query={query}
                  setSearching={setSearching}
                />
              </div>
            )}

            {query && (
              <div>
                <ChipList
                  items={query.getAll('filters', []).map(v => ({
                    variant: 'outlined',
                    label: `${v}`,
                    color: v.indexOf('NOT ') === 0 ? 'error' : null,
                    onClick: () => {
                      query.replace('filters', v, v.indexOf('NOT ') === 0 ? v.substring(4) : `NOT ${v}`);
                      history.push(`${location.pathname}?${query.getDeltaString()}`);
                    },
                    onDelete: () => {
                      query.remove('filters', v);
                      history.push(`${location.pathname}?${query.getDeltaString()}`);
                    }
                  }))}
                />
              </div>
            )}
          </SearchBar>
        </div>
      </PageHeader>

      {errorResults !== null && errorResults.total !== 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Histogram
              dataset={histogram}
              height="200px"
              title={t(`graph.histogram.title.${query ? query.get('tc') || '24h' : '24h'}`)}
              datatype={t('graph.datatype')}
              isDate
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <LineGraph
              dataset={names}
              height="200px"
              title={t('graph.name.title')}
              datatype={t('graph.datatype')}
              onClick={(evt, element) => {
                if (!searching && element.length > 0) {
                  var ind = element[0].index;
                  query.add('filters', `response.service_name:${Object.keys(names)[ind]}`);
                  history.push(`${location.pathname}?${query.getDeltaString()}`);
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <LineGraph
              dataset={types}
              height="200px"
              title={t('graph.type.title')}
              datatype={t('graph.datatype')}
              onClick={(evt, element) => {
                if (!searching && element.length > 0) {
                  var ind = element[0].index;
                  query.add('filters', `type:"${Object.keys(types)[ind]}"`);
                  history.push(`${location.pathname}?${query.getDeltaString()}`);
                }
              }}
            />
          </Grid>
        </Grid>
      )}

      <div style={{ paddingTop: theme.spacing(2), paddingLeft: theme.spacing(0.5), paddingRight: theme.spacing(0.5) }}>
        <ErrorsTable errorResults={errorResults} setErrorKey={setErrorKey} />
      </div>
    </PageFullWidth>
  ) : (
    <Redirect to="/forbidden" />
  );
}
