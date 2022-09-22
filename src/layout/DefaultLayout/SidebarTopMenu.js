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

import { useLocation, useRouteMatch } from "react-router-dom";
import { useContext } from "react";
import { Menu } from "antd";
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  ProjectOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

import { AppContext } from "../../AppContext";

function SidebarTopMenu({ className }) {
  const { app } = useContext(AppContext);
  const location = useLocation();
  const user = app.user;
  const showProjects = user.customFields["showProjects"] || false;
  const match = useRouteMatch("/projects/:projectId");
  const projectId = match ? match.params.projectId : 0;
  const showProject = showProjects && !!projectId;
  const project = app.project;
  const projectName = project ? project.name : projectId;
  const canUpdateProject = project && project.authorization.project_actions.includes("update");
  return (
    <Menu className={className} selectedKeys={[location.pathname]} mode="inline">
      <Menu.LinkItem key="/files" icon={<UnorderedListOutlined />} title="Files" />
      <Menu.LinkItem key="/assemblies" icon={<AppstoreOutlined />} title="Assemblies" />
      <Menu.LinkItem key="/jobs" icon={<ClockCircleOutlined />} title="Jobs" />
      {showProjects && <Menu.LinkItem key="/projects" icon={<ProjectOutlined />} title="Projects" />}
      {showProject && (
        <Menu.SubMenu key="project" icon={<ExperimentOutlined />} title={projectName}>
          <Menu.LinkItem key={`/projects/${projectId}`} title="Information" />
          <Menu.LinkItem key={`/projects/${projectId}/members`} title="Members" />
          {canUpdateProject && <Menu.LinkItem key={`/projects/${projectId}/settings`} title="Settings" />}
        </Menu.SubMenu>
      )}
    </Menu>
  );
}

export default SidebarTopMenu;
