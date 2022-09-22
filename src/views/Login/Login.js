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
import React from "react";
import { Link } from "react-router-dom";
import { Button, Form, Image, Input, Checkbox, Space, Alert } from "antd";

import { AppContext } from "../../AppContext";

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      error: "",
    };
  }

  handleCloseError() {
    this.setState({ error: "" });
  }

  onFinish = async (values) => {
    const { email, password, rememberMe } = values;
    const { app } = this.context;
    this.setState({ loading: true });
    try {
      await app.loadConfig();
      await app.loginWithEmail(email, password, rememberMe);
    } catch (e) {
      const message = e.message === "Unauthorized" ? "Incorrect username or password." : e.message;
      this.setState({ loading: false, error: message });
      app.addNotification("error", e.message);
    }
  };

  render() {
    const { loading, error } = this.state;
    return (
      <div>
        <div className="oda-content container-fluid">
          <div className="row">
            <div className="col-xs-12 col-md-6 offset-md-3 col-lg-4 offset-lg-4 p-0">
              <Image className="login-logo mb-3" src="logo-full.svg" preview={false} alt="ODA" />
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12 col-md-6 offset-md-3 col-lg-4 offset-lg-4 auth-box">
              <h2 className="text-left" style={{ padding: "20px", color: "#18208a" }}>
                Authentication
              </h2>
              <Form
                layout="vertical"
                name="normal_login"
                className="login-form"
                initialValues={{
                  rememberMe: false,
                }}
                onFinish={this.onFinish}
              >
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Please input your email.",
                    },
                  ]}
                  wrapperCol={{ span: 16 }}
                >
                  <Input disabled={loading} />
                </Form.Item>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: "Please input your password.",
                    },
                  ]}
                  wrapperCol={{ span: 16 }}
                >
                  <Input.Password disabled={loading} />
                </Form.Item>
                <Form.Item name="rememberMe" valuePropName="checked">
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
                {error ? (
                  <Form.Item wrapperCol={{ span: 16 }}>
                    <Alert message={error} type="error" onClick={() => this.handleCloseError()} closable />
                  </Form.Item>
                ) : null}
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Log in
                    </Button>
                    <Button disabled={loading}>
                      <Link to="/register">Register</Link>
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Login.contextType = AppContext;

export default Login;
