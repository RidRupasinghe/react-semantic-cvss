import React, { useState } from 'react';
import { Container, Header, Segment, Divider } from 'semantic-ui-react';
import CVSSCalc, { calculateCVSS31 } from 'react-semantic-cvss';

const INITIAL_VECTOR = "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:L";

const App = () => {
  const [currentVector, setCurrentVector] = useState(INITIAL_VECTOR);
  const [calculationResult, setCalculationResult] = useState(() =>
    calculateCVSS31({
      AV: "N",
      AC: "H",
      PR: "N",
      UI: "R",
      S: "U",
      C: "H",
      I: "N",
      A: "L"
    })
  );

  const handleCVSSChange = (output) => {
    setCurrentVector(output.string);
    setCalculationResult(output);
  };

  return (
    <Container style={{ marginTop: '40px', marginBottom: '60px' }}>
      <Header as="h1" textAlign="center">
        react-semantic-cvss v2.0 Demo
        <Header.Subheader>
          Modernized CVSS v3.1 Calculator, Vector Parser & Rating Visualizer
        </Header.Subheader>
      </Header>

      <Divider />

      <Segment padded="very" raised>
        <CVSSCalc
          title="Common Vulnerability Scoring System (v3.1)"
          vector={currentVector}
          readOnly={false}
          showHintsOnButton={true}
          showHintsOnButtonGroupName={true}
          onChange={handleCVSSChange}
        />
      </Segment>

      <Segment secondary>
        <Header as="h4">Output Details (Live Consumer State)</Header>
        <p><strong>Vector String:</strong> <code>{calculationResult?.string || "-"}</code></p>
        <p><strong>Score:</strong> <code>{calculationResult?.scoreString || "-"}</code> ({calculationResult?.ratingDetails?.name || "Pending"})</p>
        <p><strong>Complete:</strong> <code>{String(calculationResult?.isComplete)}</code></p>
      </Segment>
    </Container>
  );
};

export default App;
