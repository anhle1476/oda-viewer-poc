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
import { Switch, Route, Redirect } from "react-router-dom";
import { useContext } from "react";
import { Layout } from "antd";

import { AppContext } from "../../AppContext";
import ViewerPage from "../../viewer/ViewerPage";
import Files from "../../views/Files";
import Assemblies from "../../views/Assemblies";
import Jobs from "../../views/Jobs";
import Options from "../../views/Options";
import Projects from "../../views/Projects";
import ProjectDashboard from "../../views/ProjectDashboard";
import ProjectSettings from "../../views/ProjectSettings";
import ProjectMembers from "../../views/ProjectMembers";
import Sidebar from "./Sidebar";

const { Content } = Layout;

function DefaultLayout() {
  const { app } = useContext(AppContext);
  const user = app.user;
  const showProjects = user.customFields["showProjects"] || false;
  return (
    <Layout className="vh-100 bg-white">
      <Sidebar theme="light" active="Files"></Sidebar>
      <Content>
        <Switch>
          <Route exact path="/files/:fileId" component={ViewerPage} />
          <Route exact path="/files" component={Files} />
          <Route exact path="/assemblies/:assemblyId" component={ViewerPage} />
          <Route exact path="/assemblies" component={Assemblies} />
          <Route exact path="/jobs" component={Jobs} />
          <Route exact path="/settings" component={Options} />
          {showProjects && <Route exact path="/projects/:projectId/settings" component={ProjectSettings} />}
          {showProjects && <Route exact path="/projects/:projectId/members" component={ProjectMembers} />}
          {showProjects && <Route exact path="/projects/:projectId" component={ProjectDashboard} />}
          {showProjects && <Route exact path="/projects" component={Projects} />}
          <Redirect to="/files" />
        </Switch>
      </Content>
    </Layout>
  );
}

export default DefaultLayout;
