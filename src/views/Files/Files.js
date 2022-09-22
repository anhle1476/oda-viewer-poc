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
import moment from "moment";
import bytes from "bytes";
import { PageHeader, Table, Tooltip, Button, Modal } from "antd";
import {
  DeleteTwoTone,
  RightSquareTwoTone,
  CloudUploadOutlined,
  AppstoreAddOutlined,
  CloudDownloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import { StatusTag, JOB_STATUS, PreviewIcon, ProgressBar, NameFilter } from "../../components";
import defaultPreview from "../../images/default-preview.png";
import DrawingReference from "../../components/DrawingReference";
import CreateDrawing from "../../components/CreateDrawing";
import CreateAssembly from "../../components/CreateAssembly";
import ClientFactory from "../../ClientFactory";
import { FilesService } from "../../services";
import { AppContext } from "../../AppContext";

class Files extends React.Component {
  columns = [
    {
      title: "",
      dataIndex: "preview",
      render: (preview) => <PreviewIcon preview={preview} defaultPreview={defaultPreview} />,
      className: "d-none d-sm-table-cell",
      width: 140,
    },
    {
      title: "File Name",
      dataIndex: "name",
      render: (name, file) => (file.status === JOB_STATUS.DONE ? <Link to={`/files/${file.id}`}>{name}</Link> : name),
      ...NameFilter("Filter by Name"),
      // ellipsis: { showTitle: false },
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (type) => type.substring(1).toUpperCase(),
      filters: ClientFactory.getConfig().supportFormats.map((item) => ({
        text: item,
        value: item.toLowerCase(),
      })),
      ellipsis: { showTitle: false },
      width: "7%",
    },
    {
      title: "Size",
      dataIndex: "size",
      render: (size) => bytes.format(size, { decimalPlaces: 0, unitSeparator: " " }),
      ellipsis: { showTitle: false },
      width: "7%",
    },
    {
      title: "Geometry Status",
      dataIndex: "geometryStatus",
      render: (status) => <StatusTag status={status} />,
      ellipsis: { showTitle: false },
      width: "7%",
    },
    {
      title: "Properties Status",
      dataIndex: "propertiesStatus",
      render: (status) => <StatusTag status={status} />,
      ellipsis: { showTitle: false },
      width: "7%",
    },
    {
      title: "Created At",
      dataIndex: "created",
      render: (created) => moment(created).format("L LT"),
      ellipsis: { showTitle: false },
      width: "12%",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, file) => {
        return (
          <div>
            {file.geometryStatus === JOB_STATUS.DONE ? (
              <Link to={`/files/${file.id}`}>
                <Tooltip title="Open file in the viewer">
                  <RightSquareTwoTone className="mr-1 large-icon"></RightSquareTwoTone>
                </Tooltip>
              </Link>
            ) : null}
            <Tooltip title="Download original file">
              <CloudDownloadOutlined
                className="mr-2 large-icon"
                style={{ color: "#359eff" }}
                onClick={() => this.downloadOriginalFile(file)}
              />
            </Tooltip>
            <Tooltip title="Delete file">
              <DeleteTwoTone
                className="large-icon"
                twoToneColor="#ff4d4f"
                onClick={() =>
                  Modal.confirm({
                    title: "Delete the file?",
                    icon: <ExclamationCircleOutlined />,
                    okText: "Yes",
                    okType: "danger",
                    cancelText: "No",
                    cancelButtonProps: { type: "primary" },
                    onOk: () => this.deleteFile(file),
                  })
                }
              />
            </Tooltip>
          </div>
        );
      },
      ellipsis: { showTitle: false },
      width: "10%",
    },
  ];

  constructor(props) {
    super(props);
    this.state = {
      files: [],
      loading: true,
      error: "",
      uploadProgress: 0,
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        position: ["bottomCenter"],
        showSizeChanger: true,
      },
      filters: {
        name: [],
        type: [],
      },
      showCreateDrawingComponent: false,
      showCreateReferenceComponent: false,
      showCreateAssemblyComponent: false,
      selectedFilesId: [],
    };

    const supportFormats = ClientFactory.getConfig().supportFormats;
    this.supportFormats = new Map();
    supportFormats.forEach((format) => this.supportFormats.set(`.${format.toLowerCase()}`, 0));
  }

  componentDidMount() {
    const tableBody = document.querySelector(".ant-table-body");
    if (tableBody) {
      const styleUpdate = { height: tableBody.style.maxHeight };
      Object.assign(tableBody.style, styleUpdate);
    }

    this.getFiles();

    const isNeedUpdate = () => {
      return this.state.files.some((file) => !file.done && this.supportFormats.has(file.type.toLowerCase()));
    };

    this.interval = setInterval(() => {
      if (isNeedUpdate()) this.getFiles();
    }, 5000);

    ClientFactory.get().addEventListener("upload-progress", this.onUploadProgress);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ClientFactory.get().removeEventListener("upload-progress", this.onUploadProgress);
  }

  getFiles = async (page, pageSize, name, type) => {
    const { pagination, filters } = this.state;
    if (page === undefined) page = pagination.current;
    if (pageSize === undefined) pageSize = pagination.pageSize;
    if (name === undefined) name = filters.name;
    if (type === undefined) type = filters.type;
    this.setState({ loading: true, error: "", filters: { name: name, type: type } });
    try {
      const files = await FilesService.getFiles(page, pageSize, name[0], type);
      this.setState({
        files: files.result,
        loading: false,
        pagination: { ...pagination, total: files.allSize, current: page, pageSize: pageSize },
      });
    } catch (e) {
      console.error("Cannot load files.", e);
      this.setState({ loading: false, error: e.message });
      this.context.app.addNotification("error", "Cannot get files", e.message);
    }
  };

  deleteFile = async (file) => {
    try {
      await file.delete();
      const { files, pagination } = this.state;
      this.setState({
        files: files.filter((x) => x !== file),
        pagination: { ...pagination, total: pagination.total - 1 },
      });
      this.context.app.addNotification("success", "File deleted");
    } catch (e) {
      console.error("Cannot delete file.", e);
      this.context.app.addNotification("error", "Cannot delete file");
    }
  };

  downloadOriginalFile = (file) => {
    return file
      .downloadResource(`${file.id}${file.type}`)
      .then((arrayBuffer) => new Blob([arrayBuffer]))
      .then((blob) => {
        window["download"](blob, file.name);
        this.context.app.addNotification("success", "File download complete");
      })
      .catch((e) => {
        console.error("Cannot download file.", e);
        this.context.app.addNotification("error", "Cannot download file");
      });
  };

  handleTableChange = (pagination, filters) => {
    this.getFiles(pagination.current, pagination.pageSize, filters.name || [], filters.type || []);
  };

  onUploadProgress = (ev) => {
    this.setState({ uploadProgress: ev.data * 100 });
  };

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedFilesId: selectedRowKeys });
  };

  onShowCreateAssemblyDlg = () => {
    this.setState({
      showCreateAssemblyComponent: true,
    });
  };

  onCloseCreateAssemblyDlg = () => {
    this.setState({
      showCreateAssemblyComponent: false,
    });
  };

  onResolveCreateDrawing = (file) => {
    this.drawingFile = file;
    this.referenceFiles = [];
    this.setState({
      showCreateDrawingComponent: false,
      showCreateReferenceComponent: true,
    });
  };

  onRejectCreateDrawing = () => {
    this.setState({
      showCreateDrawingComponent: false,
      showCreateReferenceComponent: false,
    });
  };

  onResolveCreateReference = async (files) => {
    this.referenceFiles = files;
    this.setState({
      showCreateDrawingComponent: false,
      showCreateReferenceComponent: false,
    });
    try {
      await FilesService.uploadFiles(this.drawingFile, this.referenceFiles, this.onUploadProgress);
      this.getFiles();
      this.context.app.addNotification("success", "File uploaded");
    } catch (e) {
      console.error("Cannot upload file.", e);
      this.context.app.addNotification("error", "Cannot upload file");
    }
  };

  onRejectCreateReference = () => {
    this.drawingFile = null;
    this.referenceFiles = [];
    this.setState({
      showCreateDrawingComponent: false,
      showCreateReferenceComponent: false,
    });
  };

  onCreateAssembly = async (name, files) => {
    const fileIds = files.map((file) => file.id);
    try {
      await ClientFactory.get().createAssembly(fileIds, name);
      this.context.app.addNotification("success", "Assembly created");
    } catch (e) {
      console.error("Cannot create assembly.", e);
      this.context.app.addNotification("error", "Cannot create assembly");
    }

    this.setState({ selectedFilesId: [], showCreateAssemblyComponent: false });
  };

  render() {
    const {
      showCreateDrawingComponent,
      showCreateReferenceComponent,
      showCreateAssemblyComponent,
      files,
      pagination,
      filters,
      loading,
      error,
      uploadProgress,
      selectedFilesId,
    } = this.state;

    const filtered = filters.name.length > 0 || filters.type.length > 0;
    const emptyText = error
      ? "Error loading files"
      : loading
      ? " "
      : filtered
      ? "No files matching the filter"
      : "No files. To add a new file, click Upload File button.";

    const rowSelection = {
      selectedRowKeys: selectedFilesId,
      onChange: this.onSelectChange,
    };

    return (
      <React.Fragment>
        <div>
          <ProgressBar progress={uploadProgress} />
        </div>
        <PageHeader
          backIcon={false}
          title="Files"
          extra={[
            <Button
              key="upload"
              type="primary"
              icon={<CloudUploadOutlined />}
              disabled={loading || error}
              onClick={() => this.setState({ showCreateDrawingComponent: true })}
            >
              Upload File
            </Button>,
            <Button
              key="assembly"
              icon={<AppstoreAddOutlined />}
              disabled={selectedFilesId.length < 2}
              onClick={this.onShowCreateAssemblyDlg}
            >
              Create Assembly
            </Button>,
          ]}
        />
        <Table
          size="small"
          columns={this.columns}
          rowKey={(row) => row.id}
          dataSource={files}
          pagination={pagination}
          loading={loading}
          locale={{ emptyText: emptyText }}
          onChange={this.handleTableChange}
          scroll={{ x: true, y: "calc(100vh - 170px)" }}
          rowSelection={rowSelection}
        />
        {showCreateDrawingComponent ? (
          <CreateDrawing
            supportFormats={ClientFactory.getConfig().supportFormats}
            onResolve={this.onResolveCreateDrawing}
            onReject={this.onRejectCreateDrawing}
          ></CreateDrawing>
        ) : null}
        {showCreateReferenceComponent ? (
          <DrawingReference
            onResolve={this.onResolveCreateReference}
            onReject={this.onRejectCreateReference}
          ></DrawingReference>
        ) : null}
        {showCreateAssemblyComponent ? (
          <CreateAssembly
            files={selectedFilesId}
            onResolve={this.onCreateAssembly}
            onCloseHandler={this.onCloseCreateAssemblyDlg}
          ></CreateAssembly>
        ) : null}
      </React.Fragment>
    );
  }
}

Files.contextType = AppContext;

export default Files;
