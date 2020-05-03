import React from 'react'
import CVSSCalc from 'react-semantic-cvss'

const cvssString = "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:L";

const cvssOnChange = (output) => {
  console.log("Updated")
  const {
    string,
    selections,
    score,
    ratingDetails,
  } = output;
  console.log(string, selections, score, ratingDetails)
}

const App = () => {
  return (
    <CVSSCalc
      title={"Common Vulnerability Scoring System"}
      vector={cvssString}
      readOnly={false}
      isShowPopups={false}
      onChange={(output) => cvssOnChange(output)}
    />
  )
}

export default App
