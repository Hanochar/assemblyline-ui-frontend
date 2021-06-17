import { Pagination } from '@material-ui/lab';
import useMyAPI from 'components/hooks/useMyAPI';
import SimpleSearchQuery from 'components/visual/SearchBar/simple-search-query';
import React from 'react';

const MAX_TRACKED_RECORDS = 10000;

type SearchResults = {
  items: any[];
  offset: number;
  rows: number;
  total: number;
};

export interface SearchPagerProps {
  total: number;
  pageSize: number;
  index: string;
  method?: 'POST' | 'GET';
  query: SimpleSearchQuery;
  setResults: (data: SearchResults) => void;
  scrollToTop?: boolean;
  size?: 'small' | 'large' | null;
  setSearching?: (value: boolean) => void | null;
  url?: string;
  [propName: string]: any;
}

const WrappedSearchPager: React.FC<SearchPagerProps> = ({
  total,
  pageSize,
  index,
  method = 'POST',
  query,
  setResults,
  scrollToTop = true,
  size = 'small',
  setSearching = null,
  url = null,
  children,
  ...otherProps
}) => {
  const apiCall = useMyAPI();
  const count = Math.ceil(Math.min(total, MAX_TRACKED_RECORDS) / pageSize);

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    if (setSearching) {
      setSearching(true);
    }
    const pageQuery = new SimpleSearchQuery(query.toString(), query.getDefaultString());
    pageQuery.set('rows', pageSize);
    pageQuery.set('offset', (value - 1) * pageSize);

    apiCall({
      method,
      url: `${url || `/api/v4/search/${index}/`}${method === 'GET' ? `?${pageQuery.toString()}` : ''}`,
      body: method === 'POST' ? pageQuery.getParams() : null,
      onSuccess: api_data => {
        setResults(api_data.api_response);
        if (scrollToTop) {
          window.scrollTo(0, 0);
        }
      },
      onFinalize: () => {
        if (setSearching) {
          setSearching(false);
        }
      }
    });
  };

  return count > 1 ? (
    <Pagination {...otherProps} count={count} onChange={handleChange} shape="rounded" size={size} />
  ) : null;
};

const SearchPager = React.memo(WrappedSearchPager);
export default SearchPager;
