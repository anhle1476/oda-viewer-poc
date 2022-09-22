import React from "react";
import { ConfigService, LoginService } from "./services";
import { notification } from "antd";
import UserStorage from "./services/UserStorage";
import ClientFactory from "./ClientFactory";

export const AppContext = React.createContext();

export class AppContextProvider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      config: null,
      project: null,
      visualizeJS: null,
    };
  }

  get user() {
    return this.state.user;
  }
  get config() {
    return this.state.config;
  }
  get project() {
    return this.state.project;
  }
  get visualizeJS() {
    return this.state.visualizeJS;
  }

  loadUserOptions(user) {
    if (user.customFields) {
      ClientFactory.get().options.data = user.customFields;
    }
  }

  async loadConfig() {
    this.setState({ config: await ConfigService.getConfig() });
  }

  async loginFromStorage() {
    await this.loadConfig();
    const user = await LoginService.loginFromStorage();
    this.setState({ user });
  }

  async loginWithEmail(email, password, rememberMe) {
    const user = await LoginService.loginWithEmail(email, password, rememberMe);
    this.setState({ user });
    UserStorage.setItem(user.data);
    this.loadUserOptions(user);
    return user;
  }

  logout() {
    this.setState({ user: null });
    UserStorage.setItem(null);
  }

  setProject(project) {
    this.setState({ project });
  }

  async saveUserOptions(optionsData) {
    const data = { ...this.user.data, customFields: { ...this.user.data.customfields, ...optionsData } };
    const user = await this.user.update(data);
    this.setState({ user });
  }

  setVisualizeJS(visualizeJS) {
    this.setState({ visualizeJS });
  }

  async addNotification(type, text, config = {}) {
    const typeToMessage = {
      success: "Success",
      info: "Info",
      error: "Error",
      warning: "Warning",
    };
    const key = config.key || `notification-${Date.now()}`;
    const args = {
      ...config,
      type: type,
      message: config.message || typeToMessage[type],
      description: text,
      key: key,
      onClick: () => notification.close(key),
    };
    notification.open(args);
  }

  render() {
    return <AppContext.Provider value={{ app: this }}>{this.props.children}</AppContext.Provider>;
  }
}

notification.config({ maxCount: 3, placement: "bottomRight" });
