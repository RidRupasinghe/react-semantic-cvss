import { useState, useEffect, useMemo, FC } from "react";
import {
  Message,
  Statistic,
  Grid,
  Header
} from "semantic-ui-react";
import {
  FormInlineHelp,
  CvssStringComponent,
  CvssStatistic,
  CvssForm,
  CvssGrid,
  Floating,
} from "./style";
import { baseMatrices } from "./data";
import { calculateCVSS31, parseCVSS31Vector } from "./utils/cvss31";
import { CVSSCalcProps, CVSSMetric } from "./types";
import { MetricGroup } from "./MetricGroup";

export const CVSSCalc: FC<CVSSCalcProps> = ({
  title = "Common Vulnerability Scoring System",
  vector = "",
  readOnly = false,
  showHintsOnButton = true,
  showHintsOnButtonGroupName = true,
  onChange,
  className
}) => {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  // Synchronize incoming vector prop safely without wiping parent-controlled state
  useEffect(() => {
    if (vector && vector.trim() !== "") {
      const parsed = parseCVSS31Vector(vector);
      if (parsed.ok && parsed.selections) {
        setError(null);
        setSelections(prev => {
          const hasChanged = Object.keys(parsed.selections!).some(
            k => prev[k] !== parsed.selections![k]
          ) || Object.keys(prev).length !== Object.keys(parsed.selections!).length;

          return hasChanged ? parsed.selections! : prev;
        });
      } else {
        setError(parsed.error ?? {
          title: "Invalid Vector",
          message: "Failed to parse CVSS vector string."
        });
      }
    } else {
      setError(null);
      setSelections(prev => Object.keys(prev).length > 0 ? {} : prev);
    }
  }, [vector]);

  // Derive score, rating, and vector string synchronously
  const calculation = useMemo(() => calculateCVSS31(selections), [selections]);

  const handleSelectOption = (metricKey: string, value: string) => {
    if (readOnly) return;

    const newSelections = { ...selections, [metricKey]: value };
    setSelections(newSelections);

    const newCalculation = calculateCVSS31(newSelections);
    onChange?.(newCalculation);
  };

  // Split into Exploitability (AV, AC, PR, UI) and Scope/Impact (S, C, I, A)
  const exploitabilityMetrics = useMemo(
    () => baseMatrices.filter(m => ['AV', 'AC', 'PR', 'UI'].includes(m.key)),
    []
  );
  const impactMetrics = useMemo(
    () => baseMatrices.filter(m => ['S', 'C', 'I', 'A'].includes(m.key)),
    []
  );

  const renderMetricGroup = (metric: CVSSMetric) => (
    <MetricGroup
      key={metric.key}
      metric={metric}
      selectedValue={selections[metric.key]}
      readOnly={readOnly}
      showHintsOnButton={showHintsOnButton}
      showHintsOnButtonGroupName={showHintsOnButtonGroupName}
      onSelect={handleSelectOption}
    />
  );

  return (
    <CvssForm className={className}>
      <CvssGrid padded relaxed className={readOnly ? "unclickableButton" : ""}>
        <Grid.Row columns="3">
          <Grid.Column
            verticalAlign="middle"
            textAlign="center"
            computer={16}
            tablet={16}
            mobile={16}
            className="statColumn"
          >
            {title && <Header as="h3">{title}</Header>}

            {calculation.isComplete && calculation.score !== null ? (
              <div aria-live="polite">
                <CvssStatistic
                  inverted
                  $ratingColor={calculation.ratingDetails.color}
                >
                  <Statistic.Value>{calculation.scoreString}</Statistic.Value>
                  <Statistic.Label>{calculation.ratingDetails.name}</Statistic.Label>
                </CvssStatistic>
                <br />
                <CvssStringComponent
                  compact
                  header={calculation.string ? `CVSS String: ${calculation.string}` : "-"}
                />
              </div>
            ) : (
              <div aria-live="polite">
                <Statistic size="small">
                  <Statistic.Value>-</Statistic.Value>
                  <Statistic.Label>Pending</Statistic.Label>
                </Statistic>
                <br />
                <CvssStringComponent
                  compact
                  content={calculation.string || "Select all metrics below"}
                />
              </div>
            )}

            {error && (
              <Message negative style={{ marginTop: '14px' }}>
                <Message.Header>{error.title}</Message.Header>
                <p>{error.message}</p>
              </Message>
            )}
          </Grid.Column>

          <Grid.Column computer={8} tablet={16} mobile={16}>
            {exploitabilityMetrics.map(renderMetricGroup)}
          </Grid.Column>

          <Grid.Column computer={8} tablet={16} mobile={16}>
            <Floating>
              {impactMetrics.map(renderMetricGroup)}
            </Floating>
          </Grid.Column>
        </Grid.Row>

        {!readOnly && !calculation.isComplete && (
          <FormInlineHelp>
            <p className="help">
              *All 8 base metrics must be selected to calculate the official CVSS Base Score.
            </p>
          </FormInlineHelp>
        )}
      </CvssGrid>
    </CvssForm>
  );
};

export default CVSSCalc;
