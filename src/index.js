import React, { Component, useState, Fragment, useEffect } from "react";
import {
  Button,
  Responsive,
  Popup,
  Message,
  Statistic,
  Grid,
  Header
} from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import PropTypes from 'prop-types';
import {
  FormInlineHelp,
  CvssStringComponent,
  CvssStatistic,
  CvssForm,
  CvssGrid,
  CVSSItem,
  ButtonGroupLabel,
  Floating,
} from "./style";
import { popupData, baseMatrices } from "./data";
import { calculate, severityRating } from "./functions";


const CVSSCalc = ({ title, vector, readOnly, isShowPopups, onChange }) => {
  const [attackVector, setAttackVector] = useState(null);
  const [attackComplexity, setAttackComplexity] = useState(null);
  const [privilegesRequired, setPrivilegesRequired] = useState(null);
  const [userInteraction, setUserInteraction] = useState(null);
  const [scope, setScope] = useState(null);
  const [confidentiality, setConfidentiality] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [cvssString, setCvssString] = useState(null);
  const [width, setWidth] = useState(null);
  const [noNull, setNoNull] = useState(false);
  const [cvssScore, setCvssScore] = useState(null);
  const [cvssRating, setCvssRating] = useState(null);
  const [isErrorOccured, setIsErrorOccured] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")


  useEffect(() => {
    if (vector && vector !== "" && vector !== cvssString) {
      initData();
    } else {
      clearSelection();
    }
  }, [vector]);

  // useEffect(() => {
  //   if (cvssScore === null && cvssRating === null) {
  //     clearSelection();
  //   }
  // }, [cvssScore, cvssRating])

  useEffect(() => {
    prepareCalculation();
  }, [attackVector,
    attackComplexity,
    privilegesRequired,
    userInteraction,
    scope,
    confidentiality,
    integrity,
    availability,]);

  const clearSelection = () => {
    setAttackVector(null);
    setAttackComplexity(null);
    setPrivilegesRequired(null);
    setUserInteraction(null);
    setScope(null);
    setConfidentiality(null);
    setIntegrity(null);
    setAvailability(null);
    setCvssString(null);
    setNoNull(false);
    setCvssScore(null);
    setCvssRating(null);
  }

  const initData = async () => {
    setCvssString(vector);
    let vectorStringArray = vector.split("/");
    let version = vectorStringArray.shift();
    let versoinNumber = version.split(":");

    if (versoinNumber[1] !== "3.1") {
      setErrorMsg({
        title: "Invalid Version",
        message: `Does not support ${versoinNumber[1]} version of CVSS. Please provide valid CVSS string of version 3.1`
      });
      setIsErrorOccured(true);
    } else {
      const invalidStringError = () => {
        setErrorMsg({
          title: "Invalid Input String",
          message: `The input cvss string is not valid one. Please check the input string.`
        });
        setIsErrorOccured(true);
      }
      if (vectorStringArray.length === 8) {
        await vectorStringArray.forEach(element => {
          let tmpElement = element.split(":");
          if (tmpElement.length === 2 && tmpElement[1] !== "") {
            switch (tmpElement[0]) {
              case 'AV':
                setAttackVector(tmpElement[1]);
                break;
              case 'AC':
                setAttackComplexity(tmpElement[1]);
                break;
              case 'PR':
                setPrivilegesRequired(tmpElement[1]);
                break;
              case 'UI':
                setUserInteraction(tmpElement[1]);
                break;
              case 'S':
                setScope(tmpElement[1]);
                break;
              case 'C':
                setConfidentiality(tmpElement[1]);
                break;
              case 'I':
                setIntegrity(tmpElement[1]);
                break;
              case 'A':
                setAvailability(tmpElement[1]);
                break;
              default:
                invalidStringError();
                break;
            }
          } else {
            invalidStringError();
          }
        });
        await prepareCalculation();
      } else {
        invalidStringError();
      }
    }
  }

  const prepareCalculation = async () => {
    const dataArray = [attackVector,
      attackComplexity,
      privilegesRequired,
      userInteraction,
      scope,
      confidentiality,
      integrity,
      availability,];
    if (!dataArray.includes(null)) {
      setNoNull(true);
      const version = "CVSS:3.1/";
      const tmpCvssString = `AV:${attackVector}/AC:${attackComplexity}/PR:${privilegesRequired}/UI:${userInteraction}/S:${scope}/C:${confidentiality}/I:${integrity}/A:${availability}`

      const severityVectorArr = tmpCvssString.split('/');

      let cvssDataObject = {};
      if (severityVectorArr && severityVectorArr.length === 8) {
        severityVectorArr.forEach((severity) => {
          let severityArr = severity.split(':');
          cvssDataObject[severityArr[0]] = severityArr[1];
        });

        await setCvssString(version + tmpCvssString);
        var score = calculate(cvssDataObject)
        await setCvssScore(score);
        var ratingObj = severityRating(score);
        await setCvssRating(ratingObj);
        await onChange({
          string: version + tmpCvssString,
          selections: cvssDataObject,
          score: score,
          ratingDetails: ratingObj
        }
        );
      }
    } else {
      setNoNull(false);
    }
  }

  const handleScreenResize = () => setWidth(window.innerWidth);

  return (popupData ?
    <CvssForm>
      <Responsive fireOnMount onUpdate={() => handleScreenResize()} />
      <CvssGrid padded relaxed className={readOnly ? "unclickableButton" : ""}>
        <Grid.Row columns="3">
          <Grid.Column verticalAlign="middle" textAlign="center" computer="16" tablet="16" mobile="16" className
            ="statColumn">
            <Header as='h3'>{title}</Header>
            {cvssRating && cvssScore ?
              <Fragment>
                <CvssStatistic
                  inverted
                  color={cvssRating.color}
                >
                  <Statistic.Value>{cvssScore}</Statistic.Value>
                  <Statistic.Label>{cvssRating.name}</Statistic.Label>
                </CvssStatistic>
                <br />
                {width <= Responsive.onlyTablet.minWidth - 1 ?
                  <CvssStringComponent
                    compact
                    content={cvssString ? cvssString : "-"}
                  />
                  :
                  <Message
                    compact
                    header={'CVSS String : ' + cvssString ? cvssString : "-"}
                  />
                }
              </Fragment>
              : "-"
            }
            {(isErrorOccured && errorMsg !== "") &&
              <Message negative>
                <Message.Header>{errorMsg.title}</Message.Header>
                <p>{errorMsg.message}</p>
              </Message>}
          </Grid.Column>
          <Grid.Column computer={8} tablet="16" mobile="16" textAlign={width < 992 ? "center" : "left"}>
            <CVSSItem>
              <Popup
                trigger={
                  <ButtonGroupLabel>Attack Vector</ButtonGroupLabel>
                }
                flowing
                disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                hideOnScroll
                position='bottom left'
              >
                <div dangerouslySetInnerHTML={{ __html: popupData['AV']['help'] }} />
              </Popup>
              {width <= Responsive.onlyTablet.minWidth - 1 ?
                <Button.Group vertical toggle={true}>
                  <Popup
                    trigger={
                      <Button
                        content={"Network"}
                        name="N"
                        primary={attackVector === "N"}
                        onClick={() => !readOnly && setAttackVector("N")}
                      />
                    }
                    flowing
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['AV']['N'] }} />
                  </Popup>
                  <Popup
                    trigger={
                      <Button
                        content={"Adjacent"}
                        name="A"
                        primary={attackVector === "A"}
                        onClick={() => !readOnly && setAttackVector("A")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['AV']['A'] }} />
                  </Popup>
                  <Popup
                    trigger={
                      <Button
                        content={"Local"}
                        name="L"
                        primary={attackVector === "L"}
                        onClick={() => !readOnly && setAttackVector("L")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['AV']['L'] }} />
                  </Popup>
                  <Popup
                    trigger={
                      <Button
                        content={"Physical"}
                        name="P"
                        primary={attackVector === "P"}
                        onClick={() => !readOnly && setAttackVector("P")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['AV']['P'] }} />
                  </Popup>
                </Button.Group>
                : <Button.Group toggle={true}>
                  <Popup
                    trigger={
                      <Button
                        content={"Network"}
                        name="N"
                        primary={attackVector === "N"}
                        onClick={() => !readOnly && setAttackVector("N")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['AV']['N'] }} />
                  </Popup>
                  <Button.Or />
                  <Popup
                    trigger={
                      <Button
                        content={"Adjacent"}
                        name="A"
                        primary={attackVector === "A"}
                        onClick={() => !readOnly && setAttackVector("A")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['AV']['A'] }} />
                  </Popup>
                  <Button.Or />
                  <Popup
                    trigger={
                      <Button
                        content={"Local"}
                        name="L"
                        primary={attackVector === "L"}
                        onClick={() => !readOnly && setAttackVector("L")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['AV']['L'] }} />
                  </Popup>
                  <Button.Or />
                  <Popup
                    trigger={
                      <Button
                        content={"Physical"}
                        name="P"
                        primary={attackVector === "P"}
                        onClick={() => !readOnly && setAttackVector("P")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['AV']['P'] }} />
                  </Popup>
                </Button.Group>
              }
            </CVSSItem>
            <CVSSItem>
              <Popup
                trigger={
                  <ButtonGroupLabel>Attack Complexity</ButtonGroupLabel>
                }
                flowing
                disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                hideOnScroll
                position='bottom left'
              >
                <div dangerouslySetInnerHTML={{ __html: popupData['AC']['help'] }} />
              </Popup>
              <Button.Group toggle>
                <Popup
                  trigger={
                    <Button
                      content={"Low"}
                      name="L"
                      primary={attackComplexity === "L"}
                      onClick={() => !readOnly && setAttackComplexity("L")}
                    />
                  }
                  flowing
                  on={['hover']}
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['AC']['L'] }} />
                </Popup>
                <Button.Or />
                <Popup
                  trigger={
                    <Button
                      content={"High"}
                      name="H"
                      primary={attackComplexity === "H"}
                      onClick={() => !readOnly && setAttackComplexity("H")}
                    />
                  }
                  flowing
                  on={['hover']}
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['AC']['H'] }} />
                </Popup>
              </Button.Group>
            </CVSSItem>
            <CVSSItem>
              <Popup
                trigger={
                  <ButtonGroupLabel>Privileges Required</ButtonGroupLabel>
                }
                flowing
                disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                hideOnScroll
                position='bottom left'
              >
                <div dangerouslySetInnerHTML={{ __html: popupData['PR']['help'] }} />
              </Popup>
              <Button.Group toggle>
                <Popup
                  trigger={
                    <Button
                      content={"None"}
                      name="N"
                      primary={privilegesRequired === "N"}
                      onClick={() => !readOnly && setPrivilegesRequired("N")}
                    />
                  }
                  flowing
                  on={['hover']}
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['PR']['N'] }} />
                </Popup>
                <Button.Or />
                <Popup
                  trigger={
                    <Button
                      content={"Low"}
                      name="L"
                      primary={privilegesRequired === "L"}
                      onClick={() => !readOnly && setPrivilegesRequired("L")}
                    />
                  }
                  flowing
                  on={['hover']}
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['PR']['L'] }} />
                </Popup>
                <Button.Or />
                <Popup
                  trigger={
                    <Button
                      content={"High"}
                      name="H"
                      primary={privilegesRequired === "H"}
                      onClick={() => !readOnly && setPrivilegesRequired("H")}
                    />
                  }
                  flowing
                  on={['hover']}
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['PR']['H'] }} />
                </Popup>
              </Button.Group>
            </CVSSItem>
            <CVSSItem>
              <Popup
                trigger={
                  <ButtonGroupLabel>User Interaction</ButtonGroupLabel>
                }
                flowing
                disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                hideOnScroll
                position='bottom left'
              >
                <div dangerouslySetInnerHTML={{ __html: popupData['UI']['help'] }} />
              </Popup>
              <Button.Group toggle>
                <Popup
                  trigger={
                    <Button
                      toggle
                      content={"None"}
                      name="N"
                      primary={userInteraction === "N"}
                      onClick={() => !readOnly && setUserInteraction("N")}
                    />
                  }
                  flowing
                  on={['hover']}
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['UI']['N'] }} />
                </Popup>
                <Button.Or />
                <Popup
                  trigger={
                    <Button
                      toggle
                      content={"Required"}
                      name="R"
                      primary={userInteraction === "R"}
                      onClick={() => !readOnly && setUserInteraction("R")}
                    />
                  }
                  flowing
                  on={['hover']}
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['UI']['R'] }} />
                </Popup>
              </Button.Group>
            </CVSSItem>
          </Grid.Column>
          <Grid.Column computer={8} tablet="16" mobile="16" textAlign={width < 992 ? "center" : "right"}>
            <Floating>
              <CVSSItem>
                <Popup
                  trigger={
                    <ButtonGroupLabel>Scope</ButtonGroupLabel>
                  }
                  flowing
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                  position='bottom left'
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['S']['help'] }} />
                </Popup>
                <Button.Group toggle>
                  <Popup
                    trigger={
                      <Button
                        content={"Unchanged"}
                        name="U"
                        primary={scope === "U"}
                        onClick={() => !readOnly && setScope("U")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['S']['U'] }} />
                  </Popup>
                  <Button.Or />
                  <Popup
                    trigger={
                      <Button
                        content={"Changed"}
                        name="C"
                        primary={scope === "C"}
                        onClick={() => !readOnly && setScope("C")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['S']['C'] }} />
                  </Popup>
                </Button.Group>
              </CVSSItem>
              <CVSSItem>
                <Popup
                  trigger={
                    <ButtonGroupLabel>Confidentiality</ButtonGroupLabel>
                  }
                  flowing
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                  position='bottom left'
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['C']['help'] }} />
                </Popup>
                <Button.Group toggle>
                  <Popup
                    trigger={
                      <Button
                        content={"None"}
                        name="N"
                        primary={confidentiality === "N"}
                        onClick={() => !readOnly && setConfidentiality("N")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['C']['N'] }} />
                  </Popup>
                  <Button.Or />
                  <Popup
                    trigger={
                      <Button
                        content={"Low"}
                        name="L"
                        primary={confidentiality === "L"}
                        onClick={() => !readOnly && setConfidentiality("L")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['C']['L'] }} />
                  </Popup>
                  <Button.Or />
                  <Popup
                    trigger={
                      <Button
                        content={"High"}
                        name="H"
                        primary={confidentiality === "H"}
                        onClick={() => !readOnly && setConfidentiality("H")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['C']['H'] }} />
                  </Popup>
                </Button.Group>
              </CVSSItem>
              <CVSSItem>
                <Popup
                  trigger={
                    <ButtonGroupLabel>Integrity</ButtonGroupLabel>
                  }
                  flowing
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                  position='bottom left'
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['I']['help'] }} />
                </Popup>
                <Button.Group toggle>
                  <Popup
                    trigger={
                      <Button
                        content={"None"}
                        name="N"
                        primary={integrity === "N"}
                        onClick={() => !readOnly && setIntegrity("N")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['I']['N'] }} />
                  </Popup>
                  <Button.Or />
                  <Popup
                    trigger={
                      <Button
                        content={"Low"}
                        name="L"
                        primary={integrity === "L"}
                        onClick={() => !readOnly && setIntegrity("L")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['I']['L'] }} />
                  </Popup>
                  <Button.Or />
                  <Popup
                    trigger={
                      <Button
                        content={"High"}
                        name="H"
                        primary={integrity === "H"}
                        onClick={() => !readOnly && setIntegrity("H")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['I']['H'] }} />
                  </Popup>
                </Button.Group>
              </CVSSItem>
              <CVSSItem>
                <Popup
                  trigger={
                    <ButtonGroupLabel>Availability</ButtonGroupLabel>
                  }
                  flowing
                  disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                  hideOnScroll
                  position='bottom left'
                >
                  <div dangerouslySetInnerHTML={{ __html: popupData['A']['help'] }} />
                </Popup>
                <Button.Group toggle>
                  <Popup
                    trigger={
                      <Button
                        content={"None"}
                        name="N"
                        primary={availability === "N"}
                        onClick={() => !readOnly && setAvailability("N")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['A']['N'] }} />
                  </Popup>
                  <Button.Or />
                  <Popup
                    trigger={
                      <Button
                        content={"Low"}
                        name="L"
                        primary={availability === "L"}
                        onClick={() => !readOnly && setAvailability("L")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['A']['L'] }} />
                  </Popup>
                  <Button.Or />
                  <Popup
                    trigger={
                      <Button
                        content={"High"}
                        name="H"
                        primary={availability === "H"}
                        onClick={() => !readOnly && setAvailability("H")}
                      />
                    }
                    flowing
                    on={['hover']}
                    disabled={width <= Responsive.onlyComputer.minWidth - 1 || !isShowPopups}
                    hideOnScroll
                  >
                    <div dangerouslySetInnerHTML={{ __html: popupData['A']['H'] }} />
                  </Popup>
                </Button.Group>
              </CVSSItem>
            </Floating>
          </Grid.Column>
        </Grid.Row>
        {!readOnly && !noNull && <FormInlineHelp>
          <p className="error">{"*Every option must be selected to calculate \"CVSS Score\""}</p>
        </FormInlineHelp>}
      </CvssGrid>
    </CvssForm>
    :
    <FormInlineHelp>
      <p className="error">
        {"CVSS Calculation related data missing. Can not display component"}
      </p>
    </FormInlineHelp>
  )
}

CVSSCalc.prototype = {
  title: PropTypes.string.isRequired,
  vector: PropTypes.string.isRequired,
  readOnly: PropTypes.bool.isRequired,
  isShowPopups: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired
}

export default CVSSCalc;