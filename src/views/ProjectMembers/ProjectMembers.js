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

import React, { useState, useEffect, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Button, Empty, PageHeader, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import MemberTable from "./MemberTable";
import MemberAddModal from "./MemberAddModal";
import { ProjectsService } from "../../services";
import { AppContext } from "../../AppContext";

function ProjectMembers() {
  const { app } = useContext(AppContext);
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [project, setProject] = useState();
  const [roles, setRoles] = useState([]);
  const [refreshId, setRefreshId] = useState();
  const [memberAddModal, setMemberAddModal] = useState(false);
  const history = useHistory();
  const canUpdateProject = project && project.authorization.project_actions.includes("update");

  useEffect(() => {
    setLoading(true);
    ProjectsService.getProject(projectId)
      .then((project) => {
        setProject(project);
        app.setProject(project);
      })
      .catch((e) => {
        console.error("Cannot get project.", e.message);
        setProject();
        setError(e.message);
        app.setProject();
        app.addNotification("error", "Cannot get project");
      })
      .finally(() => setLoading(false));
  }, [projectId, app]);

  useEffect(() => {
    if (project)
      project
        .getRoles()
        .then((roles) => setRoles(roles))
        .catch((e) => {
          console.error("Cannot get roles.", e.message);
          app.addNotification("error", "Cannot get roles");
        });
  }, [project, app]);

  return (
    <div className="h-100 d-flex flex-column">
      <PageHeader
        backIcon={false}
        title="Project Members"
        extra={[
          canUpdateProject && (
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              disabled={loading}
              onClick={() => setMemberAddModal(true)}
            >
              Add Members
            </Button>
          ),
        ]}
      />
      <div className="align-self-stretch overflow-auto bg-gray">
        <div className="p-4" style={{ margin: "auto", maxWidth: 1000 }}>
          <Spin spinning={loading}>
            {loading ? (
              <div style={{ minHeight: 53 }} />
            ) : project ? (
              <MemberTable project={project} roles={roles} refreshId={refreshId} />
            ) : (
              <Empty description={error}>
                <Button type="primary" onClick={() => history.push("/projects")}>
                  Back to Projects
                </Button>
              </Empty>
            )}
          </Spin>
        </div>
      </div>
      {canUpdateProject && (
        <MemberAddModal
          project={project}
          roles={roles}
          visible={memberAddModal}
          onCreate={() => {
            setMemberAddModal(false);
            setRefreshId(new Date());
          }}
          onClose={() => setMemberAddModal(false)}
        />
      )}
    </div>
  );
}

export default ProjectMembers;
