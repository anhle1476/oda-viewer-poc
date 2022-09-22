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
import { useHistory } from "react-router-dom";
import { Avatar, List, Modal, Select, Table, Tag, Tooltip, Typography } from "antd";
import { CrownOutlined, DeleteTwoTone, ExclamationCircleOutlined } from "@ant-design/icons";

import { AppContext } from "../../AppContext";

const { Text, Link } = Typography;
const { Option } = Select;

function MemberTable({ project, roles, refreshId, onDelete }) {
  const { app } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [members, setMembers] = useState([]);
  const user2 = app.user;
  const history = useHistory();
  const canUpdateProject = project.authorization.project_actions.includes("update");

  const columns = [
    {
      title: "User",
      dataIndex: "user",
      render: (user, member) => {
        return (
          <List.Item.Meta
            avatar={
              <Avatar size="large" src={user.avatarUrl}>
                {user.initials}
              </Avatar>
            }
            title={
              <React.Fragment>
                <Text className="mr-2">{user.userName}</Text>
                {member.type === "owner" && (
                  <Tag color="gold" icon={<CrownOutlined />}>
                    Owner
                  </Tag>
                )}
                {user.userId === user2.id && <Tag color="green">It's you</Tag>}
              </React.Fragment>
            }
            description={user.fullName}
          />
        );
      },
      width: "40%",
      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "user",
      render: (user) => <Link href={`mailto:${user.email}`}>{user.email}</Link>,
      responsive: ["md"],
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (_, member) => {
        if (member.type === "owner" || !canUpdateProject) {
          return member.role ? <Tag>{member.role}</Tag> : null;
        }
        return (
          <Select
            value={member.role}
            onSelect={(value) => {
              member
                .update({ ...member.data, role: value })
                .then(() => {
                  app.addNotification("success", "Role has been changed");
                })
                .catch((e) => {
                  console.error("Cannot remove member.", e);
                  app.addNotification("error", "Cannot remove member");
                });
            }}
          >
            {roles.map((x) => (
              <Option key={x.name} value={x.name}>
                {x.name}
              </Option>
            ))}
          </Select>
        );
      },
      responsive: ["sm"],
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, member) => {
        if (member.type === "owner" || !canUpdateProject) {
          return null;
        }
        return (
          <Tooltip title="Remove member">
            <DeleteTwoTone
              className="large-icon"
              twoToneColor="#ff4d4f"
              onClick={() =>
                Modal.confirm({
                  title: "Remove the member?",
                  icon: <ExclamationCircleOutlined />,
                  okText: "Yes",
                  okType: "danger",
                  cancelText: "No",
                  cancelButtonProps: { type: "primary" },
                  onOk: () => {
                    member
                      .delete()
                      .then((data) => {
                        if (data.user.userId === user2.id) {
                          history.push("/projects");
                        } else {
                          const newMembers = members.filter((x) => x.id !== data.id);
                          setMembers(newMembers);
                          app.addNotification("success", "Member removed");
                        }
                      })
                      .catch((e) => {
                        console.error("Cannot remove member.", e);
                        app.addNotification("error", "Cannot remove member");
                      });
                  },
                })
              }
            />
          </Tooltip>
        );
      },
      width: "15%",
      ellipsis: "true",
      align: "end",
    },
  ];

  useEffect(() => {
    setLoading(true);
    project
      .getMembers()
      .then((members) => {
        members.forEach((member) => {
          const fullName = `${member.user.name || ""} ${member.user.lastName || ""}`.trim();
          const initials = (fullName || member.user.userName || "").substring(0, 1).toUpperCase();
          member.data.user = { ...member.data.user, fullName, initials };
        });
        return members;
      })
      .then((members) => setMembers(members))
      .catch((e) => {
        console.error("Cannot get members.", e.message);
        app.addNotification("error", "Cannot get members");
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [project, refreshId, app]);

  const emptyText = error
    ? "Error loading members"
    : loading
    ? " "
    : "No members. To add a new members click Add Member button.";

  const pagination = {
    showSizeChanger: true,
    showLessItems: true,
    responsive: true,
    disabled: loading,
    total: members.length,
  };

  return (
    <Table
      columns={columns}
      rowKey={(row) => row.id}
      dataSource={members}
      pagination={pagination}
      loading={loading}
      locale={{ emptyText: emptyText }}
      bordered={false}
      // showHeader={false}
    />
  );
}

export default MemberTable;
