import { Button, Grid, makeStyles } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { default as React } from 'react';
import { useTranslation } from 'react-i18next';
import { HexColumnSetting, HexEncoding, HexOffsetBaseSetting, StoreProps, useDispatch } from '../..';

export * from './bodyType';
export * from './column';
export * from './encoding';
export * from './offsetBase';
export * from './OutlinedField';

const useHexStyles = makeStyles(theme => ({
  dialog: {},
  spacer: { flex: 1 }
}));

export const WrappedHexSettings = ({ store }: StoreProps) => {
  const { t } = useTranslation(['hexViewer']);
  const classes = useHexStyles();

  const { onSettingSave, onSettingClose, onSettingReset } = useDispatch();

  return (
    <div>
      <Dialog className={classes.dialog} open={store.setting.open} onClose={() => onSettingClose()}>
        <DialogTitle>{t('settings.title')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12}>
              <Grid container spacing={1} alignItems="center">
                <HexEncoding store={store} />
                {/* <HexBodyTypeSetting store={store} /> */}
                <HexOffsetBaseSetting store={store} />
                <HexColumnSetting store={store} />
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onSettingReset()} color="primary" autoFocus>
            {t('settings.reset')}
          </Button>
          <div className={classes.spacer} />
          <Button onClick={() => onSettingSave()} color="primary" autoFocus>
            {t('settings.save')}
          </Button>
          <Button onClick={() => onSettingClose()} color="primary">
            {t('settings.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export const HexSettings = React.memo(
  WrappedHexSettings,
  (
    prevProps: Readonly<React.PropsWithChildren<StoreProps>>,
    nextProps: Readonly<React.PropsWithChildren<StoreProps>>
  ) =>
    prevProps.store.setting.open === nextProps.store.setting.open &&
    prevProps.store.setting.bodyType === nextProps.store.setting.bodyType &&
    prevProps.store.setting.hex === nextProps.store.setting.hex &&
    prevProps.store.setting.offsetBase === nextProps.store.setting.offsetBase &&
    prevProps.store.setting.layout.column.auto === nextProps.store.setting.layout.column.auto &&
    prevProps.store.setting.layout.column.max === nextProps.store.setting.layout.column.max
);
export default HexSettings;
