import {
  Dialog,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { ChipList } from 'components/visual/ChipList';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineExternalLink } from 'react-icons/hi';
import Moment from 'react-moment';
import { useNavigate } from 'react-router';
import AlertPriority from './alert-priority';
import AlertStatus from './alert-status';

const WrappedAlertEventsTable = ({ alert, viewHistory, setViewHistory }) => {
  const { t, i18n } = useTranslation('alerts');
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    viewHistory && (
      <Dialog
        open={viewHistory}
        onClose={(event, reason) => {
          if (reason === 'backdropClick') {
            setViewHistory(false);
          }
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle id="alert-dialog-title">{t('history.events')}</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['ts', 'workflow_or_user', 'priority', 'status', 'labels'].map(column => (
                    <TableCell key={column}>
                      <Typography sx={{ fontWeight: 'bold' }}>{t(column)}</Typography>
                    </TableCell>
                  ))}
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alert.events
                  .sort((a, b) => a.ts.localeCompare(b.ts) || b.ts.localeCompare(a.ts))
                  .reverse()
                  .map(event => {
                    return (
                      <TableRow hover tabIndex={-1}>
                        <Tooltip title={event.ts}>
                          <TableCell>
                            <Moment fromNow locale={i18n.language}>
                              {event.ts}
                            </Moment>
                          </TableCell>
                        </Tooltip>
                        <Tooltip title={event.entity_type} style={{ textTransform: 'capitalize' }}>
                          <TableCell>{event.entity_name}</TableCell>
                        </Tooltip>
                        <TableCell>
                          {event.priority ? <AlertPriority name={event.priority} withChip /> : null}
                        </TableCell>
                        <TableCell>{event.status ? <AlertStatus name={event.status} /> : null}</TableCell>
                        <TableCell width="40%">
                          {event.labels ? (
                            <ChipList items={event.labels.map(label => ({ label, variant: 'outlined' }))} />
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {event.entity_type === 'workflow' ? (
                            <Tooltip
                              title={t('workflow')}
                              onClick={() => {
                                navigate(`/manage/workflow/${event.entity_id}`);
                                setViewHistory(false);
                              }}
                            >
                              <div>
                                <HiOutlineExternalLink
                                  style={{
                                    fontSize: 'x-large',
                                    verticalAlign: 'middle',
                                    color: theme.palette.primary.main
                                  }}
                                />
                              </div>
                            </Tooltip>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    )
  );
};

const AlertEventsTable = React.memo(WrappedAlertEventsTable);
export default AlertEventsTable;
