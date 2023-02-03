import { Button, CircularProgress, TextField } from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
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

type UserPassLoginProps = {
  onSubmit: (event) => void;
  buttonLoading: boolean;
  setPassword: (value: string) => void;
  setUsername: (value: string) => void;
};

export function UserPassLogin({ onSubmit, buttonLoading, setPassword, setUsername }: UserPassLoginProps) {
  const { t } = useTranslation(['login']);
  const classes = useStyles();

  return (
    <form onSubmit={onSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <TextField
          autoFocus
          inputProps={{ autoCorrect: 'off', autoCapitalize: 'off' }}
          variant="outlined"
          size="small"
          label={t('username')}
          onChange={event => setUsername(event.target.value)}
        />
        <TextField
          style={{ marginTop: '.5rem' }}
          variant="outlined"
          size="small"
          type="password"
          label={t('password')}
          onChange={event => setPassword(event.target.value)}
        />
        <Button
          type="submit"
          style={{ marginTop: '1.5rem' }}
          variant="contained"
          color="primary"
          disabled={buttonLoading}
        >
          {t('button')}
          {buttonLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
        </Button>
      </div>
    </form>
  );
}
