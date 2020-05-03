# react-semantic-cvss

> CVSS calculator for React.Js apps. Styled using semantic UI

[![NPM](https://img.shields.io/npm/v/react-semantic-cvss.svg)](https://www.npmjs.com/package/react-semantic-cvss) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-semantic-cvss
```

## Usage

```js
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
```

## License

MIT © [RidRupasinghe](https://github.com/RidRupasinghe)
