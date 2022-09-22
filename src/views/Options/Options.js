///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2021, Open Design Alliance (the "Alliance").
// All rights reserved.
//
// This software and its documentation and related materials are owned by
// the Alliance. The software may only be incorporated into application
// programs owned by members of the Alliance, subject to a signed
// Membership Agreement and Supplemental Software License Agreement with the
// Alliance. The structure and organization of this software are the valuable
// trade secrets of the Alliance and its suppliers. The software is also
// protected by copyright law and international treaty provisions. Application
// programs incorporating this software must include the following statement
// with their copyright notices:
//
//   This application incorporates Open Design Alliance software pursuant to a
//   license agreement with Open Design Alliance.
//   Open Design Alliance Copyright (C) 2002-2021 by Open Design Alliance.
//   All rights reserved.
//
// By use of this software, its documentation or related materials, you
// acknowledge and accept the above terms.
///////////////////////////////////////////////////////////////////////////////
import React, { useContext, useState } from "react";
import { Button, Divider, InputNumber, PageHeader, Row, Switch, Typography } from "antd";

import ClientFactory from "../../ClientFactory";
import { AppContext } from "../../AppContext";

const { Title, Text } = Typography;

const viewerOptionSet = {
  title: "Viewer Options",
  customKey: "oda.viewer",
  options: [
    { key: "showFPS", label: "Show FPS" },
    { key: "showWCS", label: "Show WCS" },
    { key: "cameraAnimation", label: "Enable camera animation" },
    { key: "antialiasing", label: "Enable antialiasing use FXAA" },
    { key: "shadows", label: "Enable shadows" },
    { key: "groundShadow", label: "Enable ground shadow" },
    { key: "ambientOcclusion", label: "Ambient occlusion" },
  ],
};

const experimentalOptionSet = {
  title: "Experimental",
  customKey: "oda.experimental",
  options: [
    { key: "enablePartialMode", label: "Enable partial load mode to be able open large drawings" },
    {
      key: "memoryLimit",
      label: "The size of the memory buffer that the Viewer can use for graphics data",
      min: 256,
      max: 4000,
      factor: 1024 * 1024,
      units: "MB",
      stateKey: "enablePartialMode",
    },
    { key: "showProjects", label: "Enable Projects access" },
  ],
};

function Option({ className, options, option, onChange }) {
  return typeof options[option.key] === "number" ? (
    <InputNumber
      className={className}
      style={{ width: "10rem", minWidth: "7rem" }}
      min={option.min}
      max={option.max}
      value={(options.data[option.key] / option.factor) | 0}
      addonAfter={option.units}
      disabled={option.stateKey && !options[option.stateKey]}
      onChange={(value) => onChange(option.key, value * option.factor)}
    />
  ) : (
    <Switch
      className={className}
      checked={!!options.data[option.key]}
      disabled={option.stateKey && !options[option.stateKey]}
      onChange={(checked) => onChange(option.key, checked)}
    />
  );
}

function OptionGroup({ optionSet, options, onChange }) {
  return (
    <React.Fragment>
      <Title level={5}>{optionSet.title}</Title>
      {optionSet.options.map((x) => (
        <Row className="mb-2" key={x.key} wrap={false}>
          <Option className="mr-4" options={options} option={x} onChange={onChange} />
          <Text>{x.label}</Text>
        </Row>
      ))}
      <Divider />
    </React.Fragment>
  );
}

function Options() {
  const { app } = useContext(AppContext);
  const [modified, setModified] = useState(0);
  const options = ClientFactory.get().options;

  function saveUserSettings() {
    app.saveUserOptions(options.data).catch((e) => {
      console.error("Unable to save user settings.", e.message);
      app.addNotification("warning", "Unable to save user settings, changes may be lost after the next login");
    });
  }

  function handleChange(key, value) {
    options.data = { ...options.data, [key]: value };
    setModified(modified + 1);
    saveUserSettings();
  }

  function handleResetToDefault() {
    options.resetToDefaults();
    setModified(0);
    app.addNotification("success", "Settings reset to defaults");
    saveUserSettings();
  }

  return (
    <div className="h-100 d-flex flex-column">
      <PageHeader backIcon={false} title="Settings" />
      <div className="flex-grow-1 overflow-auto">
        <div className="px-4 pb-4">
          <OptionGroup optionSet={viewerOptionSet} options={options} onChange={handleChange} />
          <OptionGroup optionSet={experimentalOptionSet} options={options} onChange={handleChange} />
          <Button type="primary" onClick={handleResetToDefault}>
            Reset to defaults
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Options;
