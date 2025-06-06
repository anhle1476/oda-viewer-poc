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
import { Button, Modal, Typography } from "antd";
import { useContext } from "react";

import { AppContext } from "../../AppContext";

const { Text } = Typography;

function UserIdModal({ visible, onClose }) {
  const { app } = useContext(AppContext);
  const userId = app.user.id;

  function handleCopy() {
    navigator.clipboard
      .writeText(userId)
      .then(() => app.addNotification("success", "Copied to clipboard"))
      .catch((error) => {
        console.error(error);
        app.addNotification("error", "Cannot copy User ID");
      });
  }

  return (
    <Modal
      visible={visible}
      title="User ID"
      closable={false}
      footer={[
        <Button key="copy" onClick={handleCopy}>
          Copy to Clipboard
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
      onCancel={onClose}
    >
      <Text>{userId}</Text>
    </Modal>
  );
}

export default UserIdModal;
