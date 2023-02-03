import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { Drawer, IconButton, useMediaQuery, useTheme } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

export const GD_EVENT_PREVENTED = 'GlobalDrawerClose.Prevented';
export const GD_EVENT_PROCEED = 'GlobalDrawerClose.Proceed';
const XLWidth = '45vw';
const LGWidth = '85%';
const MDWidth = '85%';
const SMWidth = '100%';

const useStyles = makeStyles(theme => ({
  appMain: {
    '@media print': {
      overflow: 'unset !important'
    },
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    overflowX: 'hidden',
    '-webkit-transform': 'translate3d(0, 0, 0)'
  },
  appContent: {
    '@media print': {
      overflow: 'unset !important'
    },
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    flex: 1,
    height: '100%',
    overflowX: 'hidden'
  },
  appRightDrawer: {
    '@media print': {
      display: 'none'
    },
    transition: 'width 225ms cubic-bezier(0, 0, 0.2, 1) 0ms'
  },
  paper: {
    [theme.breakpoints.only('xl')]: {
      width: XLWidth
    },
    [theme.breakpoints.only('lg')]: {
      width: LGWidth
    },
    [theme.breakpoints.only('md')]: {
      width: MDWidth
    },
    [theme.breakpoints.down('sm')]: {
      width: SMWidth
    }
  }
}));

export type DrawerContextProps = {
  closeGlobalDrawer: () => void;
  closeTemporaryDrawer: () => void;
  setGlobalDrawer: (elements: React.ReactElement<any>) => void;
  setDrawerClosePrompt: (boolean) => void;
  globalDrawer: React.ReactElement<any>;
  globalDrawerOpened: boolean;
};

export interface DrawerProviderProps {
  children: React.ReactNode;
}

export const DrawerContext = React.createContext<DrawerContextProps>(null);

function DrawerProvider(props: DrawerProviderProps) {
  const { children } = props;
  const [globalDrawer, setGlobalDrawerState] = useState(null);
  const [globalDrawerOpened, setGlobalDrawerOpened] = useState(false);
  const [drawerClosePrompt, setDrawerClosePrompt] = useState(false);
  const [nextDrawer, setNextDrawer] = useState(null);
  const theme = useTheme();
  const classes = useStyles();
  const isMD = useMediaQuery(theme.breakpoints.only('md'));
  const isLG = useMediaQuery(theme.breakpoints.only('lg'));
  const isXL = useMediaQuery(theme.breakpoints.only('xl'));

  const drawerWidth = isXL ? XLWidth : isLG ? LGWidth : isMD ? MDWidth : SMWidth;

  const setGlobalDrawer = useCallback(
    newDrawer => {
      if (drawerClosePrompt) {
        setNextDrawer(newDrawer);
        window.dispatchEvent(new CustomEvent(GD_EVENT_PREVENTED));
      } else {
        setNextDrawer(null);
        setGlobalDrawerState(newDrawer);
      }
    },
    [drawerClosePrompt]
  );

  useEffect(() => {
    function proceedWithDrawerChange(event: CustomEvent) {
      setNextDrawer(null);
      setGlobalDrawerState(nextDrawer);
    }
    window.addEventListener(GD_EVENT_PROCEED, proceedWithDrawerChange);
    return () => {
      window.removeEventListener(GD_EVENT_PROCEED, proceedWithDrawerChange);
    };
  }, [nextDrawer]);

  useEffect(() => {
    setGlobalDrawerOpened(globalDrawer !== null);
  }, [globalDrawer]);

  const closeGlobalDrawer = useCallback(() => {
    setGlobalDrawer(null);
  }, [setGlobalDrawer]);

  const closeTemporaryDrawer = useCallback(() => {
    if (!isXL) setGlobalDrawer(null);
  }, [isXL, setGlobalDrawer]);

  return (
    <DrawerContext.Provider
      value={{
        closeGlobalDrawer,
        closeTemporaryDrawer,
        setGlobalDrawer,
        setDrawerClosePrompt,
        globalDrawer,
        globalDrawerOpened
      }}
    >
      <div className={classes.appMain} id="globalDrawer">
        {useMemo(
          () => (
            <div className={classes.appContent}>{children}</div>
          ),
          [children, classes.appContent]
        )}
        <Drawer
          open={globalDrawerOpened}
          className={classes.appRightDrawer}
          style={{
            width: globalDrawer ? drawerWidth : 0
          }}
          classes={{ paper: classes.paper }}
          anchor="right"
          variant={isXL ? 'persistent' : 'temporary'}
          onClose={closeGlobalDrawer}
        >
          {useMemo(
            () => (
              <>
                <div
                  id="drawerTop"
                  style={{
                    backgroundColor: theme.palette.background.paper,
                    padding: theme.spacing(1),
                    position: 'sticky',
                    top: 0,
                    zIndex: 5
                  }}
                >
                  <IconButton onClick={closeGlobalDrawer} size="large">
                    <CloseOutlinedIcon />
                  </IconButton>
                </div>
                <div
                  style={{
                    paddingLeft: theme.spacing(2),
                    paddingRight: theme.spacing(2)
                  }}
                >
                  {globalDrawer}
                </div>
              </>
            ),
            [globalDrawer, theme, closeGlobalDrawer]
          )}
        </Drawer>
      </div>
    </DrawerContext.Provider>
  );
}

export default DrawerProvider;
