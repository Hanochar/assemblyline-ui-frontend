import {
  Box,
  Collapse,
  createStyles,
  IconButton,
  Link,
  makeStyles,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme,
  Tooltip,
  useTheme,
  withStyles
} from '@material-ui/core';
import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FingerprintOutlinedIcon from '@material-ui/icons/FingerprintOutlined';
import LabelOutlinedIcon from '@material-ui/icons/LabelOutlined';
import SimCardOutlinedIcon from '@material-ui/icons/SimCardOutlined';
import { TreeItem, TreeView } from '@material-ui/lab';
import clsx from 'clsx';
import useClipboard from 'commons/components/hooks/useClipboard';
import useALContext from 'components/hooks/useALContext';
import useHighlighter from 'components/hooks/useHighlighter';
import Attack from 'components/visual/Attack';
import Classification from 'components/visual/Classification';
import Heuristic from 'components/visual/Heuristic';
import SectionHighlight from 'components/visual/SectionHighlight';
import Tag from 'components/visual/Tag';
import TitleKey from 'components/visual/TitleKey';
import Verdict from 'components/visual/Verdict';
import { scaleLinear } from 'd3-scale';
import { scoreToVerdict } from 'helpers/utils';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactJson from 'react-json-view';
import { ImageBody } from './image_section';

const CLIPBOARD_ICON = <AssignmentOutlinedIcon style={{ marginRight: '16px' }} />;
const HEURISTIC_ICON = <SimCardOutlinedIcon style={{ marginRight: '16px' }} />;
const TAGS_ICON = <LabelOutlinedIcon style={{ marginRight: '16px' }} />;
const ATTACK_ICON = (
  <span
    style={{
      display: 'inline-flex',
      width: '24px',
      height: '24px',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '16px',
      fontSize: '1.125rem'
    }}
  >
    {'[&]'}
  </span>
);

const useStyles = makeStyles(theme => ({
  section_title: {
    display: 'flex',
    alignItems: 'baseline',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      cursor: 'pointer'
    }
  },
  printable_section_title: {
    display: 'flex',
    alignItems: 'center'
  },
  memdump: {
    '@media print': {
      backgroundColor: '#00000005',
      border: '1px solid #DDD'
    },
    backgroundColor: theme.palette.type === 'dark' ? '#ffffff05' : '#00000005',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '4px',
    padding: '4px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: '0.25rem 0'
  },
  json: {
    '@media print': {
      backgroundColor: '#00000005',
      border: '1px solid #DDD'
    },
    backgroundColor: theme.palette.type === 'dark' ? '#ffffff05' : '#00000005',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '4px',
    padding: '4px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: '0.25rem 0'
  }
}));

const useTreeItemStyles = makeStyles((theme: Theme) => ({
  root: {
    '&:hover > .MuiTreeItem-content': {
      backgroundColor: 'transparent'
    },
    '&:focus > .MuiTreeItem-content, &$root.Mui-selected > .MuiTreeItem-content': {
      backgroundColor: 'transparent'
    },
    '&:focus > .MuiTreeItem-content .MuiTreeItem-label, &:hover > .MuiTreeItem-content .MuiTreeItem-label, &$root.Mui-selected > .MuiTreeItem-content .MuiTreeItem-label':
      {
        backgroundColor: 'transparent'
      }
  },
  treeItem: {
    '@media print': {
      border: '1px solid #DDD'
    },
    [theme.breakpoints.up('md')]: {
      width: '40rem'
    },
    [theme.breakpoints.up('lg')]: {
      width: '50rem'
    },
    border: `1px solid ${theme.palette.divider}`,
    margin: '0.2em 0em',
    borderRadius: '4px',
    display: 'flex',
    maxWidth: '50rem',
    minWidth: '30rem'
  },
  pid: {
    '@media print': {
      backgroundColor: '#00000010'
    },
    padding: '5px',
    backgroundColor: theme.palette.type === 'dark' ? '#FFFFFF10' : '#00000010',
    borderRadius: '4px 0px 0px 4px'
  },
  signature: {
    '@media print': {
      color: 'black'
    },
    alignSelf: 'center',
    color: theme.palette.text.secondary
  },
  suspicious: {
    '@media print': {
      backgroundColor: '#ffedd4'
    },
    backgroundColor: theme.palette.type === 'dark' ? '#654312' : '#ffedd4'
  },
  malicious: {
    '@media print': {
      backgroundColor: '#ffd0d0'
    },
    backgroundColor: theme.palette.type === 'dark' ? '#4e2525' : '#ffd0d0'
  }
}));

const TextBody = ({ body }) => <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{body}</div>;

const MemDumpBody = ({ body }) => {
  const classes = useStyles();
  return <pre className={classes.memdump}>{body}</pre>;
};

const KVBody = ({ body }) => (
  <table cellSpacing={0}>
    <tbody>
      {Object.keys(body).map((key, id) => {
        let value = body[key];
        if (value instanceof Array) {
          value = value.join(' | ');
        } else if (value === true) {
          value = 'true';
        } else if (value === false) {
          value = 'false';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        return (
          <tr key={id}>
            <td style={{ paddingRight: '16px', wordBreak: 'normal' }}>
              <TitleKey title={key} />
            </td>
            <td style={{ wordBreak: 'break-word' }}>{value}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const GraphBody = ({ body }) => {
  const theme = useTheme();
  if (body.type === 'colormap') {
    const colorRange = ['#87c6fb', '#111920'];
    const itemWidthPct = 100 / body.data.values.length;
    const colorScale = scaleLinear().domain(body.data.domain).range(colorRange);
    return (
      <svg width="100%" height="70">
        <rect y={10} x={0} width={15} height={15} fill={colorRange[0]} />
        <text y={22} x={20} fill={theme.palette.text.primary}>{`: ${body.data.domain[0]}`}</text>
        <rect y={10} x={80} width={15} height={15} fill={colorRange[1]} />
        <text y={22} x={100} fill={theme.palette.text.primary}>{`: ${body.data.domain[1]}`}</text>
        {body.data.values.map((value, i) => (
          <rect
            key={i}
            y={30}
            x={`${i * itemWidthPct}%`}
            width={`${itemWidthPct}%`}
            height={40}
            stroke={colorScale(value)}
            fill={colorScale(value)}
          />
        ))}
      </svg>
    );
  }
  return <div style={{ margin: '2rem' }}>Unsupported graph...</div>;
};

const URLBody = ({ body }) => {
  const arr = [];
  if (!(body instanceof Array)) {
    arr.push(body);
  } else {
    Array.prototype.push.apply(arr, body);
  }

  return (
    <ul
      style={{
        listStyleType: 'none',
        paddingInlineStart: 0,
        marginBlockStart: '0.25rem',
        marginBlockEnd: '0.25rem'
      }}
    >
      {arr.map((item, id) => (
        <li key={id}>
          <Link href={item.url}>{item.name ? item.name : item.url}</Link>
        </li>
      ))}
    </ul>
  );
};

const JSONBody = ({ body, printable }) => {
  const classes = useStyles();
  const theme = useTheme();

  if (printable) {
    const pprint = JSON.stringify(body, undefined, 2);
    return (
      <pre id="json" className={classes.json}>
        <code>{pprint}</code>
      </pre>
    );
  } else {
    const jsonTheme = {
      base00: 'transparent', // Background
      base01: '#f1f1f1', // Edit key text
      base02: theme.palette.type === 'dark' ? theme.palette.text.hint : theme.palette.divider, // Borders and DataType Background
      base03: '#444', // Unused
      base04: theme.palette.grey[theme.palette.type === 'dark' ? 700 : 400], // Object size and Add key border
      base05: theme.palette.grey[theme.palette.type === 'dark' ? 700 : 700], // Undefined and Add key background
      base06: '#444', // Unused
      base07: theme.palette.text.primary, // Brace, Key and Borders
      base08: theme.palette.text.secondary, // NaN
      base09: theme.palette.type === 'dark' ? theme.palette.warning.light : theme.palette.warning.dark, // Strings and Icons
      base0A: '#333', // Null, Regex and edit color
      base0B: theme.palette.type === 'dark' ? theme.palette.error.light : theme.palette.error.dark, // Float
      base0C: theme.palette.type === 'dark' ? theme.palette.secondary.light : theme.palette.secondary.dark, // Array Key
      base0D: theme.palette.type === 'dark' ? theme.palette.info.light : theme.palette.info.dark, // Date, function, expand icon
      base0E: theme.palette.type === 'dark' ? theme.palette.info.light : theme.palette.info.dark, // Boolean
      base0F: theme.palette.type === 'dark' ? theme.palette.error.light : theme.palette.error.dark // Integer
    };

    return (
      <ReactJson
        name={false}
        src={body}
        theme={jsonTheme}
        enableClipboard={false}
        collapsed
        groupArraysAfterLength={10}
        displayDataTypes={false}
        displayObjectSize={false}
        style={{
          backgroundColor: theme.palette.type === 'dark' ? '#FFFFFF05' : '#00000005',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
          padding: '4px'
        }}
      />
    );
  }
};

const ProcessTreeItem = ({ process }) => {
  const { t } = useTranslation(['fileDetail']);
  const classes = useTreeItemStyles();
  const classMap = {
    suspicious: classes.suspicious,
    highly_suspicious: classes.suspicious,
    malicious: classes.malicious
  };

  return (
    <TreeItem
      nodeId={process.process_pid.toString()}
      classes={{
        root: classes.root
      }}
      label={
        <div
          className={clsx(
            classes.treeItem,
            classMap[
              scoreToVerdict(
                Object.keys(process.signatures).reduce((sum, key) => sum + parseFloat(process.signatures[key] || 0), 0)
              )
            ]
          )}
        >
          <div className={classes.pid}>{process.process_pid}</div>
          <div style={{ padding: '5px', flexGrow: 1, wordBreak: 'break-word' }}>
            <div style={{ paddingBottom: '5px' }}>
              <b>{process.process_name}</b>
            </div>
            <div>
              <samp>
                <small>{process.command_line}</small>
              </samp>
            </div>
          </div>
          <div className={classes.signature}>
            {Object.keys(process.signatures).length !== 0 && (
              <div>
                <Tooltip title={`${t('process_signatures')}: ${Object.keys(process.signatures).join(' | ')}`}>
                  <span>
                    {Object.keys(process.signatures).length}x
                    <FingerprintOutlinedIcon style={{ verticalAlign: 'middle' }} />
                  </span>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      }
    >
      {process.children.length !== 0 && <ProcessTreeItemList processes={process.children} />}
    </TreeItem>
  );
};

const ProcessTreeItemList = ({ processes }) =>
  processes.map((process, id) => <ProcessTreeItem key={id} process={process} />);

const ProcessTreeBody = ({ body }) => {
  try {
    const expanded = [];

    // Auto-expand first two levels
    body.forEach(process => {
      if (process.process_pid !== undefined && process.process_pid !== null) {
        expanded.push(process.process_pid.toString());
      }
      if (process.children !== undefined && process.children !== null && process.children.length !== 0) {
        process.children.forEach(subprocess => {
          if (subprocess.process_pid !== undefined && subprocess.process_pid !== null) {
            expanded.push(subprocess.process_pid.toString());
          }
        });
      }
    });

    return (
      <div style={{ overflowX: 'auto' }}>
        <TreeView
          defaultExpanded={expanded}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
        >
          <ProcessTreeItemList processes={body} />
        </TreeView>
      </div>
    );
  } catch (ex) {
    // eslint-disable-next-line no-console
    console.log('[WARNING] Could not parse ProcessTree body. The section will be skipped...');
  }
  return null;
};

const StyledTableCell = withStyles((theme: Theme) =>
  createStyles({
    root: {
      '@media print': {
        color: 'black'
      },
      fontSize: 'inherit',
      lineHeight: 'inherit'
    },
    head: {
      '@media print': {
        color: 'black',
        backgroundColor: '#DDD !important'
      },
      backgroundColor: theme.palette.type === 'dark' ? '#404040' : '#EEE'
    },
    body: {
      [theme.breakpoints.up('md')]: {
        wordBreak: 'break-word'
      }
    }
  })
)(TableCell);

const StyledTableRow = withStyles((theme: Theme) =>
  createStyles({
    root: {
      '&:nth-of-type(odd)': {
        '@media print': {
          backgroundColor: '#EEE !important'
        },
        backgroundColor: theme.palette.type === 'dark' ? '#ffffff08' : '#00000008'
      }
    }
  })
)(TableRow);

const StyledTable = withStyles((theme: Theme) =>
  createStyles({
    root: {
      [theme.breakpoints.down('sm')]: {
        '@media print': {
          width: '100%'
        },
        width: 'max-content'
      }
    }
  })
)(Table);

const TblBody = ({ body, printable }) => {
  const headers = [];

  if (body) {
    for (const line of body) {
      // eslint-disable-next-line guard-for-in
      for (const th in line) {
        const val = line[th];
        if (val !== null && val !== '') {
          if (!headers.includes(th)) {
            headers.push(th);
          }
        }
      }
    }
  }

  return (
    body && (
      <TableContainer style={{ fontSize: '90%', maxHeight: printable ? null : '500px' }}>
        <StyledTable stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headers.map((th, id) => (
                <StyledTableCell key={id}>
                  <TitleKey title={th} />
                </StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {body.map((row, id) => (
              <StyledTableRow key={id}>
                {headers.map((key, hid) => {
                  let value = row[key];
                  if (value instanceof Array) {
                    value = value.join(' | ');
                  } else if (value === true) {
                    value = 'true';
                  } else if (value === false) {
                    value = 'false';
                  } else if (typeof value === 'object' && value !== null && value !== undefined) {
                    value = <KVBody body={value} />;
                  }
                  return <StyledTableCell key={hid}>{value}</StyledTableCell>;
                })}
              </StyledTableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableContainer>
    )
  );
};

export type SectionItem = {
  children: SectionItem[];
  id: number;
};

export type Section = {
  auto_collapse: boolean;
  body: any;
  body_format: string;
  classification: string;
  depth: number;
  heuristic: {
    attack: {
      attack_id: string;
      categories: string[];
      pattern: string;
    }[];
    heur_id: string;
    name: string;
    score: number;
    signature: {
      frequency: number;
      name: string;
      safe: boolean;
    }[];
  };
  tags: {
    type: string;
    short_type: string;
    value: string;
    safelisted: boolean;
  }[];
  title_text: string;
};

type ResultSectionProps = {
  section: Section;
  section_list?: Section[];
  sub_sections?: SectionItem[];
  indent?: number;
  depth?: number;
  nested?: boolean;
  printable?: boolean;
};

const ResultSection: React.FC<ResultSectionProps> = ({
  section,
  section_list = [],
  sub_sections = [],
  indent = 1,
  depth = 1,
  nested = false,
  printable = false
}) => {
  const { t } = useTranslation(['fileDetail']);
  const classes = useStyles();
  const theme = useTheme();
  const [open, setOpen] = React.useState(!section.auto_collapse);
  const [showTags, setShowTags] = React.useState(false);
  const [showHeur, setShowHeur] = React.useState(false);
  const [showAttack, setShowAttack] = React.useState(false);
  const { getKey, hasHighlightedKeys } = useHighlighter();
  const { c12nDef } = useALContext();
  const [state, setState] = React.useState(null);
  const { copy } = useClipboard();

  const allTags = useMemo(() => {
    const tagList = [];
    if (!printable) {
      if (Array.isArray(section.tags)) {
        for (const tag of section.tags) {
          tagList.push(getKey(tag.type, tag.value));
        }
      }

      if (section.heuristic !== undefined && section.heuristic !== null) {
        if (section.heuristic.attack !== undefined && section.heuristic.attack.length !== 0) {
          for (const attack of section.heuristic.attack) {
            tagList.push(getKey('attack_pattern', attack.attack_id));
          }
        }
        if (section.heuristic.heur_id !== undefined && section.heuristic.heur_id !== null) {
          tagList.push(getKey('heuristic', section.heuristic.heur_id));
        }
        if (section.heuristic.signature !== undefined && section.heuristic.signature.length !== 0) {
          for (const signature of section.heuristic.signature) {
            tagList.push(getKey('heuristic.signature', signature.name));
          }
        }
      }
    }
    return tagList;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const highlighted = hasHighlightedKeys(allTags);

  const handleMenuClick = useCallback(
    event => {
      if (!printable) {
        event.preventDefault();
        setState(
          state === null
            ? {
                mouseX: event.clientX - 2,
                mouseY: event.clientY - 4
              }
            : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
              // Other native context menus might behave different.
              // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
              null
        );
      }
    },
    [printable, state]
  );

  const stopPropagation = useCallback(event => {
    event.stopPropagation();
  }, []);

  const handleClick = useCallback(() => {
    setOpen(!open);
  }, [open]);

  const handleClose = useCallback(() => {
    setState(null);
  }, []);

  const handleShowTags = useCallback(() => {
    if (!showTags) setOpen(true);
    setShowTags(!showTags);
    handleClose();
  }, [showTags, handleClose]);

  const handleShowAttack = useCallback(() => {
    if (!showAttack) setOpen(true);
    setShowAttack(!showAttack);
    handleClose();
  }, [showAttack, handleClose]);

  const handleShowHeur = useCallback(() => {
    if (!showHeur) setOpen(true);
    setShowHeur(!showHeur);
    handleClose();
  }, [showHeur, handleClose]);

  const handleMenuCopy = useCallback(() => {
    copy(typeof section.body === 'string' ? section.body : JSON.stringify(section.body, undefined, 2), 'clipID');
    handleClose();
  }, [copy, handleClose, section.body]);

  return (
    <>
      <Menu
        open={state !== null && !printable}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={state !== null ? { top: state.mouseY, left: state.mouseX } : undefined}
      >
        <MenuItem id="clipID" dense onClick={handleMenuCopy}>
          {CLIPBOARD_ICON}
          {t('clipboard')}
        </MenuItem>
        {!highlighted && section.heuristic && (
          <MenuItem
            dense
            onClick={handleShowHeur}
            style={{ color: showHeur ? theme.palette.text.primary : theme.palette.text.disabled }}
          >
            {HEURISTIC_ICON}
            {t('show_heur')}
          </MenuItem>
        )}
        {!highlighted && Array.isArray(section.tags) && section.tags.length > 0 && (
          <MenuItem
            dense
            onClick={handleShowTags}
            style={{ color: showTags ? theme.palette.text.primary : theme.palette.text.disabled }}
          >
            {TAGS_ICON}
            {t('show_tags')}
          </MenuItem>
        )}
        {!highlighted &&
          section.heuristic &&
          section.heuristic.attack &&
          Array.isArray(section.heuristic.attack) &&
          section.heuristic.attack.length > 0 && (
            <MenuItem
              dense
              onClick={handleShowAttack}
              style={{ color: showAttack ? theme.palette.text.primary : theme.palette.text.disabled }}
            >
              {ATTACK_ICON}
              {t('show_attack')}
            </MenuItem>
          )}
      </Menu>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          marginLeft: !printable ? `${depth}rem` : null,
          backgroundColor: highlighted ? (theme.palette.type === 'dark' ? '#343a44' : '#e2f2fa') : null
        }}
      >
        {!printable && (
          <SectionHighlight
            score={section.heuristic ? section.heuristic.score : 0}
            indent={indent}
            depth={depth}
            highlighted={highlighted}
            nested={nested}
          />
        )}

        <div style={{ width: '100%' }}>
          <Box className={printable ? classes.printable_section_title : classes.section_title} onClick={handleClick}>
            {c12nDef.enforce && !printable && (
              <>
                <Classification c12n={section.classification} type="text" />
                <span>&nbsp;&nbsp;::&nbsp;&nbsp;</span>
              </>
            )}
            {section.heuristic && (
              <>
                <Verdict score={section.heuristic.score} mono short size="tiny" />
                {!printable && <span>&nbsp;::&nbsp;&nbsp;</span>}
              </>
            )}
            <span
              style={{
                fontWeight: 500,
                wordBreak: 'break-word',
                flexGrow: 1,
                paddingLeft: printable ? theme.spacing(1) : null
              }}
            >
              {section.title_text}
            </span>
            {!printable && (
              <div style={{ color: theme.palette.text.disabled, whiteSpace: 'nowrap' }} onClick={stopPropagation}>
                {section.heuristic && (
                  <Tooltip title={t('show_heur')} placement="top">
                    <IconButton size="small" onClick={handleShowHeur} color={showHeur ? 'default' : 'inherit'}>
                      <SimCardOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {Array.isArray(section.tags) && section.tags.length > 0 && (
                  <Tooltip title={t('show_tags')} placement="top">
                    <IconButton size="small" onClick={handleShowTags} color={showTags ? 'default' : 'inherit'}>
                      <LabelOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {section.heuristic &&
                  section.heuristic.attack &&
                  Array.isArray(section.heuristic.attack) &&
                  section.heuristic.attack.length > 0 && (
                    <Tooltip title={t('show_attack')} placement="top">
                      <IconButton size="small" onClick={handleShowAttack} color={showAttack ? 'default' : 'inherit'}>
                        {/* <FontDownloadOutlinedIcon /> */}
                        <span
                          style={{
                            display: 'inline-flex',
                            width: '24px',
                            height: '24px',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          {'[&]'}
                        </span>
                      </IconButton>
                    </Tooltip>
                  )}
              </div>
            )}
          </Box>
          <Collapse in={open || printable} timeout="auto">
            {useMemo(
              () => (
                <>
                  <div style={{ marginLeft: printable ? '2rem' : '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ cursor: 'context-menu' }} onContextMenu={handleMenuClick}>
                      {(() => {
                        switch (section.body_format) {
                          case 'TEXT':
                            return <TextBody body={section.body} />;
                          case 'MEMORY_DUMP':
                            return <MemDumpBody body={section.body} />;
                          case 'GRAPH_DATA':
                            return <GraphBody body={section.body} />;
                          case 'URL':
                            return <URLBody body={section.body} />;
                          case 'JSON':
                            return <JSONBody body={section.body} printable={printable} />;
                          case 'KEY_VALUE':
                            return <KVBody body={section.body} />;
                          case 'PROCESS_TREE':
                            return <ProcessTreeBody body={section.body} />;
                          case 'TABLE':
                            return <TblBody body={section.body} printable={printable} />;
                          case 'IMAGE':
                            return <ImageBody body={section.body} printable={printable} />;
                          default:
                            return <div style={{ margin: '2rem' }}>INVALID SECTION TYPE</div>;
                        }
                      })()}
                    </div>

                    {!printable && (
                      <>
                        <Collapse in={showHeur} timeout="auto">
                          {section.heuristic && (
                            <Heuristic
                              text={section.heuristic.name}
                              score={section.heuristic.score}
                              show_type
                              highlight_key={getKey('heuristic', section.heuristic.heur_id)}
                            />
                          )}
                          {section.heuristic &&
                            section.heuristic.signature.map((signature, idx) => (
                              <Heuristic
                                key={idx}
                                text={signature.name}
                                score={section.heuristic.score}
                                signature
                                show_type
                                highlight_key={getKey('heuristic.signature', signature.name)}
                                safe={signature.safe}
                              />
                            ))}
                        </Collapse>
                        <Collapse in={showTags} timeout="auto">
                          {Array.isArray(section.tags) &&
                            section.tags.map((tag, idx) => (
                              <Tag
                                key={idx}
                                type={tag.type}
                                value={tag.value}
                                safelisted={tag.safelisted}
                                short_type={tag.short_type}
                                score={section.heuristic ? section.heuristic.score : 0}
                                highlight_key={getKey(tag.type, tag.value)}
                              />
                            ))}
                        </Collapse>
                        <Collapse in={showAttack} timeout="auto">
                          {section.heuristic &&
                            section.heuristic.attack.map((attack, idx) => (
                              <Attack
                                key={idx}
                                text={attack.pattern}
                                score={section.heuristic.score}
                                show_type
                                highlight_key={getKey('attack_pattern', attack.attack_id)}
                              />
                            ))}
                        </Collapse>
                      </>
                    )}
                  </div>
                  {!printable && (
                    <div>
                      {sub_sections.map(item => (
                        <ResultSection
                          key={item.id}
                          section={section_list[item.id]}
                          section_list={section_list}
                          sub_sections={item.children}
                          indent={indent + 1}
                          nested
                        />
                      ))}
                    </div>
                  )}
                </>
              ),
              [
                handleMenuClick,
                showHeur,
                section.heuristic,
                section.tags,
                section.body_format,
                section.body,
                getKey,
                showTags,
                showAttack,
                sub_sections,
                printable,
                section_list,
                indent
              ]
            )}
          </Collapse>
        </div>
      </div>
    </>
  );
};
export default ResultSection;
