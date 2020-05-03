import styled from "styled-components";
import { Colors } from "./colors";
import {
  Grid,
  Statistic,
  Message,
  Form,
} from "semantic-ui-react";

export const FormInlineHelp = styled.div`
  font-weight: 200 !important;
  font-size: 0.9em;
  font-style: italic;
  .error {
    color: ${Colors.red};
  }
`;

export const CvssStringComponent = styled(Message)`
  word-break:break-word !important;
`;

export const CvssStatistic = styled(Statistic)`
  padding: 15px 15px !important;
  border-radius: 20px !important;
  border: 4px solid ${props => props.color} !important;
  background: ${props => props.color + 25} !important;
  .value, .label{
    color: ${props => props.color} !important;
  }
`;

export const CvssForm = styled(Form)`
  max-width: 800px !important;
  margin: auto;
  
  label{
    min-width: 120px !important;
  }
  .unclickableButton{
    .button:hover,
    .button:active:hover,
    .button.active:hover,
    .button:focus,
    .button:active:focus,
    .button.active:focus,
    .button.focus,
    .button:active.focus,
    .button.active.focus {
      cursor: default;
      background: #e0e1e2 none;
      color: rgba(0,0,0,.6);
    }

    .positive:hover,
    .positive:active:hover,
    .positive.active:hover,
    .positive:focus,
    .positive:active:focus,
    .positive.active:focus,
    .positive.focus,
    .positive:active.focus,
    .positive.active.focus {
      cursor: default;
      background: #21ba45 none !important;
      color: rgba(255,255,255,1);
      
    }
  }
`;

export const CvssGrid = styled(Grid)`
  @media only screen and (max-width: 991px) {
    .statColumn{
      margin-bottom: 30px !important;
      .message{
        
      }
    }
  }
`;

export const CVSSItem = styled.div`
`;

export const ButtonGroupLabel = styled.div`
  line-height: 1.4285em !important;
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen", "Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue", sans-serif !important;
  -webkit-font-smoothing: antialiased !important;
  box-sizing: inherit !important;
  width: auto !important;
  vertical-align: baseline !important;
  font-size: .92857143em !important;
  font-weight: 700 !important;
  color: rgba(0,0,0,.87) !important;
  text-transform: none !important;
  margin: 10px 1em 5px 0 !important;
`;

export const Floating = styled.div`
   @media only screen and (min-width:992px) and (max-width: 1365px) {
     float:right !important;
  }
`;