import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import YoutubeSearchedForIcon from '@mui/icons-material/YoutubeSearchedFor';
import { Divider, Grid, IconButton, Skeleton, Tooltip, Typography, useTheme } from '@mui/material';
import PageCenter from 'commons/components/pages/PageCenter';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import Classification from 'components/visual/Classification';
import ConfirmationDialog from 'components/visual/ConfirmationDialog';
import CustomChip from 'components/visual/CustomChip';
import Histogram from 'components/visual/Histogram';
import { bytesToSize, safeFieldValue, safeFieldValueURI } from 'helpers/utils';
import 'moment/locale/fr';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Moment from 'react-moment';
import { useNavigate } from 'react-router';
import { Link, useParams } from 'react-router-dom';
import ForbiddenPage from '../403';

export type Badlist = {
  added: string;
  classification: string;
  enabled: boolean;
  attribution: {
    actor: string[];
    campaign: string[];
    category: string[];
    exploit: string[];
    implant: string[];
    family: string[];
    network: string[];
  };
  hashes: {
    md5: string;
    sha1: string;
    sha256: string;
    ssdeep: string;
    tlsh: string;
  };
  file: {
    name: string[];
    size: number;
    type: string;
  };
  id: string;
  sources: {
    classification: string;
    name: string;
    reason: string[];
    type: string;
  }[];
  signature: {
    name: string;
  };
  tag: {
    type: string;
    value: string;
  };
  type: string;
  updated: string;
};

type ParamProps = {
  id: string;
};

type BadlistDetailProps = {
  badlist_id?: string;
  close?: () => void;
};

const BadlistDetail = ({ badlist_id, close }: BadlistDetailProps) => {
  const { t, i18n } = useTranslation(['manageBadlistDetail']);
  const { id } = useParams<ParamProps>();
  const theme = useTheme();
  const [badlist, setBadlist] = useState<Badlist>(null);
  const [histogram, setHistogram] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [waitingDialog, setWaitingDialog] = useState(false);
  const [enableDialog, setEnableDialog] = useState(false);
  const [disableDialog, setDisableDialog] = useState(false);
  const { user: currentUser, c12nDef } = useALContext();
  const { showSuccessMessage } = useMySnackbar();
  const { apiCall } = useMyAPI();
  const navigate = useNavigate();

  useEffect(() => {
    if ((badlist_id || id) && currentUser.roles.includes('badlist_view')) {
      apiCall({
        url: `/api/v4/badlist/${badlist_id || id}/`,
        onSuccess: api_data => {
          setBadlist(api_data.api_response);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badlist_id, id]);

  useEffect(() => {
    if (badlist && currentUser.roles.includes('submission_view')) {
      apiCall({
        method: 'POST',
        url: '/api/v4/search/histogram/result/created/',
        body: {
          query:
            badlist.type === 'file'
              ? `result.sections.heuristic.signature.name:"BADLIST_${badlist_id || id}"`
              : `result.sections.tags.${badlist.tag.type}:${safeFieldValue(badlist.tag.value)}`,
          mincount: 0,
          start: 'now-30d/d',
          end: 'now+1d/d-1s',
          gap: '+1d'
        },
        onSuccess: api_data => {
          setHistogram(api_data.api_response);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badlist]);

  const removeBadlist = () => {
    apiCall({
      url: `/api/v4/badlist/${badlist_id || id}/`,
      method: 'DELETE',
      onSuccess: () => {
        setDeleteDialog(false);
        showSuccessMessage(t('delete.success'));
        if (id) {
          setTimeout(() => navigate('/manage/badlist'), 1000);
        }
        setTimeout(() => window.dispatchEvent(new CustomEvent('reloadBadlist')), 1000);
        close();
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
  };

  const enableHash = () => {
    apiCall({
      body: true,
      url: `/api/v4/badlist/enable/${badlist_id || id}/`,
      method: 'PUT',
      onSuccess: () => {
        setEnableDialog(false);
        showSuccessMessage(t('enable.success'));
        setTimeout(() => window.dispatchEvent(new CustomEvent('reloadBadlist')), 1000);
        setBadlist({ ...badlist, enabled: true });
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
  };

  const disableHash = () => {
    apiCall({
      body: false,
      url: `/api/v4/badlist/enable/${badlist_id || id}/`,
      method: 'PUT',
      onSuccess: () => {
        setDisableDialog(false);
        showSuccessMessage(t('disable.success'));
        setTimeout(() => window.dispatchEvent(new CustomEvent('reloadBadlist')), 1000);
        setBadlist({ ...badlist, enabled: false });
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
  };

  return currentUser.roles.includes('badlist_view') ? (
    <PageCenter margin={!id ? 2 : 4} width="100%">
      <ConfirmationDialog
        open={deleteDialog}
        handleClose={() => setDeleteDialog(false)}
        handleAccept={removeBadlist}
        title={t('delete.title')}
        cancelText={t('delete.cancelText')}
        acceptText={t('delete.acceptText')}
        text={t('delete.text')}
        waiting={waitingDialog}
      />
      <ConfirmationDialog
        open={enableDialog}
        handleClose={() => setEnableDialog(false)}
        handleAccept={enableHash}
        title={t('enable.title')}
        cancelText={t('enable.cancelText')}
        acceptText={t('enable.acceptText')}
        text={t('enable.text')}
        waiting={waitingDialog}
      />
      <ConfirmationDialog
        open={disableDialog}
        handleClose={() => setDisableDialog(false)}
        handleAccept={disableHash}
        title={t('disable.title')}
        cancelText={t('disable.cancelText')}
        acceptText={t('disable.acceptText')}
        text={t('disable.text')}
        waiting={waitingDialog}
      />

      {c12nDef.enforce && (
        <div style={{ paddingBottom: theme.spacing(4) }}>
          <Classification type="outlined" c12n={badlist ? badlist.classification : null} />
        </div>
      )}
      <div style={{ textAlign: 'left' }}>
        <div style={{ paddingBottom: theme.spacing(4) }}>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs>
              <Typography variant="h4">{badlist ? t(`title.${badlist.type}`) : t('title')}</Typography>
              <Typography variant="caption" style={{ wordBreak: 'break-word' }}>
                {badlist ? badlist_id || id : <Skeleton style={{ width: '10rem' }} />}
              </Typography>
            </Grid>
            <Grid item xs={12} sm style={{ textAlign: 'right', flexGrow: 0 }}>
              {badlist ? (
                <>
                  <div style={{ display: 'flex', marginBottom: theme.spacing(1) }}>
                    {currentUser.roles.includes('submission_view') && (
                      <Tooltip title={t('usage')}>
                        <IconButton
                          component={Link}
                          style={{ color: theme.palette.action.active }}
                          to={
                            badlist.type === 'file'
                              ? `/search/?query=sha256:${badlist.hashes.sha256 || badlist_id || id} OR results:${
                                  badlist.hashes.sha256 || badlist_id || id
                                }* OR errors:${badlist.hashes.sha256 || badlist_id || id}* OR file.sha256:${
                                  badlist.hashes.sha256 || badlist_id || id
                                }`
                              : `/search/result/?query=result.sections.tags.${badlist.tag.type}:${safeFieldValueURI(
                                  badlist.tag.value
                                )}`
                          }
                          size="large"
                        >
                          <YoutubeSearchedForIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {currentUser.roles.includes('badlist_manage') && (
                      <Tooltip title={t('remove')}>
                        <IconButton
                          style={{
                            color: theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark
                          }}
                          onClick={() => setDeleteDialog(true)}
                          size="large"
                        >
                          <RemoveCircleOutlineOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                  {currentUser.roles.includes('badlist_manage') && (
                    <CustomChip
                      type="rounded"
                      size="small"
                      style={{ width: '6rem' }}
                      color={badlist.enabled ? 'primary' : 'default'}
                      onClick={badlist.enabled ? () => setDisableDialog(true) : () => setEnableDialog(true)}
                      label={badlist.enabled ? t('enabled') : t('disabled')}
                    />
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex' }}>
                    <Skeleton
                      variant="circular"
                      height="2.5rem"
                      width="2.5rem"
                      style={{ margin: theme.spacing(0.5) }}
                    />
                    <Skeleton
                      variant="circular"
                      height="2.5rem"
                      width="2.5rem"
                      style={{ margin: theme.spacing(0.5) }}
                    />
                  </div>
                  <Skeleton
                    variant="rectangular"
                    height="2rem"
                    width="6rem"
                    style={{
                      marginBottom: theme.spacing(1),
                      marginTop: theme.spacing(1),
                      borderRadius: theme.spacing(1)
                    }}
                  />
                </>
              )}
            </Grid>
          </Grid>
        </div>
        <Grid container spacing={3}>
          <Grid item xs={12} style={{ display: badlist && badlist.type === 'file' ? 'initial' : 'none' }}>
            <Typography variant="h6">{t('hashes')}</Typography>
            <Divider />
            <Grid container>
              <Grid item xs={4} sm={3} lg={2}>
                <span style={{ fontWeight: 500 }}>MD5</span>
              </Grid>
              <Grid
                item
                xs={8}
                sm={9}
                lg={10}
                style={{ fontSize: '110%', fontFamily: 'monospace', wordBreak: 'break-word' }}
              >
                {badlist ? (
                  badlist.hashes.md5 || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3} lg={2}>
                <span style={{ fontWeight: 500 }}>SHA1</span>
              </Grid>
              <Grid
                item
                xs={8}
                sm={9}
                lg={10}
                style={{ fontSize: '110%', fontFamily: 'monospace', wordBreak: 'break-word' }}
              >
                {badlist ? (
                  badlist.hashes.sha1 || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3} lg={2}>
                <span style={{ fontWeight: 500 }}>SHA256</span>
              </Grid>
              <Grid
                item
                xs={8}
                sm={9}
                lg={10}
                style={{ fontSize: '110%', fontFamily: 'monospace', wordBreak: 'break-word' }}
              >
                {badlist ? (
                  badlist.hashes.sha256 || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3} lg={2}>
                <span style={{ fontWeight: 500 }}>SSDeep</span>
              </Grid>
              <Grid
                item
                xs={8}
                sm={9}
                lg={10}
                style={{ fontSize: '110%', fontFamily: 'monospace', wordBreak: 'break-word' }}
              >
                {badlist ? (
                  badlist.hashes.ssdeep || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3} lg={2}>
                <span style={{ fontWeight: 500 }}>TLSH</span>
              </Grid>
              <Grid
                item
                xs={8}
                sm={9}
                lg={10}
                style={{ fontSize: '110%', fontFamily: 'monospace', wordBreak: 'break-word' }}
              >
                {badlist ? (
                  badlist.hashes.tlsh || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                ) : (
                  <Skeleton />
                )}
              </Grid>
            </Grid>
          </Grid>
          {badlist && badlist.file && (
            <Grid item xs={12}>
              <Typography variant="h6">{t('file.title')}</Typography>
              <Divider />
              <Grid container>
                <Grid item xs={4} sm={3} lg={2}>
                  <span style={{ fontWeight: 500 }}>{t('file.name')}</span>
                </Grid>
                <Grid item xs={8} sm={9} lg={10}>
                  {badlist ? badlist.file.name.map((name, i) => <div key={i}>{name}</div>) : <Skeleton />}
                </Grid>
                <Grid item xs={4} sm={3} lg={2}>
                  <span style={{ fontWeight: 500 }}>{t('file.size')}</span>
                </Grid>
                <Grid item xs={8} sm={9} lg={10}>
                  {badlist.file.size ? (
                    <span>
                      {badlist.file.size}
                      <span style={{ fontWeight: 300 }}> ({bytesToSize(badlist.file.size)})</span>
                    </span>
                  ) : (
                    <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                  )}
                </Grid>

                <Grid item xs={4} sm={3} lg={2}>
                  <span style={{ fontWeight: 500 }}>{t('file.type')}</span>
                </Grid>
                <Grid item xs={8} sm={9} lg={10} style={{ wordBreak: 'break-word' }}>
                  {badlist.file.type || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>}
                </Grid>
              </Grid>
            </Grid>
          )}
          {badlist && badlist.tag && (
            <Grid item xs={12}>
              <Typography variant="h6">{t('tag.title')}</Typography>
              <Divider />
              <Grid container>
                <Grid item xs={4} sm={3} lg={2}>
                  <span style={{ fontWeight: 500 }}>{t('tag.type')}</span>
                </Grid>
                <Grid item xs={8} sm={9} lg={10}>
                  {badlist.tag.type}
                </Grid>
                <Grid item xs={4} sm={3} lg={2}>
                  <span style={{ fontWeight: 500 }}>{t('tag.value')}</span>
                </Grid>
                <Grid item xs={8} sm={9} lg={10} style={{ wordBreak: 'break-word' }}>
                  {badlist.tag.value}
                </Grid>
              </Grid>
            </Grid>
          )}
          {badlist && badlist.attribution && (
            <Grid item xs={12}>
              <Typography variant="h6">{t('attribution.title')}</Typography>
              <Divider />
              {Object.keys(badlist.attribution)
                .filter(k => badlist.attribution[k] !== null)
                .map((k, kid) => (
                  <Grid key={kid} container>
                    <Grid item xs={4} sm={3} lg={2}>
                      <span style={{ fontWeight: 500 }}>{t(`attribution.${k}`)}</span>
                    </Grid>
                    <Grid item xs={8} sm={9} lg={10}>
                      {badlist.attribution[k].map((x, i) => (
                        <CustomChip key={i} label={x} size="small" variant="outlined" />
                      ))}
                    </Grid>
                  </Grid>
                ))}
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="h6">{t('sources')}</Typography>
            <Divider />
            {badlist ? (
              badlist.sources.map(src => (
                <Grid key={src.name} container spacing={1}>
                  <Grid item xs={4} sm={3} lg={2}>
                    <span style={{ fontWeight: 500 }}>
                      {src.name} ({t(src.type)})
                    </span>
                  </Grid>
                  <Grid item xs={8} sm={9} lg={10}>
                    {src.reason.map((reason, i) => (
                      <div key={i}>{reason}</div>
                    ))}
                  </Grid>
                </Grid>
              ))
            ) : (
              <Skeleton />
            )}
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">{t('timing')}</Typography>
            <Divider />
            <Grid container>
              <Grid item xs={4} sm={3} lg={2}>
                <span style={{ fontWeight: 500 }}>{t('timing.added')}</span>
              </Grid>
              <Grid item xs={8} sm={9} lg={10}>
                {badlist ? (
                  <div>
                    <Moment format="YYYY-MM-DD">{badlist.added}</Moment>&nbsp; (
                    <Moment fromNow locale={i18n.language}>
                      {badlist.added}
                    </Moment>
                    )
                  </div>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3} lg={2}>
                <span style={{ fontWeight: 500 }}>{t('timing.updated')}</span>
              </Grid>
              <Grid item xs={8} sm={9} lg={10}>
                {badlist ? (
                  <div>
                    <Moment format="YYYY-MM-DD">{badlist.updated}</Moment>&nbsp; (
                    <Moment fromNow locale={i18n.language}>
                      {badlist.updated}
                    </Moment>
                    )
                  </div>
                ) : (
                  <Skeleton />
                )}
              </Grid>
            </Grid>
          </Grid>
          {currentUser.roles.includes('submission_view') && (
            <Grid item xs={12}>
              <Histogram
                dataset={histogram}
                height="300px"
                isDate
                title={t('chart.title')}
                datatype={badlist_id || id}
                verticalLine
              />
            </Grid>
          )}
        </Grid>
      </div>
    </PageCenter>
  ) : (
    <ForbiddenPage />
  );
};

BadlistDetail.defaultProps = {
  badlist_id: null,
  close: () => {}
};

export default BadlistDetail;
