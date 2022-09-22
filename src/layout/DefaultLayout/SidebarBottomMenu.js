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
import { useContext, useState } from "react";
import { useLocation } from "react-router";
import { Menu } from "antd";
import { LinkOutlined, QuestionCircleOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";

import { ExamplesLink, DocLink } from "../../components";
import TokenModal from "./TokenModal";
import UserIdModal from "./UserIdModal";
import { AppContext } from "../../AppContext";

function SidebarBottomMenu({ className }) {
  const [tokenModal, setTokenModal] = useState();
  const [userIdModal, setUserIdModal] = useState();
  const location = useLocation();
  const { app } = useContext(AppContext);

  function handleClick(item) {
    if (item.key === "token") setTokenModal(true);
    else if (item.key === "userId") setUserIdModal(true);
    else if (item.key === "logout") app.logout();
  }

  return (
    <Menu className={className} selectedKeys={[location.pathname]} mode="inline" onClick={handleClick}>
      <Menu.SubMenu key="help" icon={<QuestionCircleOutlined />} title="Help">
        <Menu.Item key="docs">
          <div className="d-flex">
            <DocLink />
            <LinkOutlined className="ml-auto align-self-center" />
          </div>
        </Menu.Item>
        <Menu.Item key="examples">
          <div className="d-flex">
            <ExamplesLink />
            <LinkOutlined className="ml-auto align-self-center" />
          </div>
        </Menu.Item>
      </Menu.SubMenu>
      <Menu.LinkItem key="/settings" icon={<SettingOutlined />} title="Settings" />
      <Menu.SubMenu key="account" icon={<UserOutlined />} title="Account">
        <Menu.Item key="token">API Key</Menu.Item>
        <Menu.Item key="userId">User ID</Menu.Item>
        <Menu.Item key="logout">Logout</Menu.Item>
      </Menu.SubMenu>
      <TokenModal visible={tokenModal} onClose={() => setTokenModal(false)} />
      <UserIdModal visible={userIdModal} onClose={() => setUserIdModal(false)} />
    </Menu>
  );
}

export default SidebarBottomMenu;
