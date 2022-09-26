/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Avatar,
  Button,
  CircularProgress,
  createStyles,
  Link,
  makeStyles,
  Typography,
  useTheme
} from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles(() =>
  createStyles({
    buttonProgress: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -12,
      marginLeft: -12
    }
  })
);

type OAuthProps = {
  avatar: string;
  username: string;
  email: string;
  oAuthTokenID: string;
  buttonLoading: boolean;
  onSubmit: (event) => void;
  reset: (event) => void;
};

export function OAuthLogin({ avatar, username, email, oAuthTokenID, buttonLoading, onSubmit, reset }: OAuthProps) {
  const { t } = useTranslation(['login']);
  const classes = useStyles();
  const theme = useTheme();

  return (
    <form onSubmit={onSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', justifyContent: 'center' }}>
        {!oAuthTokenID ? (
          <Skeleton variant="circle" style={{ alignSelf: 'center' }} width={144} height={144} />
        ) : (
          <Avatar style={{ alignSelf: 'center', width: theme.spacing(18), height: theme.spacing(18) }} src={avatar} />
        )}
        <Typography color="textPrimary">{!oAuthTokenID ? <Skeleton /> : username}</Typography>
        <Typography variant="caption" color="textSecondary" gutterBottom>
          {!oAuthTokenID ? <Skeleton /> : email}
        </Typography>
        {!oAuthTokenID ? (
          <Skeleton variant="rect" style={{ height: '36px', marginTop: '1.5rem', marginBottom: '1.5rem' }} />
        ) : (
          <Button
            type="submit"
            style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}
            variant="contained"
            color="primary"
            disabled={buttonLoading}
          >
            {t('button')}
            {buttonLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
          </Button>
        )}
        {!oAuthTokenID ? (
          <Skeleton />
        ) : (
          <Link variant="body2" href="#" onClick={reset}>
            {t('other')}
          </Link>
        )}
      </div>
    </form>
  );
}
