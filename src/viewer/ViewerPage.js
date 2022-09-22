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
import classNames from "classnames";

import ProgressBar from "../components/ProgressBar";
import { VisualizeProgress } from "./VisualizeJSProgress";
import ClientFactory from "../ClientFactory";
import ViewPointHelper from "./ViewPointHelper";
import { DraggerComponent } from "./DraggerComponent/DraggerComponent";
import { DraggerComponentEvent } from "./DraggerComponent/DraggerComponentEvent";
import { ViewActionComponentEvent } from "./ViewActionComponent/ViewActionComponentEvent";
import { ViewActionComponent } from "./ViewActionComponent/ViewActionComponent";
import HeaderComponent from "./HeaderComponent/HeaderComponent";
import { HeaderComponentEvent } from "./HeaderComponent/HeaderComponentEvent";
import { ViewpointListEvent } from "./ViewpointListComponent/ViewpointListEvent";
import { ViewpointListComponent } from "./ViewpointListComponent/ViewpointListComponent";
import { PropertiesComponent } from "./PropertiesComponent/PropertiesComponent";
import { PropertiesEvent } from "./PropertiesComponent/PropertiesEvent";
import { ContextMenu } from "./ContextMenu/ContextMenu";
import { ContextMenuEvent } from "./ContextMenu/ContextMenuEvent";
import ObjectExplorer from "./ObjectExplorer";
import { SubscribeSubjectContext } from "../utils/SubscribeSubjectContext";
import { ModelContextFactory } from "./ModelContexts/ModelContextFactory";
import { AssemblyTransformComponent } from "./AssemblyTransformComponent/AssemblyTransformComponent";
import { WalkHelperComponent } from "./WalkHelperComponent/WalkHelperComponent";
import { AppContext } from "../AppContext";

const defaultState = {
  modelList: [],
  activeModel: null,
  file: null,
  geometryProgress: 0,
  visualizeProgress: 0,
  databaseLoaded: false,

  isVisibleObjectExplorer: false,
  isVisibleProperties: false,
  isVisibleViewPointView: false,
  isVisibleTransformView: false,

  geometryLoaded: false,
  isCDA: false,
  isLoadIndicatorVisible: false,
  canvasClassName: "default-cursor",
  activeDraggerName: "",
  isWalkHelperComponent: false,
};

class Viewer extends Component {
  state = { ...defaultState };

  isInitialize = null;
  defaultVisualStyle = "";
  viewer = null;
  modelContext = null;

  constructor(props) {
    super(props);
    this.subscribeSubjectContext = new SubscribeSubjectContext();
    this.connectDraggerComponentEvents();
    this.connectViewActionComponentEvents();
    this.connectHeaderComponentEvents();
    this.connectViewpointListComponentEvents();
    this.connectPropertiesEvents();
  }

  toggle = (name) => () => this.setState({ [name]: !this.state[name] });

  connectPropertiesEvents() {
    this.propertiesEvents = new PropertiesEvent();
    this.subscribeSubjectContext.subscribe(this.propertiesEvents.onClose, () => this.toggle("isVisibleProperties")());
  }

  connectViewpointListComponentEvents() {
    this.viewpointListEvents = new ViewpointListEvent();

    this.subscribeSubjectContext.subscribe(this.viewpointListEvents.onClose, () =>
      this.toggle("isVisibleViewPointView")()
    );
    this.subscribeSubjectContext.subscribe(this.viewpointListEvents.onRemoveViewpoint, async (vp) => {
      try {
        await this.state.activeModel.deleteViewpoint(vp.guid);
        this.context.app.addNotification("success", "Viewpoint deleted successfully");
      } catch (e) {
        this.context.app.addNotification("error", "Error delete view point");
      }
    });

    this.subscribeSubjectContext.subscribe(this.viewpointListEvents.onSelectViewpoint, async (vp) => {
      const viewpointModelId = vp.custom_fields && vp.custom_fields.modelId;
      const viewPointPlugin = new ViewPointHelper(this.viewer.visLib());

      if (viewpointModelId !== undefined && this.state.activeModel && this.state.activeModel.id !== viewpointModelId) {
        const model = this.state.modelList.find((model) => model.id === viewpointModelId);
        if (model) {
          try {
            await this.openModel(model);
            viewPointPlugin.drawViewPoint(vp);
          } catch {
            this.context.app.addNotification("error", "Cannot open model");
          }
        }
      } else {
        viewPointPlugin.drawViewPoint(vp);
      }
    });
  }

  connectHeaderComponentEvents() {
    this.headerEventsConnection = new HeaderComponentEvent();

    this.subscribeSubjectContext.subscribe(this.headerEventsConnection.onOpenModel, (model) => this.openModel(model));

    this.subscribeSubjectContext.subscribe(this.headerEventsConnection.onOpenObjectExplorer, () =>
      this.toggle("isVisibleObjectExplorer")()
    );

    this.subscribeSubjectContext.subscribe(this.headerEventsConnection.onOpenProperties, () => {
      this.toggle("isVisibleProperties")();
      if (this.lastProperties) {
        setTimeout(() => {
          this.propertiesEvents.completeLoadProperties.next(this.lastProperties);
        }, 0);
      }
    });

    this.subscribeSubjectContext.subscribe(this.headerEventsConnection.onOpenViewpointView, async () => {
      this.setState({ isVisibleViewPointView: true });

      const viewPoints = await this.state.activeModel.getViewpoints();
      this.viewpointListEvents.changeViewpoints.next(viewPoints);

      for (let vp of viewPoints) {
        if (!vp.snapshot) {
          vp.snapshot = await this.state.activeModel.getSnapshot(vp.guid);
          this.viewpointListEvents.modifyViewpoint.next(vp);
        }
      }
    });
    this.subscribeSubjectContext.subscribe(this.headerEventsConnection.onOpenEdit, () => {
      this.setState({ isVisibleTransformView: true });
    });
  }

  changeVisibleForHelp() {
    if (this.state.activeDraggerName === "Walk") {
      this.viewActionEvents.changeEnableHelp.next(true);
    } else {
      this.viewActionEvents.changeEnableHelp.next(false);
    }
  }

  connectDraggerComponentEvents() {
    this.draggerEventsConnection = new DraggerComponentEvent();
    this.subscribeSubjectContext.subscribe(this.draggerEventsConnection.onActivateDraggerByName, (draggerName) => {
      this.setState({ activeDraggerName: draggerName }, () => {
        this.changeCursorWhenActivateDragger();
        this.changeVisibleForHelp();
      });

      this.viewer.setActiveDragger(draggerName);
    });

    this.subscribeSubjectContext.subscribe(this.draggerEventsConnection.onClearViewPoint, () => {
      this.viewer.clearSlices();
      this.viewer.clearOverlay();
    });

    this.subscribeSubjectContext.subscribe(this.draggerEventsConnection.onSaveViewPoint, async () => {
      const viewPointPlugin = new ViewPointHelper(this.viewer.visLib());
      const vp = viewPointPlugin.getViewPoint(this.viewer.visLib().canvas);

      !vp.custom_fields && (vp.custom_fields = {});
      this.state.activeModel && (vp.custom_fields.modelId = this.state.activeModel.id);

      vp.description = new Date().toDateString();
      let newVp = null;
      try {
        newVp = await this.state.activeModel.saveViewpoint(vp);
        this.context.app.addNotification("success", "Viewpoint saved successfully");
      } catch (e) {
        this.context.app.addNotification("error", "Error save view point");
      }

      if (this.state.isVisibleViewPointView && newVp) {
        if (!newVp.snapshot) {
          newVp.snapshot = await this.state.activeModel.getSnapshot(newVp.guid);
        }
        this.viewpointListEvents.addViewpoint.next(newVp);
      }
    });
  }

  connectViewActionComponentEvents() {
    this.explodeIndex = 1;
    this.viewActionEvents = new ViewActionComponentEvent();
    this.contextMenuEvents = new ContextMenuEvent();

    const execWithLoadIndicator = (cb) => {
      this.setState({ isLoadIndicatorVisible: true }, () => {
        setTimeout(() => {
          cb();
          this.setState({ isLoadIndicatorVisible: false });
        }, 10);
      });
    };

    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onChangeVisualStyle, (name) => {
      execWithLoadIndicator(() => this.viewer.visViewer().setActiveVisualStyle(name));
    });

    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onChangeViewType, (type) => {
      const defViewPos = this.viewer.visLib().DefaultViewPosition;
      this.viewer.visViewer().setDefaultViewPositionWithAnimation(defViewPos[type]);
    });

    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onChangeViewToDefaultValue, () =>
      this.viewer.visViewer().zoomExtents()
    );

    const onUnselect = () => execWithLoadIndicator(() => this.viewer.visViewer().unselect());
    const onIsolateSelectedObjects = () =>
      execWithLoadIndicator(() => this.viewer.visViewer().isolateSelectedObjects(false));
    const onHideSelectedObjects = () => execWithLoadIndicator(() => this.viewer.visViewer().hideSelectedObjects());
    const onShowAll = () => execWithLoadIndicator(() => this.viewer.visViewer().unisolateSelectedObjects(false));

    const onExplode = () =>
      execWithLoadIndicator(() => {
        this.explodeIndex++;
        this.viewer.visViewer().explode(this.explodeIndex);
      });

    const onCollect = () =>
      execWithLoadIndicator(() => {
        this.explodeIndex = 1;
        this.viewer.visViewer().explode(1);
      });

    const onRegeneration = () =>
      execWithLoadIndicator(() => {
        this.viewer.visViewer().regenAll();
      });

    const onCreatePreview = async () => {
      const canvas = this.viewer.visLib().canvas;
      const base64Img = canvas.toDataURL("image/jpeg", 0.25);

      const item = this.modelContext.get();

      item.preview = base64Img;
      item.save();

      this.context.app.addNotification("success", "Update file preview done");
    };

    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onUnselect, onUnselect);
    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onIsolateSelectedObjects, onIsolateSelectedObjects);
    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onHideSelectedObjects, onHideSelectedObjects);
    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onShowAll, onShowAll);
    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onExplode, onExplode);
    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onCollect, onCollect);
    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onRegeneration, onRegeneration);
    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onCreatePreview, onCreatePreview);

    this.subscribeSubjectContext.subscribe(this.contextMenuEvents.onUnselect, onUnselect);
    this.subscribeSubjectContext.subscribe(this.contextMenuEvents.onIsolateSelectedObjects, onIsolateSelectedObjects);
    this.subscribeSubjectContext.subscribe(this.contextMenuEvents.onHideSelectedObjects, onHideSelectedObjects);
    this.subscribeSubjectContext.subscribe(this.contextMenuEvents.onShowAll, onShowAll);
    this.subscribeSubjectContext.subscribe(this.contextMenuEvents.onExplode, onExplode);
    this.subscribeSubjectContext.subscribe(this.contextMenuEvents.onCollect, onCollect);
    this.subscribeSubjectContext.subscribe(this.contextMenuEvents.onRegeneration, onRegeneration);
    this.subscribeSubjectContext.subscribe(this.contextMenuEvents.onCreatePreview, onCreatePreview);

    this.subscribeSubjectContext.subscribe(this.viewActionEvents.onHelp, () => {
      this.setState({ isWalkHelperComponent: true });
    });
  }

  resetVisualStyleInformation = () => {
    this.viewActionEvents.changeDefaultVisualStyle.next(this.viewer.visViewer().getActiveVisualStyle());
  };

  changeCursorWhenDrag = () => {
    if (this.state.activeDraggerName === "Pan") {
      this.setState({ canvasClassName: "pan-active-cursor" });
    } else if (this.state.activeDraggerName === "Orbit") {
      this.setState({ canvasClassName: "orbit-active-cursor" });
    } else {
      this.setState({ canvasClassName: "default-cursor" });
    }
  };

  changeCursorWhenActivateDragger = () => {
    if (this.state.activeDraggerName === "Pan") {
      this.setState({ canvasClassName: "pan-cursor" });
    } else if (this.state.activeDraggerName === "Orbit") {
      this.setState({ canvasClassName: "orbit-cursor" });
    } else {
      this.setState({ canvasClassName: "default-cursor" });
    }
  };

  async componentDidMount() {
    const canvas = document.getElementById("canvas");
    canvas.addEventListener("mousedown", this.changeCursorWhenDrag);
    canvas.addEventListener("mouseup", this.changeCursorWhenActivateDragger);

    const setState = (name, value) => {
      this.setState({ [name]: value });
      return value;
    };

    const contextFactory = new ModelContextFactory();
    this.modelContext = contextFactory.create(this.props.match);

    await this.modelContext.initialize();

    this.headerEventsConnection.changeFileInfo.next(this.modelContext.get());
    this.headerEventsConnection.changeEnableProperties.next(this.modelContext.getHaveProperties());

    // Override visualizeJsUrl below (or in public/config.json) to use your
    // own VisualizeJS library URL, or leave it undefined or blank to use
    // the default URL defined by the Client.js you are using.
    //
    // Note: Your own VisualizeJS library version must match the version of
    // the Client.js you are using.

    this.viewer = await ClientFactory.get().createViewer({
      target: canvas,
      visualizeJsUrl: this.context.app.config.visualizejs_url,
      onprogress: (ev) =>
        this.setState({
          visualizeProgress: ((100 * ev.loaded) / ev.total) | 0,
        }),
    });
    this.setState({ visualizeProgress: null });

    // TODO: remove, debug only
    window['_bi'] = this.viewer;
    window['_vi'] = this.viewer.visualizeJs.getViewer();

    this.viewer.addEventListener("ChangeWalkDraggerSpeed", (speed) => {
      this.context.app.addNotification("success", `Move speed ${speed.data}`);
    });

    this.viewer.addEventListener("select", async (ev) => {
      const sSet = ev.data;
      const itr = sSet.getIterator();
      if (!itr.done()) {
        const entityId = itr.getEntity();
        let handle = -1;
        if (entityId.getType() === 1) {
          handle = entityId.openObject().getNativeDatabaseHandle();
        } else if (entityId.getType() === 2) {
          handle = entityId.openObjectAsInsert().getNativeDatabaseHandle();
        }
        if (this.modelContext.getHaveProperties()) {
          await this.getProperties(handle);
        }
      }
    });

    this.context.app.setVisualizeJS(this.viewer.visLib());
    setState("viewer", this.viewer.visViewer());

    this.viewer.visViewer().setExperimentalFunctionalityFlag("gpu_select", false);
    const models = setState("modelList", await this.modelContext.getModels());

    this.headerEventsConnection.changeModelList.next(models);

    await this.openModel(models.find((model) => model.default) || models[0]);
  }

  getProperties = async (handle) => {
    try {
      this.propertiesEvents.loadingProperties.next(true);
      const props = await this.modelContext.getPropertiesByHandle(handle);
      if (this.state.isVisibleProperties) {
        this.propertiesEvents.completeLoadProperties.next(props);
        this.lastProperties = null;
      } else {
        this.lastProperties = props;
      }
    } catch (e) {
      console.error("Cannot load properties.", e);
      this.propertiesEvents.errorLoadProperties.next(new Error("No properties found"));
    }
  };

  openModel = async (model) => {
    try {
      if (this.viewer) {
        this.viewer.cancel();
        this.viewer.visViewer().unselect();
      }

      this.draggerEventsConnection.changeInitialization.next();
      this.viewActionEvents.changeEnable.next(false);
      this.headerEventsConnection.changeEnable.next(false);
      this.draggerEventsConnection.changeSupportViewPoint.next(this.modelContext.isSupportViewPoint());
      this.headerEventsConnection.changeSupportViewPoint.next(this.modelContext.isSupportViewPoint());
      this.headerEventsConnection.changeSupportTransform.next(this.modelContext.isSupportTransform());

      await this.viewer.loadReferences(model);

      this.setState({
        activeModel: model,
        displayObjectExplorer: false,
        properties: false,
        settings: false,
      });

      const progress = (event) => this.setState({ geometryProgress: event.data });
      const databaseChunk = () => {
        this.setState({ databaseLoaded: true });

        this.draggerEventsConnection.changeEnable.next(true);
        this.viewActionEvents.changeEnable.next(true);
        this.headerEventsConnection.changeEnable.next(true);

        this.resetVisualStyleInformation();
      };

      this.viewer.addEventListener("geometry-progress", progress);
      this.viewer.addEventListener("database-chunk", databaseChunk);

      await this.viewer.open(model);

      this.viewer.removeEventListener("database-chunk", databaseChunk);
      this.viewer.removeEventListener("geometry-progress", progress);

      {
        const itr = this.viewer.visViewer().getCDATreeIterator();
        this.headerEventsConnection.changeEnableObjectExplorer.next(!itr.done());
        this.setState({
          geometryLoaded: true,
          isCDA: !itr.done() && ClientFactory.getConfig().cda,
        });
      }

      const extFile = this.modelContext.getExtension();
      if (extFile === ".obj" || extFile === ".ifc") this.viewer.visViewer().setBackgroundColor([255, 255, 255]);

      const ext = this.viewer.visViewer().getActiveExtents();
      const min = ext.min();
      const max = ext.max();
      const extHeight = max[2] - min[2];

      this.draggerEventsConnection.change3dMode.next(extHeight !== 0);
    } catch (e) {
      console.error("Cannot open model.", e);
    }
  };

  render() {
    return (
      <div className="h-100 d-flex flex-column">
        <div>
          <ProgressBar progress={this.state.geometryProgress * 100} />
        </div>

        <HeaderComponent
          isAssembly={!!this.props.match.params.assemblyId}
          eventsConnection={this.headerEventsConnection}
        />

        {/* Content */}
        <div className="flex-grow-1 overflow-hidden">
          <canvas id="canvas" className={classNames(this.state.canvasClassName, "w-100 h-100")} />

          {this.state.visualizeProgress && <VisualizeProgress value={this.state.visualizeProgress} />}

          <DraggerComponent eventsConnection={this.draggerEventsConnection}></DraggerComponent>

          <ViewActionComponent eventsConnection={this.viewActionEvents}></ViewActionComponent>

          <ContextMenu eventsConnection={this.contextMenuEvents}></ContextMenu>
        </div>

        {this.state.isLoadIndicatorVisible ? (
          <div
            style={{
              position: "absolute",
              top: "calc(50% - 100px)",
              left: "calc(50% - 100px)",
              width: "200px",
              height: "200px",
              color: "#05093B",
            }}
            className="spinner-border"
            role="status"
          ></div>
        ) : null}

        {this.state.isVisibleObjectExplorer ? (
          <ObjectExplorer
            lib={this.viewer.visLib()}
            viewer={this.viewer.visViewer()}
            cda={this.state.isCDA}
            getProperties={this.getProperties}
            onClose={this.toggle("isVisibleObjectExplorer")}
          />
        ) : null}
        {this.state.isVisibleProperties ? <PropertiesComponent eventsConnection={this.propertiesEvents} /> : null}
        {this.state.isVisibleViewPointView ? (
          <ViewpointListComponent eventsConnection={this.viewpointListEvents} />
        ) : null}
        {this.state.isVisibleTransformView ? (
          <AssemblyTransformComponent
            viewer={this.viewer}
            assembly={this.modelContext.get()}
            onClose={this.toggle("isVisibleTransformView")}
          ></AssemblyTransformComponent>
        ) : null}
        {this.state.isWalkHelperComponent ? (
          <WalkHelperComponent onClose={this.toggle("isWalkHelperComponent")}></WalkHelperComponent>
        ) : null}
      </div>
    );
  }

  componentWillUnmount() {
    const canvas = document.getElementById("canvas");
    canvas.removeEventListener("mousedown", this.changeCursorWhenDrag);
    canvas.removeEventListener("mouseup", this.changeCursorWhenActivateDragger);
    if (this.viewer) {
      this.viewer.cancel();
      this.viewer.dispose();
    }
    this.subscribeSubjectContext.unsubscribe();
  }
}

Viewer.contextType = AppContext;

export default Viewer;
