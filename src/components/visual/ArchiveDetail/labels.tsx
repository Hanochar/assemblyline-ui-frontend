import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import { ChipList } from 'components/visual/ChipList';
import CustomChip from 'components/visual/CustomChip';
import { useDebounce } from 'components/visual/HexViewer';
import SectionContainer from 'components/visual/SectionContainer';
import 'moment/locale/fr';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles(theme => ({
  preview: {
    margin: 0,
    padding: theme.spacing(0.75, 1),
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  searchTextFieldOptionsInner: {
    backgroundColor: theme.palette.background.default
  },
  searchTextFieldItem: {
    padding: theme.spacing(1),
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: theme.palette.action.hover
    },
    '&[data-searchtextfieldoption-selected="true"]': {
      backgroundColor: theme.palette.action.selected
    }
  }
}));

const DEFAULT_LABELS = {
  attribution: [],
  technique: [],
  info: []
};

const LABELS: Record<
  keyof typeof DEFAULT_LABELS,
  { color: 'default' | 'primary' | 'error' | 'info' | 'success' | 'warning' | 'secondary' }
> = {
  attribution: { color: 'primary' },
  technique: { color: 'secondary' },
  info: { color: 'default' }
};

type Labels = Partial<Record<keyof typeof DEFAULT_LABELS, string[]>>;

type NewLabel = Record<'value' | 'category', string>;

type Option = {
  category: keyof typeof DEFAULT_LABELS;
  count: number;
  label: string;
};

type Props = {
  sha256: string;
  labels: Labels;
  nocollapse?: boolean;
};

const WrappedLabelSection: React.FC<Props> = ({ sha256 = null, labels: propLabels = null, nocollapse = false }) => {
  const { t } = useTranslation(['archive']);
  const theme = useTheme();
  const classes = useStyles();
  const { apiCall } = useMyAPI();
  const { showSuccessMessage, showErrorMessage } = useMySnackbar();

  const [labels, setLabels] = useState<Labels>(null);
  const [newLabel, setNewLabel] = useState<NewLabel>({ value: '', category: '' });
  const [confirmation, setConfirmation] = useState<{ open: boolean; type: 'add' | 'delete' }>({
    open: false,
    type: 'add'
  });
  const [suggestions, setSuggestions] = useState<Option[]>([]);
  const [selectedOption, setSelectedOption] = useState<Option>(null);
  const [waiting, setWaiting] = useState<boolean>(false);

  const sortedLabels = useMemo<Labels>(() => {
    if (!labels || typeof labels !== 'object') return DEFAULT_LABELS;
    return Object.fromEntries(
      Object.keys(DEFAULT_LABELS).map(cat => [
        cat,
        Array.isArray(labels[cat]) ? labels[cat].sort((a, b) => a.localeCompare(b)) : []
      ])
    );
  }, [labels]);

  const handleCloseConfirmation = useCallback(() => {
    setConfirmation(c => ({ ...c, open: false }));
  }, []);

  const handleAddConfirmation = useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();
    setConfirmation({ open: true, type: 'add' });
    setNewLabel({ value: '', category: '' });
  }, []);

  const handleDeleteConfirmation = useCallback((category: keyof typeof DEFAULT_LABELS, label: string) => {
    setConfirmation({ open: true, type: 'delete' });
    setNewLabel({ value: label, category: category });
  }, []);

  const handleEditingLabelChange = useCallback(
    (key: keyof NewLabel) => event => setNewLabel(l => ({ ...l, [key]: event.target.value })),
    []
  );

  const handleLabelSuggestions = useCallback(
    ({ value, category }: NewLabel) => {
      if (!sha256) return;
      apiCall({
        method: 'POST',
        url: `/api/v4/file/label/`,
        body: {
          include: value,
          mincount: 1,
          size: 10,
          use_archive: true
        },
        onSuccess: ({ api_response }) => setSuggestions(api_response),
        onFailure: ({ api_error_message }) => showErrorMessage(api_error_message)
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sha256, showErrorMessage, showSuccessMessage, t]
  );

  const handleAddLabel = useCallback(
    ({ value, category }: NewLabel) => {
      if (!sha256) return;
      apiCall({
        method: 'PUT',
        url: `/api/v4/file/label/${sha256}/`,
        body: { [category]: [value] },
        onSuccess: ({ api_response }) => {
          const data = api_response?.label_categories ?? {};
          setLabels(l => Object.fromEntries(Object.keys(LABELS).map(k => [k, [...(k in data ? data[k] : [])]])));
          showSuccessMessage(t('label.add.success'));
          setTimeout(() => window.dispatchEvent(new CustomEvent('reloadArchive')), 1000);
        },
        onFailure: ({ api_error_message }) => showErrorMessage(api_error_message),
        onEnter: () => setWaiting(true),
        onExit: () => {
          setWaiting(false);
          setConfirmation({ open: false, type: 'add' });
          setNewLabel({ value: '', category: '' });
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sha256, showErrorMessage, showSuccessMessage, t]
  );

  const handleDeleteLabel = useCallback(
    ({ value, category }: NewLabel) => {
      if (!sha256) return;
      apiCall({
        method: 'DELETE',
        url: `/api/v4/file/label/${sha256}/`,
        body: { [category]: [value] },
        onSuccess: ({ api_response }) => {
          const data = api_response?.label_categories ?? {};
          setLabels(l => Object.fromEntries(Object.keys(LABELS).map(k => [k, [...(k in data ? data[k] : [])]])));
          showSuccessMessage(t('label.delete.success'));
          setTimeout(() => window.dispatchEvent(new CustomEvent('reloadArchive')), 1000);
        },
        onFailure: ({ api_error_message }) => showErrorMessage(api_error_message),
        onEnter: () => setWaiting(true),
        onExit: () => {
          setWaiting(false);
          setConfirmation({ open: false, type: 'delete' });
          setNewLabel({ value: '', category: '' });
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sha256, showErrorMessage, showSuccessMessage, t]
  );

  useEffect(() => {
    setLabels(propLabels);
  }, [propLabels]);

  useDebounce(() => confirmation.open && confirmation.type === 'add' && handleLabelSuggestions(newLabel), 500, [
    confirmation,
    newLabel
  ]);

  return (
    <SectionContainer
      title={t('labels')}
      nocollapse={nocollapse}
      slots={{
        end: (
          <Tooltip title={t('label.add.tooltip')}>
            <span>
              <IconButton
                disabled={!labels}
                size="large"
                style={{
                  color: !labels
                    ? theme.palette.text.disabled
                    : theme.palette.mode === 'dark'
                    ? theme.palette.success.light
                    : theme.palette.success.dark
                }}
                onClick={handleAddConfirmation}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </span>
          </Tooltip>
        )
      }}
    >
      <Dialog open={confirmation.open} onClose={handleCloseConfirmation}>
        <DialogTitle>{t(`label.${confirmation.type === 'add' ? 'add' : 'delete'}.header`)}</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Grid container flexDirection="column" spacing={2}>
              <Grid item children={t(`label.${confirmation.type === 'add' ? 'add' : 'delete'}.content`)} />

              {confirmation.type === 'add' && (
                <>
                  <Grid item>
                    <FormLabel>{t('category')}</FormLabel>
                    <RadioGroup
                      value={newLabel.category}
                      defaultValue="attribution"
                      row
                      onChange={handleEditingLabelChange('category')}
                      sx={{ justifyContent: 'space-around' }}
                    >
                      <FormControlLabel value="attribution" label={t('attribution')} control={<Radio size="small" />} />
                      <FormControlLabel value="technique" label={t('technique')} control={<Radio size="small" />} />
                      <FormControlLabel value="info" label={t('info')} control={<Radio size="small" />} />
                    </RadioGroup>
                  </Grid>
                  <Grid item>
                    <Autocomplete
                      classes={{
                        listbox: classes.searchTextFieldOptionsInner,
                        option: classes.searchTextFieldItem
                      }}
                      value={selectedOption}
                      onChange={(event: any, newValue: Option | null) => {
                        setSelectedOption(newValue);
                        setNewLabel(l =>
                          [null, undefined].includes(newValue)
                            ? { ...l, value: '' }
                            : typeof newValue === 'string'
                            ? { ...l, value: newValue }
                            : { category: newValue?.category, value: newValue?.label }
                        );
                      }}
                      inputValue={newLabel?.value}
                      onInputChange={(event, newInputValue) => {
                        if (event?.type !== 'change') return;
                        setNewLabel(l =>
                          [null, undefined].includes(newInputValue) ? l : { ...l, value: newInputValue }
                        );
                      }}
                      options={suggestions}
                      freeSolo
                      disableClearable
                      getOptionLabel={(option: any) =>
                        [null, undefined, ''].includes(option?.label) ? '' : option?.label
                      }
                      renderOption={(props, option) => {
                        const matches = match(option?.label, newLabel?.value, { insideWords: true });
                        const parts = parse(option?.label, matches);
                        return (
                          <Grid component="li" container {...props} key={JSON.stringify(option)}>
                            <Grid item md={3}>
                              <CustomChip
                                size="small"
                                label={t(option?.category)}
                                color={option?.category in LABELS ? LABELS[option?.category].color : 'primary'}
                                variant="outlined"
                              />
                            </Grid>
                            <Grid item md={8}>
                              {parts.map((part, index) => (
                                <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                                  {part.text}
                                </span>
                              ))}
                            </Grid>
                            <Grid item md={1}>
                              <CustomChip size="small" label={option?.total} />
                            </Grid>
                          </Grid>
                        );
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          autoFocus
                          fullWidth
                          label={t('label')}
                          size="small"
                          variant="outlined"
                          inputProps={{
                            ...params.inputProps,
                            autoComplete: 'search'
                          }}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              {confirmation.type === 'delete' && (
                <Grid item>
                  <Typography variant="subtitle2" children={t(newLabel.category)} />
                  <Paper component="pre" variant="outlined" className={classes.preview}>
                    {newLabel.value}
                  </Paper>
                </Grid>
              )}

              {newLabel?.category in LABELS && ![null, undefined, ''].includes(newLabel?.value) && (
                <Grid item children={t(`label.${confirmation.type === 'add' ? 'add' : 'delete'}.confirm`)} />
              )}
            </Grid>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" children={t('cancel')} onClick={handleCloseConfirmation} />
          <Button
            color="primary"
            autoFocus
            disabled={
              [null, undefined, ''].includes(newLabel?.value) ||
              [null, undefined, ''].includes(newLabel?.category) ||
              waiting
            }
            children={
              <>
                {t(`label.${confirmation.type === 'add' ? 'add' : 'delete'}.ok`)}
                {waiting && (
                  <CircularProgress
                    size={24}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: -12,
                      marginLeft: -12
                    }}
                  />
                )}
              </>
            }
            onClick={confirmation.type === 'add' ? () => handleAddLabel(newLabel) : () => handleDeleteLabel(newLabel)}
          />
        </DialogActions>
      </Dialog>

      {Object.keys(LABELS).map((cat, i) => (
        <Grid key={i} container>
          <Grid item xs={12} sm={3} lg={2}>
            <span style={{ fontWeight: 500 }}>{t(cat)}</span>
          </Grid>
          <Grid item xs={12} sm={9} lg={10}>
            {!labels || !(cat in labels) ? (
              <Skeleton />
            ) : sortedLabels[cat].length === 0 ? (
              <Typography variant="caption" color={theme.palette.text.disabled}>
                {t('none')}
              </Typography>
            ) : (
              <ChipList
                items={sortedLabels[cat].map((value, j) => ({
                  key: `${i}-${j}`,
                  color: cat in LABELS ? LABELS[cat].color : 'primary',
                  label: value,
                  size: 'small',
                  variant: 'outlined',
                  onDelete: () => handleDeleteConfirmation(cat as keyof typeof DEFAULT_LABELS, value)
                }))}
              />
            )}
          </Grid>
        </Grid>
      ))}
    </SectionContainer>
  );
};

export const LabelSection = React.memo(WrappedLabelSection);
export default LabelSection;
