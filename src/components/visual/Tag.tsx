import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import FingerprintOutlinedIcon from '@mui/icons-material/FingerprintOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SelectAllOutlinedIcon from '@mui/icons-material/SelectAllOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import { Divider, ListSubheader, Menu, MenuItem } from '@mui/material';
import { makeStyles } from '@mui/styles';
import useClipboard from 'commons/components/utils/hooks/useClipboard';
import useALContext from 'components/hooks/useALContext';
import useHighlighter from 'components/hooks/useHighlighter';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import useSafeResults from 'components/hooks/useSafeResults';
import CustomChip, { PossibleColors } from 'components/visual/CustomChip';
import { safeFieldValueURI } from 'helpers/utils';
import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import InputDialog from './InputDialog';


const STYLE = { height: 'auto', minHeight: '20px' };
const SEARCH_ICON = <SearchOutlinedIcon style={{ marginRight: '16px' }} />;
const CLIPBOARD_ICON = <AssignmentOutlinedIcon style={{ marginRight: '16px' }} />;
const HIGHLIGHT_ICON = <SelectAllOutlinedIcon style={{ marginRight: '16px' }} />;
const SAFELIST_ICON = <PlaylistAddCheckOutlinedIcon style={{ marginRight: '16px' }} />;
const SIGNATURE_ICON = <FingerprintOutlinedIcon style={{ marginRight: '16px' }} />;
const TRAVEL_EXPLORE_ICON = <TravelExploreOutlinedIcon style={{ marginRight: '16px' }} />;
const LINK_ICON = <LinkOutlinedIcon style={{ marginRight: '2px' }} />;
const initialMenuState = {
  mouseX: null,
  mouseY: null
};

const useStyles = makeStyles(theme => ({
  listSubHeaderRoot: {
    lineHeight: '32px'
  }
}));

type TagProps = {
  type: string;
  value: string;
  lvl?: string | null;
  score?: number | null;
  short_type?: string | null;
  highlight_key?: string;
  safelisted?: boolean;
  fullWidth?: boolean;
  force?: boolean;
  classification?: string | null;
};

type LookupSourceDetails = {
  link: string;
  count: number;
  classification: string;
};

const WrappedTag: React.FC<TagProps> = ({
  type,
  value,
  lvl = null,
  score = null,
  short_type = null,
  highlight_key = null,
  safelisted = false,
  fullWidth = false,
  force = false,
  classification
}) => {
  const { t } = useTranslation();
  const [state, setState] = React.useState(initialMenuState);
  const [safelistDialog, setSafelistDialog] = React.useState(false);
  const [safelistReason, setSafelistReason] = React.useState(null);
  const [waitingDialog, setWaitingDialog] = React.useState(false);
  const navigate = useNavigate();
  const { user: currentUser, configuration: currentUserConfig, scoreToVerdict } = useALContext();
  const { apiCall } = useMyAPI();
  const { showSuccessMessage, showWarningMessage } = useMySnackbar();
  const { isHighlighted, triggerHighlight } = useHighlighter();
  const { copy } = useClipboard();
  const { showSafeResults } = useSafeResults();
  const classes = useStyles();

  const handleClick = useCallback(() => triggerHighlight(highlight_key), [triggerHighlight, highlight_key]);

  const searchTag = useCallback(
    () => navigate(`/search/result?query=result.sections.tags.${type}:${safeFieldValueURI(value)}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, value]
  );

  const externalResults = useRef(null);
  const linkIcon = useRef(null);
  const searchTagExternal = useCallback(source => {
    let url = `/api/v4/federated_lookup/search/${type}/${encodeURIComponent(value)}/`;

    // construct approporiate query param string
    let qs = '';
    if (!!classification) {
      qs += `classification=${encodeURIComponent(classification)}`;
    }
    if (!!source) {
      if (!!qs) {
        qs += '&';
      }
      qs += `sources=${encodeURIComponent(source)}`;
    }
    if (!!qs) {
      url += `?${qs}`;
    }

    apiCall({
      method: 'GET',
      url: url,
      onSuccess: api_data => {
        if (Object.keys(api_data.api_response).length !== 0) {
          showSuccessMessage(t('related_external.found'));
          linkIcon.current = LINK_ICON;
          externalResults.current = Object.keys(api_data.api_response).map((sourceName: keyof LookupSourceDetails) => (
            <p>
              <h3>
                {sourceName}:
                <a href={api_data.api_response[sourceName].link}>{api_data.api_response[sourceName].count} results</a>
              </h3>
            </p>
          ));
        }
        else {
          showWarningMessage(t('related_external.notfound'));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, value, classification]);

  let maliciousness = lvl || scoreToVerdict(score);
  if (safelisted) {
    maliciousness = 'safe';
  }

  const color: PossibleColors = {
    suspicious: 'warning' as 'warning',
    malicious: 'error' as 'error',
    safe: 'success' as 'success',
    info: 'default' as 'default',
    highly_suspicious: 'warning' as 'warning'
  }[maliciousness];

  const handleMenuClick = useCallback(event => {
    event.preventDefault();
    setState({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4
    });
  }, []);

  const handleClose = useCallback(() => {
    setState(initialMenuState);
  }, []);

  const handleMenuCopy = useCallback(() => {
    copy(value, 'clipID');
    handleClose();
  }, [copy, handleClose, value]);

  const handleMenuSearch = useCallback(() => {
    searchTag();
    handleClose();
  }, [searchTag, handleClose]);

  const handleMenuExternalSearch = useCallback(source => {
    searchTagExternal(source);
    handleClose();
  }, [searchTagExternal, handleClose]);

  const handleMenuHighlight = useCallback(() => {
    handleClick();
    handleClose();
  }, [handleClick, handleClose]);

  const handleMenuSafelist = useCallback(() => {
    setSafelistDialog(true);
    handleClose();
  }, [setSafelistDialog, handleClose]);

  const addToSafelist = useCallback(() => {
    const data = {
      tag: {
        type,
        value
      },
      sources: [
        {
          name: currentUser.username,
          reason: [safelistReason],
          type: 'user'
        }
      ],
      type: 'tag'
    };

    apiCall({
      url: `/api/v4/safelist/`,
      method: 'PUT',
      body: data,
      onSuccess: _ => {
        setSafelistDialog(false);
        showSuccessMessage(t('safelist.success'));
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safelistReason, t, type, value]);

  return maliciousness === 'safe' && !showSafeResults && !force ? null : (
    <>
      <InputDialog
        open={safelistDialog}
        handleClose={() => setSafelistDialog(false)}
        handleAccept={addToSafelist}
        handleInputChange={event => setSafelistReason(event.target.value)}
        inputValue={safelistReason}
        title={t('safelist.title')}
        cancelText={t('safelist.cancelText')}
        acceptText={t('safelist.acceptText')}
        inputLabel={t('safelist.input')}
        text={t('safelist.text')}
        waiting={waitingDialog}
      />
      <Menu
        open={state.mouseY !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          state.mouseY !== null && state.mouseX !== null ? { top: state.mouseY, left: state.mouseX } : undefined
        }
      >
        {type.startsWith('file.rule.') && currentUser.roles.includes('signature_view') && (
          <MenuItem
            id="clipID"
            dense
            component={Link}
            to={`/manage/signature/${type.substring(10)}/${value.substring(0, value.indexOf('.'))}/${value.substring(
              value.indexOf('.') + 1
            )}`}
          >
            {SIGNATURE_ICON}
            {t('goto_signature')}
          </MenuItem>
        )}
        <MenuItem id="clipID" dense onClick={handleMenuCopy}>
          {CLIPBOARD_ICON}
          {t('clipboard')}
        </MenuItem>
        {currentUser.roles.includes('submission_view') && (
          <MenuItem dense onClick={handleMenuSearch}>
            {SEARCH_ICON}
            {t('related')}
          </MenuItem>
        )}
        <MenuItem dense onClick={handleMenuHighlight}>
          {HIGHLIGHT_ICON}
          {t('highlight')}
        </MenuItem>
        {currentUser.roles.includes('safelist_manage') && (
          <MenuItem dense onClick={handleMenuSafelist}>
            {SAFELIST_ICON}
            {t('safelist')}
          </MenuItem>
        )}
        {currentUser.roles.includes('submission_view') && currentUserConfig.ui.external_sources?.length &&
          currentUserConfig.ui.external_source_tags?.hasOwnProperty(type) && (
            <div>
              <Divider />
              <ListSubheader disableSticky classes={{ root: classes.listSubHeaderRoot }}>
                {t('related_external')}
              </ListSubheader>

              <MenuItem dense onClick={() => handleMenuExternalSearch(null)}>
                {TRAVEL_EXPLORE_ICON} {t('related_external.all')}
              </MenuItem>

              {currentUserConfig.ui.external_source_tags?.[type]?.map((source, i) =>
                <MenuItem dense key={i} onClick={() => handleMenuExternalSearch(source)}>
                  {TRAVEL_EXPLORE_ICON} {source}
                </MenuItem>
              )}
            </div>
          )}
      </Menu>
      <CustomChip
        wrap
        variant={safelisted ? 'outlined' : 'filled'}
        size="tiny"
        type="rounded"
        color={highlight_key && isHighlighted(highlight_key) ? ('primary' as 'info') : color}
        label={short_type ? `[${short_type.toUpperCase()}] ${value}` : value}
        style={STYLE}
        onClick={highlight_key ? handleClick : null}
        fullWidth={fullWidth}
        onContextMenu={handleMenuClick}
        icon={linkIcon.current}
        tooltip={externalResults.current}
      />
    </>
  );
};

const Tag = React.memo(WrappedTag);
export default Tag;
