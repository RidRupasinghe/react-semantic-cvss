import React, { FC } from "react";
import { Button, Popup } from "semantic-ui-react";
import { CVSSItem, ButtonGroupLabel } from "./style";
import { CVSSMetric } from "./types";

interface MetricGroupProps {
  metric: CVSSMetric;
  selectedValue?: string;
  readOnly: boolean;
  showHintsOnButton: boolean;
  showHintsOnButtonGroupName: boolean;
  onSelect: (metricKey: string, value: string) => void;
}

export const MetricGroup: FC<MetricGroupProps> = ({
  metric,
  selectedValue,
  readOnly,
  showHintsOnButton,
  showHintsOnButtonGroupName,
  onSelect
}) => (
  <CVSSItem>
    <Popup
      trigger={
        showHintsOnButtonGroupName ? (
          <ButtonGroupLabel $hasHint tabIndex={0} role="button" aria-label={`Help for ${metric.name}`}>
            {metric.name}
          </ButtonGroupLabel>
        ) : (
          <ButtonGroupLabel>{metric.name}</ButtonGroupLabel>
        )
      }
      
      disabled={!showHintsOnButtonGroupName}
      hideOnScroll
      position="bottom left"
      on={['click']}
    >
      <div dangerouslySetInnerHTML={{ __html: metric.help }} />
    </Popup>

    <Button.Group
      toggle
      role="radiogroup"
      aria-label={metric.name}
      aria-disabled={readOnly}
    >
      {metric.options.map((option, idx) => {
        const isSelected = selectedValue === option.name;
        const buttonElement = (
          <Button
            key={option.name}
            content={option.l}
            name={option.name}
            primary={isSelected}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${metric.name}: ${option.l}`}
            tabIndex={readOnly ? -1 : 0}
            onClick={() => onSelect(metric.key, option.name)}
          />
        );

        return (
          <React.Fragment key={option.name}>
            {showHintsOnButton ? (
              <Popup
                trigger={buttonElement}
                hoverable
                hideOnScroll
                position="top center"
                on={['hover', 'focus']}
              >
                <div dangerouslySetInnerHTML={{ __html: option.d }} />
              </Popup>
            ) : (
              buttonElement
            )}
            {idx < metric.options.length - 1 && <Button.Or />}
          </React.Fragment>
        );
      })}
    </Button.Group>
  </CVSSItem>
);

export default MetricGroup;
