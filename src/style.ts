import React from "react";
import styled from "styled-components";
import { Colors } from "./colors";
import {
  Grid,
  Statistic,
  Message,
  Form,
} from "semantic-ui-react";

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(118, 118, 118, ${alpha})`;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

export const FormInlineHelp = styled.div`
  font-weight: 400;
  font-size: 0.9em;
  margin-top: 10px;
  text-align: center;
  
  .error {
    color: ${Colors.red};
    font-weight: 600;
  }

  .help {
    color: ${Colors.helpText};
  }
`;

export const CvssStringComponent: React.ComponentType<any> = styled(Message)`
  word-break: break-word !important;
`;

export interface CvssStatisticProps {
  $ratingColor?: string;
  color?: string;
}

export const CvssStatistic: React.ComponentType<any> = styled(Statistic)<CvssStatisticProps>`
  padding: 15px 20px !important;
  border-radius: 16px !important;
  border: 4px solid ${props => props.$ratingColor || props.color || '#767676'} !important;
  background: ${props => hexToRgba(props.$ratingColor || props.color || '#767676', 0.12)} !important;
  
  .value, .label {
    color: ${props => props.$ratingColor || props.color || '#767676'} !important;
  }
`;

export const CvssForm: React.ComponentType<any> = styled(Form)`
  max-width: 850px !important;
  margin: 0 auto;

  label {
    min-width: 120px !important;
  }

  .unclickableButton {
    .button {
      cursor: default !important;
      pointer-events: none;
    }
  }

  .metric-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 8px;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;

export const CvssGrid: React.ComponentType<any> = styled(Grid)`
  @media only screen and (max-width: 991px) {
    .statColumn {
      margin-bottom: 24px !important;
    }
  }
`;

export const CVSSItem = styled.div`
  margin-bottom: 12px;
`;

export const ButtonGroupLabel = styled.div`
  line-height: 1.4285em !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  font-size: 0.95em !important;
  font-weight: 700 !important;
  color: rgba(0, 0, 0, 0.87) !important;
  text-transform: none !important;
  margin: 6px 1em 6px 0 !important;
  display: inline-block;
  cursor: help;
`;

export const Floating = styled.div`
  @media only screen and (min-width: 992px) {
    float: right !important;
  }
`;
