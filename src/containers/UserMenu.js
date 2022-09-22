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
import React, { Component } from "react";
import { Link } from "react-router-dom";

import Window from "../components/Window";
import ClientFactory from "./../ClientFactory";
import { AppContext } from "../AppContext";

class UserMenu extends Component {
  state = {
    tokenWindow: false,
    serverVersion: null,
    serverBuild: null,
  };

  closeTokenWindow = () => this.setState({ tokenWindow: false });
  showTokenWindow = () => this.setState({ tokenWindow: true });

  async componentDidMount() {
    const data = await ClientFactory.get().version();
    this.setState({ serverVersion: data.version, serverBuild: data.build });
  }

  render() {
    const { app } = this.context;
    const user = app.user;
    return (
      <>
        <div className="dropleft">
          <div
            className="cursor-pointer shadow-hover"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <span className="material-icons" style={{ fontSize: "38px" }}>
              account_circle
            </span>
          </div>
          <div
            className="dropdown-menu"
            aria-labelledby="dropdownMenuButton"
            style={{
              boxShadow: "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)",
              borderRadius: "5px",
              border: "1px solid #eeefff",
            }}
          >
            <div className="user-name d-none d-sm-inline dropdown-item">{user.name || user.email}</div>
            <hr className="m-0"></hr>
            <div className="dropdown-item" onClick={app.logout}>
              <Link to="/" className="text-dark">
                Logout
              </Link>
            </div>
            <div className="dropdown-item">
              <div className="cursor-pointer" onClick={this.showTokenWindow}>
                Token
              </div>
            </div>
            <hr className="m-0"></hr>
            <div className="dropdown-item text-secondary">
              <div>
                Client: {process.env.REACT_APP_VERSION}
                {" - "}
                {new Date(Number(process.env.REACT_APP_BUILD_TIME)).toLocaleDateString()}
              </div>
              <div>
                Server: {this.state.serverVersion}
                {" - "}
                {this.state.serverBuild}
              </div>
            </div>
          </div>
        </div>
        {this.state.tokenWindow ? (
          <Window style={{ height: "min-content" }} title="Token" onClose={this.closeTokenWindow}>
            {user.data.tokenInfo.token}
          </Window>
        ) : null}
      </>
    );
  }
}

UserMenu.contextType = AppContext;

export default UserMenu;
