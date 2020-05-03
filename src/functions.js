import {
  baseMatrices,
  severityRatings,
  weight,
  exploitabilityCoefficient,
  scopeCoefficient
} from "./data";

const calculate = (selectedMatrices) => {
  let metricWeight = {};
  Object.keys(weight).forEach((key) => {
    if (selectedMatrices[key] && key === 'PR') {
      if (selectedMatrices.S) {
        metricWeight[key] = weight[key][selectedMatrices.S][selectedMatrices[key]];
      } else {
        metricWeight[key] = 0;
      }
    } else if (selectedMatrices[key]) {
      metricWeight[key] = weight[key][selectedMatrices[key]];
    } else {
      metricWeight[key] = 0;
    }
  });

  //
  // CALCULATE THE CVSS BASE SCORE
  //
  let roundUpScore = function Roundup(input) {
    let int_input = Math.round(input * 100000);
    if (int_input % 10000 === 0) {
      return int_input / 100000
    } else {
      return (Math.floor(int_input / 10000) + 1) / 10
    }
  };
  try {
    let baseScore, impactSubScore;
    let impactSubScoreMultiplier = (1 - ((1 - metricWeight.C) * (1 - metricWeight.I) * (1 - metricWeight.A)));
    if (selectedMatrices.S === 'U') {
      impactSubScore = metricWeight.S * impactSubScoreMultiplier;
    } else {
      impactSubScore = metricWeight.S * (impactSubScoreMultiplier - 0.029) - 3.25 * Math.pow(impactSubScoreMultiplier - 0.02, 15);
    }
    let exploitabilitySubScore = exploitabilityCoefficient * metricWeight.AV * metricWeight.AC * metricWeight.PR * metricWeight.UI;
    if (impactSubScore <= 0) {
      baseScore = 0;
    } else {
      if (selectedMatrices.S === 'U') {
        baseScore = roundUpScore(Math.min((exploitabilitySubScore + impactSubScore), 10));
      } else {
        baseScore = roundUpScore(Math.min((exploitabilitySubScore + impactSubScore) * scopeCoefficient, 10));
      }
    }
    return baseScore.toFixed(1);
  } catch (err) {
    return err;
  }
};

const severityRating = (score) => {
  let i;
  let severityRatingLength = severityRatings.length;
  for (i = 0; i < severityRatingLength; i++) {
    if (score >= severityRatings[i].bottom && score <= severityRatings[i].top) {
      return severityRatings[i];
    }
  }
  return {
    name: "?",
    bottom: 'Not',
    top: 'defined'
  };
};

const giveFulldata = (cvssObject) => {
  if (cvssObject) {
    const keyArray = Object.keys(cvssObject);
    let fullDataObject = {};
    keyArray.forEach(element => {
      let matrics = baseMatrices.find(matricsElement => { return matricsElement.key === element });
      let value = matrics.options.find(optionsElement => { return optionsElement.name === cvssObject[element] });
      fullDataObject[element] = {
        name: matrics,
        value: value
      }
    });
    return fullDataObject;
  } else {
    return null;
  }
}

export {
  calculate,
  severityRating,
  giveFulldata
}