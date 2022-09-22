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

import React, { useState } from "react";
import { Button, Card, List } from "antd";

function ModelList() {
  const [loading] = useState(false);
  const [error] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [models] = useState({ result: [] });

  const emptyText = error
    ? "Error loading models"
    : loading
    ? " "
    : "No project models. To add a model, click Add button.";

  return (
    <Card title="Models" headStyle={{ border: "none" }} extra={<Button type="primary">Add</Button>}>
      <List
        rowKey="id"
        loading={loading}
        locale={{ emptyText: emptyText }}
        pagination={
          models.allSize && {
            ...pagination,
            total: models.allSize,
            showSizeChanger: true,
            showLessItems: true,
            responsive: true,
            disabled: loading,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }
        }
        dataSource={models.result}
        renderItem={(model) => <List.Item key={model.id}></List.Item>}
      />
    </Card>
  );
}

export default ModelList;
