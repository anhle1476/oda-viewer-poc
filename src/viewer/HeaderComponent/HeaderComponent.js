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
import { Component } from "react";

import { Menu, Dropdown, Button, PageHeader } from "antd";
import {
  ApartmentOutlined,
  BarsOutlined,
  BuildOutlined,
  ControlOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

import { SubscribeSubjectContext } from "../../utils/SubscribeSubjectContext";

const defaultState = {
  fileName: "Loading...",
  modelList: [],
  activeModel: {},
  isEnableObjectExplorer: false,
  isEnableProperties: false,
  isEnable: false,
  isSupportViewPoint: true,
  isSupportTransform: false,
};

class HeaderComponent extends Component {
  state = { ...defaultState };

  constructor(props) {
    super(props);
    this.eventsConnection = props.eventsConnection;
    this.subscribeSubjectContext = new SubscribeSubjectContext();

    this.subscribeSubjectContext.subscribe(this.eventsConnection.changeFileInfo, (value) => {
      this.setState({ fileName: value.name });
    });

    this.subscribeSubjectContext.subscribe(this.eventsConnection.changeModelList, (value) => {
      this.setState({ modelList: value, activeModel: value[0] });
    });

    this.subscribeSubjectContext.subscribe(this.eventsConnection.changeEnableObjectExplorer, (value) => {
      this.setState({ isEnableObjectExplorer: value });
    });

    this.subscribeSubjectContext.subscribe(this.eventsConnection.changeEnableProperties, (value) => {
      this.setState({ isEnableProperties: value });
    });

    this.subscribeSubjectContext.subscribe(this.eventsConnection.changeEnable, (value) => {
      this.setState({ isEnable: value });
    });

    this.subscribeSubjectContext.subscribe(this.eventsConnection.changeSupportViewPoint, (isSupportViewPoint) => {
      this.setState({ isSupportViewPoint });
    });

    this.subscribeSubjectContext.subscribe(this.eventsConnection.changeSupportTransform, (isSupport) => {
      this.setState({ isSupportTransform: isSupport });
    });
  }

  componentWillUnmount() {
    this.subscribeSubjectContext.unsubscribe();
  }

  onOpenModel = (model) => {
    this.setState({ activeModel: model });
    this.eventsConnection.onOpenModel.next(model);
  };

  render() {
    const {
      fileName,
      modelList,
      activeModel,
      isEnableObjectExplorer,
      isEnableProperties,
      isEnable,
      isSupportViewPoint,
      isSupportTransform,
    } = this.state;

    const modelListTemplate = modelList.map((model) => {
      return (
        <Menu.Item key={model.name} onClick={() => this.onOpenModel(model)}>
          {model.name || "Default"}
        </Menu.Item>
      );
    });

    const modelChooseTemplate = (
      <Menu defaultSelectedKeys={[activeModel.name]} selectedKeys={[activeModel.name]}>
        {modelListTemplate}
      </Menu>
    );

    const extra = [];
    if (isSupportTransform)
      extra.push(
        <Button
          key="transform"
          disabled={!isEnable}
          icon={<BuildOutlined />}
          onClick={() => this.eventsConnection.onOpenEdit.next()}
        >
          Transform
        </Button>
      );
    if (isSupportViewPoint)
      extra.push(
        <Button
          key="viewpoint"
          disabled={!isEnable}
          icon={<VideoCameraOutlined />}
          onClick={() => this.eventsConnection.onOpenViewpointView.next()}
        >
          Viewpoint
        </Button>
      );
    extra.push(
      <Button
        key="explorer"
        disabled={!isEnableObjectExplorer}
        icon={<ApartmentOutlined />}
        onClick={() => this.eventsConnection.onOpenObjectExplorer.next()}
      >
        Explorer
      </Button>
    );
    extra.push(
      <Button
        key="properties"
        disabled={!isEnableProperties}
        icon={<BarsOutlined />}
        onClick={() => this.eventsConnection.onOpenProperties.next()}
      >
        Properties
      </Button>
    );
    if (modelList.length > 1)
      extra.push(
        <Dropdown key="models" overlay={modelChooseTemplate} placement="topRight">
          <Button disabled={!isEnable} icon={<ControlOutlined />}>
            Models
          </Button>
        </Dropdown>
      );

    return <PageHeader className="p-3" backIcon={false} title={fileName} extra={extra} />;
  }
}

export default HeaderComponent;
