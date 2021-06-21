import { useTheme } from '@material-ui/core';
import { scoreToVerdict } from 'helpers/utils';
import React from 'react';

type SectionHighlightProps = {
  score: number;
  indent: number;
  depth?: number;
  highlighted?: boolean;
  nested?: boolean;
};

const SectionHighlight: React.FC<SectionHighlightProps> = ({
  score,
  indent,
  depth = 1,
  highlighted = false,
  nested = false
}) => {
  const theme = useTheme();

  const VERDICT_SCORE_MAP = {
    // suspicious: theme.palette.type === 'dark' ? '#1f5c6e' : '#a8ebff',
    info: theme.palette.type === 'dark' ? '#393939' : '#f0f0f0',
    safe: theme.palette.type === 'dark' ? '#2a492b' : '#9ae99d',
    suspicious: theme.palette.type === 'dark' ? '#654312' : '#ffd395',
    highly_suspicious: theme.palette.type === 'dark' ? '#654312' : '#ffd395',
    malicious: theme.palette.type === 'dark' ? '#6e2b2b' : '#ffa1a1'
  };

  return (
    <div
      style={{
        backgroundColor: highlighted
          ? theme.palette.type === 'dark'
            ? '#343a44'
            : '#d8e3ea'
          : VERDICT_SCORE_MAP[scoreToVerdict(score)],
        minWidth: '0.5rem',
        marginLeft: nested ? `${-1 * indent - 0.5}rem` : `${-1 * indent + -0.5 * (indent - depth)}rem`,
        marginRight: nested ? `${1 * indent}rem` : `${1 * indent + 0.5 * (indent - depth)}rem`
      }}
    />
  );
};

export default SectionHighlight;
