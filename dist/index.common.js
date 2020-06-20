"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.VXETablePluginVirtualTree = void 0;

var _xeUtils = _interopRequireDefault(require("xe-utils/methods/xe-utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-enable no-unused-vars */
function countTreeExpand($xTree, prevRow) {
  var rowChildren = prevRow[$xTree.treeOpts.children];
  var count = 1;

  if ($xTree.isTreeExpandByRow(prevRow)) {
    for (var index = 0; index < rowChildren.length; index++) {
      count += countTreeExpand($xTree, rowChildren[index]);
    }
  }

  return count;
}

function getOffsetSize($xTree) {
  switch ($xTree.vSize) {
    case 'mini':
      return 3;

    case 'small':
      return 2;

    case 'medium':
      return 1;
  }

  return 0;
}

function calcTreeLine($table, $xTree, matchObj) {
  var index = matchObj.index,
      items = matchObj.items;
  var expandSize = 1;

  if (index) {
    expandSize = countTreeExpand($xTree, items[index - 1]);
  }

  return $table.rowHeight * expandSize - (index ? 1 : 12 - getOffsetSize($xTree));
}

function registerComponent(_ref) {
  var Vue = _ref.Vue,
      Table = _ref.Table,
      Grid = _ref.Grid,
      setup = _ref.setup,
      t = _ref.t;
  var GlobalConfig = setup();
  var propKeys = Object.keys(Table.props).filter(function (name) {
    return ['data', 'treeConfig'].indexOf(name) === -1;
  });
  var VirtualTree = {
    name: 'VxeVirtualTree',
    "extends": Grid,
    data: function data() {
      return {
        removeList: []
      };
    },
    crested: function crested() {
      if (this.keepSource || this.treeOpts.lazy) {
        console.error('[plugin-virtual-tree] Unsupported parameters.');
      }
    },
    computed: {
      vSize: function vSize() {
        return this.size || this.$parent.size || this.$parent.vSize;
      },
      treeOpts: function treeOpts() {
        return Object.assign({
          children: 'children',
          hasChild: 'hasChild',
          indent: 20
        }, GlobalConfig.treeConfig, this.treeConfig);
      },
      renderClass: function renderClass() {
        var _ref2;

        var vSize = this.vSize;
        return ['vxe-grid vxe-virtual-tree', (_ref2 = {}, _defineProperty(_ref2, "size--".concat(vSize), vSize), _defineProperty(_ref2, 't--animat', this.animat), _defineProperty(_ref2, 'has--tree-line', this.treeConfig && this.treeOpts.line), _defineProperty(_ref2, 'is--maximize', this.isMaximized()), _ref2)];
      },
      tableExtendProps: function tableExtendProps() {
        var _this = this;

        var rest = {};
        propKeys.forEach(function (key) {
          rest[key] = _this[key];
        });
        return rest;
      }
    },
    watch: {
      columns: function columns() {
        this.loadColumn(this.handleColumns());
      },
      data: function data(value) {
        this.loadData(value);
      }
    },
    created: function created() {
      var data = this.data;
      Object.assign(this, {
        fullTreeData: [],
        tableData: [],
        fullTreeRowMap: new Map()
      });
      this.handleColumns();

      if (data) {
        this.reloadData(data);
      }
    },
    methods: {
      getTableOns: function getTableOns() {
        var _this2 = this;

        var $listeners = this.$listeners,
            proxyConfig = this.proxyConfig,
            proxyOpts = this.proxyOpts;
        var ons = {};

        _xeUtils["default"].each($listeners, function (cb, type) {
          ons[type] = function () {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            _this2.$emit.apply(_this2, [type].concat(args));
          };
        });

        ons['checkbox-all'] = this.checkboxAllEvent;
        ons['checkbox-change'] = this.checkboxChangeEvent;

        if (proxyConfig) {
          if (proxyOpts.sort) {
            ons['sort-change'] = this.sortChangeEvent;
          }

          if (proxyOpts.filter) {
            ons['filter-change'] = this.filterChangeEvent;
          }
        }

        return ons;
      },
      renderTreeLine: function renderTreeLine(params, h) {
        var treeConfig = this.treeConfig,
            treeOpts = this.treeOpts,
            fullTreeRowMap = this.fullTreeRowMap;
        var $table = params.$table,
            row = params.row,
            column = params.column;
        var treeNode = column.treeNode;

        if (treeNode && treeConfig && treeOpts.line) {
          var $xTree = this;
          var rowLevel = row._X_LEVEL;
          var matchObj = fullTreeRowMap.get(row);
          return [treeNode && treeOpts.line ? h('div', {
            "class": 'vxe-tree--line-wrapper'
          }, [h('div', {
            "class": 'vxe-tree--line',
            style: {
              height: "".concat(calcTreeLine($table, $xTree, matchObj), "px"),
              left: "".concat(rowLevel * (treeOpts.indent || 20) + (rowLevel ? 2 - getOffsetSize($xTree) : 0) + 16, "px")
            }
          })]) : null];
        }

        return [];
      },
      renderTreeIcon: function renderTreeIcon(params, h, cellVNodes) {
        var _this3 = this;

        var isHidden = params.isHidden;
        var row = params.row;
        var _this$treeOpts = this.treeOpts,
            children = _this$treeOpts.children,
            indent = _this$treeOpts.indent,
            trigger = _this$treeOpts.trigger,
            iconOpen = _this$treeOpts.iconOpen,
            iconClose = _this$treeOpts.iconClose;
        var rowChildren = row[children];
        var isAceived = false;
        var on = {};

        if (!isHidden) {
          isAceived = row._X_EXPAND;
        }

        if (!trigger || trigger === 'default') {
          on.click = function () {
            return _this3.toggleTreeExpand(row);
          };
        }

        return [h('div', {
          "class": ['vxe-cell--tree-node', {
            'is--active': isAceived
          }],
          style: {
            paddingLeft: "".concat(row._X_LEVEL * indent, "px")
          }
        }, [rowChildren && rowChildren.length ? [h('div', {
          "class": 'vxe-tree--btn-wrapper',
          on: on
        }, [h('i', {
          "class": ['vxe-tree--node-btn', isAceived ? iconOpen || GlobalConfig.icon.TABLE_TREE_OPEN : iconClose || GlobalConfig.icon.TABLE_TREE_CLOSE]
        })])] : null, h('div', {
          "class": 'vxe-tree-cell'
        }, cellVNodes)])];
      },
      _loadTreeData: function _loadTreeData(data) {
        var _this4 = this;

        var selectRow = this.getRadioRecord();
        return this.$nextTick().then(function () {
          return _this4.$refs.xTable.loadData(data);
        }).then(function () {
          if (selectRow) {
            _this4.setRadioRow(selectRow);
          }
        });
      },
      loadData: function loadData(data) {
        return this._loadTreeData(this.toVirtualTree(data));
      },
      reloadData: function reloadData(data) {
        var _this5 = this;

        return this.$nextTick().then(function () {
          return _this5.$refs.xTable.reloadData(_this5.toVirtualTree(data));
        }).then(function () {
          return _this5.handleDefaultTreeExpand();
        });
      },
      isTreeExpandByRow: function isTreeExpandByRow(row) {
        return !!row._X_EXPAND;
      },
      setTreeExpansion: function setTreeExpansion(rows, expanded) {
        return this.setTreeExpand(rows, expanded);
      },
      setTreeExpand: function setTreeExpand(rows, expanded) {
        var _this6 = this;

        if (rows) {
          if (!_xeUtils["default"].isArray(rows)) {
            rows = [rows];
          }

          rows.forEach(function (row) {
            return _this6.virtualExpand(row, !!expanded);
          });
        }

        return this._loadTreeData(this.tableData);
      },
      setAllTreeExpansion: function setAllTreeExpansion(expanded) {
        return this.setAllTreeExpand(expanded);
      },
      setAllTreeExpand: function setAllTreeExpand(expanded) {
        return this._loadTreeData(this.virtualAllExpand(expanded));
      },
      toggleTreeExpansion: function toggleTreeExpansion(row) {
        return this.toggleTreeExpand(row);
      },
      toggleTreeExpand: function toggleTreeExpand(row) {
        return this._loadTreeData(this.virtualExpand(row, !row._X_EXPAND));
      },
      getTreeExpandRecords: function getTreeExpandRecords() {
        var hasChilds = this.hasChilds;
        var treeExpandRecords = [];

        _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
          if (row._X_EXPAND && hasChilds(row)) {
            treeExpandRecords.push(row);
          }
        }, this.treeOpts);

        return treeExpandRecords;
      },
      clearTreeExpand: function clearTreeExpand() {
        return this.setAllTreeExpand(false);
      },
      handleColumns: function handleColumns() {
        var _this7 = this;

        return this.columns.map(function (conf) {
          if (conf.treeNode) {
            var slots = conf.slots || {};
            slots.icon = _this7.renderTreeIcon;
            slots.line = _this7.renderTreeLine;
            conf.slots = slots;
          }

          return conf;
        });
      },
      hasChilds: function hasChilds(row) {
        var childList = row[this.treeOpts.children];
        return childList && childList.length;
      },

      /**
       * 获取表格数据集，包含新增、删除、修改
       */
      getRecordset: function getRecordset() {
        return {
          insertRecords: this.getInsertRecords(),
          removeRecords: this.getRemoveRecords(),
          updateRecords: this.getUpdateRecords()
        };
      },
      isInsertByRow: function isInsertByRow(row) {
        return !!row._X_INSERT;
      },
      getInsertRecords: function getInsertRecords() {
        var insertRecords = [];

        _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
          if (row._X_INSERT) {
            insertRecords.push(row);
          }
        }, this.treeOpts);

        return insertRecords;
      },
      insert: function insert(records) {
        return this.insertAt(records);
      },
      insertAt: function insertAt(records, row) {
        var _this8 = this;

        var fullTreeData = this.fullTreeData,
            tableData = this.tableData,
            treeOpts = this.treeOpts;

        if (!_xeUtils["default"].isArray(records)) {
          records = [records];
        }

        var newRecords = records.map(function (record) {
          return _this8.defineField(Object.assign({
            _X_EXPAND: false,
            _X_INSERT: true,
            _X_LEVEL: 0
          }, record));
        });

        if (!row) {
          fullTreeData.unshift.apply(fullTreeData, newRecords);
          tableData.unshift.apply(tableData, newRecords);
        } else {
          if (row === -1) {
            fullTreeData.push.apply(fullTreeData, newRecords);
            tableData.push.apply(tableData, newRecords);
          } else {
            var matchObj = _xeUtils["default"].findTree(fullTreeData, function (item) {
              return item === row;
            }, treeOpts);

            if (!matchObj || matchObj.index === -1) {
              throw new Error(t('vxe.error.unableInsert'));
            }

            var items = matchObj.items,
                index = matchObj.index,
                nodes = matchObj.nodes;
            var rowIndex = tableData.indexOf(row);

            if (rowIndex > -1) {
              tableData.splice.apply(tableData, [rowIndex, 0].concat(newRecords));
            }

            items.splice.apply(items, [index, 0].concat(newRecords));
            newRecords.forEach(function (item) {
              item._X_LEVEL = nodes.length - 1;
            });
          }
        }

        return this._loadTreeData(tableData).then(function () {
          return {
            row: newRecords.length ? newRecords[newRecords.length - 1] : null,
            rows: newRecords
          };
        });
      },

      /**
       * 获取已删除的数据
       */
      getRemoveRecords: function getRemoveRecords() {
        return this.removeList;
      },
      removeSelecteds: function removeSelecteds() {
        return this.removeCheckboxRow();
      },

      /**
       * 删除选中数据
       */
      removeCheckboxRow: function removeCheckboxRow() {
        var _this9 = this;

        return this.remove(this.getSelectRecords()).then(function (params) {
          _this9.clearSelection();

          return params;
        });
      },
      remove: function remove(rows) {
        var _this10 = this;

        var removeList = this.removeList,
            fullTreeData = this.fullTreeData,
            treeOpts = this.treeOpts;
        var rest = [];

        if (!rows) {
          rows = fullTreeData;
        } else if (!_xeUtils["default"].isArray(rows)) {
          rows = [rows];
        }

        rows.forEach(function (row) {
          var matchObj = _xeUtils["default"].findTree(fullTreeData, function (item) {
            return item === row;
          }, treeOpts);

          if (matchObj) {
            var item = matchObj.item,
                items = matchObj.items,
                index = matchObj.index,
                parent = matchObj.parent;

            if (!_this10.isInsertByRow(row)) {
              removeList.push(row);
            }

            if (parent) {
              var isExpand = _this10.isTreeExpandByRow(parent);

              if (isExpand) {
                _this10.handleCollapsing(parent);
              }

              items.splice(index, 1);

              if (isExpand) {
                _this10.handleExpanding(parent);
              }
            } else {
              _this10.handleCollapsing(item);

              items.splice(index, 1);

              _this10.tableData.splice(_this10.tableData.indexOf(item), 1);
            }

            rest.push(item);
          }
        });
        return this._loadTreeData(this.tableData).then(function () {
          return {
            row: rest.length ? rest[rest.length - 1] : null,
            rows: rest
          };
        });
      },

      /**
       * 处理默认展开树节点
       */
      handleDefaultTreeExpand: function handleDefaultTreeExpand() {
        var _this11 = this;

        var treeConfig = this.treeConfig,
            treeOpts = this.treeOpts,
            tableFullData = this.tableFullData;

        if (treeConfig) {
          var children = treeOpts.children,
              expandAll = treeOpts.expandAll,
              expandRowKeys = treeOpts.expandRowKeys;

          if (expandAll) {
            this.setAllTreeExpand(true);
          } else if (expandRowKeys) {
            var rowkey = this.rowId;
            expandRowKeys.forEach(function (rowid) {
              var matchObj = _xeUtils["default"].findTree(tableFullData, function (item) {
                return rowid === _xeUtils["default"].get(item, rowkey);
              }, treeOpts);

              var rowChildren = matchObj ? matchObj.item[children] : 0;

              if (rowChildren && rowChildren.length) {
                _this11.setTreeExpand(matchObj.item, true);
              }
            });
          }
        }
      },

      /**
       * 定义树属性
       */
      toVirtualTree: function toVirtualTree(treeData) {
        var fullTreeRowMap = this.fullTreeRowMap;
        fullTreeRowMap.clear();

        _xeUtils["default"].eachTree(treeData, function (item, index, items, paths, parent, nodes) {
          item._X_EXPAND = false;
          item._X_INSERT = false;
          item._X_LEVEL = nodes.length - 1;
          fullTreeRowMap.set(item, {
            item: item,
            index: index,
            items: items,
            paths: paths,
            parent: parent,
            nodes: nodes
          });
        });

        this.fullTreeData = treeData.slice(0);
        this.tableData = treeData.slice(0);
        return treeData;
      },

      /**
       * 展开/收起树节点
       */
      virtualExpand: function virtualExpand(row, expanded) {
        if (row._X_EXPAND !== expanded) {
          if (row._X_EXPAND) {
            this.handleCollapsing(row);
          } else {
            this.handleExpanding(row);
          }
        }

        return this.tableData;
      },
      // 展开节点
      handleExpanding: function handleExpanding(row) {
        if (this.hasChilds(row)) {
          var tableData = this.tableData,
              treeOpts = this.treeOpts;
          var childRows = row[treeOpts.children];
          var expandList = [];
          var rowIndex = tableData.indexOf(row);

          if (rowIndex === -1) {
            throw new Error('错误的操作！');
          }

          _xeUtils["default"].eachTree(childRows, function (item, index, obj, paths, parent, nodes) {
            if (!parent || parent._X_EXPAND) {
              expandList.push(item);
            }
          }, treeOpts);

          row._X_EXPAND = true;
          tableData.splice.apply(tableData, [rowIndex + 1, 0].concat(expandList));
        }

        return this.tableData;
      },
      // 收起节点
      handleCollapsing: function handleCollapsing(row) {
        if (this.hasChilds(row)) {
          var tableData = this.tableData,
              treeOpts = this.treeOpts;
          var childRows = row[treeOpts.children];
          var nodeChildList = [];

          _xeUtils["default"].eachTree(childRows, function (item) {
            nodeChildList.push(item);
          }, treeOpts);

          row._X_EXPAND = false;
          this.tableData = tableData.filter(function (item) {
            return nodeChildList.indexOf(item) === -1;
          });
        }

        return this.tableData;
      },

      /**
       * 展开/收起所有树节点
       */
      virtualAllExpand: function virtualAllExpand(expanded) {
        var treeOpts = this.treeOpts;

        if (expanded) {
          var tableList = [];

          _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
            row._X_EXPAND = expanded;
            tableList.push(row);
          }, treeOpts);

          this.tableData = tableList;
        } else {
          _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
            row._X_EXPAND = expanded;
          }, treeOpts);

          this.tableData = this.fullTreeData.slice(0);
        }

        return this.tableData;
      },
      checkboxAllEvent: function checkboxAllEvent(params) {
        var _this$checkboxConfig = this.checkboxConfig,
            checkboxConfig = _this$checkboxConfig === void 0 ? {} : _this$checkboxConfig,
            treeOpts = this.treeOpts;
        var checkField = checkboxConfig.checkField,
            halfField = checkboxConfig.halfField,
            checkStrictly = checkboxConfig.checkStrictly;
        var checked = params.checked;

        if (checkField && !checkStrictly) {
          _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
            row[checkField] = checked;

            if (halfField) {
              row[halfField] = false;
            }
          }, treeOpts);
        }

        this.$emit('checkbox-all', params);
      },
      checkboxChangeEvent: function checkboxChangeEvent(params) {
        var _this$checkboxConfig2 = this.checkboxConfig,
            checkboxConfig = _this$checkboxConfig2 === void 0 ? {} : _this$checkboxConfig2,
            treeOpts = this.treeOpts;
        var checkField = checkboxConfig.checkField,
            halfField = checkboxConfig.halfField,
            checkStrictly = checkboxConfig.checkStrictly;
        var row = params.row,
            checked = params.checked;

        if (checkField && !checkStrictly) {
          _xeUtils["default"].eachTree([row], function (row) {
            row[checkField] = checked;

            if (halfField) {
              row[halfField] = false;
            }
          }, treeOpts);

          this.checkParentNodeSelection(row);
        }

        this.$emit('checkbox-change', params);
      },
      checkParentNodeSelection: function checkParentNodeSelection(row) {
        var _this$checkboxConfig3 = this.checkboxConfig,
            checkboxConfig = _this$checkboxConfig3 === void 0 ? {} : _this$checkboxConfig3,
            treeOpts = this.treeOpts;
        var children = treeOpts.children;
        var checkField = checkboxConfig.checkField,
            halfField = checkboxConfig.halfField,
            checkStrictly = checkboxConfig.checkStrictly;

        var matchObj = _xeUtils["default"].findTree(this.fullTreeData, function (item) {
          return item === row;
        }, treeOpts);

        if (matchObj && checkField && !checkStrictly) {
          var parentRow = matchObj.parent;

          if (parentRow) {
            var isAll = parentRow[children].every(function (item) {
              return item[checkField];
            });

            if (halfField && !isAll) {
              parentRow[halfField] = parentRow[children].some(function (item) {
                return item[checkField] || item[halfField];
              });
            }

            parentRow[checkField] = isAll;
            this.checkParentNodeSelection(parentRow);
          } else {
            this.$refs.xTable.checkSelectionStatus();
          }
        }
      },
      getCheckboxRecords: function getCheckboxRecords() {
        var _this$checkboxConfig4 = this.checkboxConfig,
            checkboxConfig = _this$checkboxConfig4 === void 0 ? {} : _this$checkboxConfig4,
            treeOpts = this.treeOpts;
        var checkField = checkboxConfig.checkField;

        if (checkField) {
          var records = [];

          _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
            if (row[checkField]) {
              records.push(row);
            }
          }, treeOpts);

          return records;
        }

        return this.$refs.xTable.getCheckboxRecords();
      },
      getCheckboxIndeterminateRecords: function getCheckboxIndeterminateRecords() {
        var _this$checkboxConfig5 = this.checkboxConfig,
            checkboxConfig = _this$checkboxConfig5 === void 0 ? {} : _this$checkboxConfig5,
            treeOpts = this.treeOpts;
        var halfField = checkboxConfig.halfField;

        if (halfField) {
          var records = [];

          _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
            if (row[halfField]) {
              records.push(row);
            }
          }, treeOpts);

          return records;
        }

        return this.$refs.xTable.getCheckboxIndeterminateRecords();
      }
    }
  };
  Vue.component(VirtualTree.name, VirtualTree);
}
/**
 * 基于 vxe-table 表格的增强插件，实现简单的虚拟树表格
 */


var VXETablePluginVirtualTree = {
  install: function install(xtable) {
    // 注册组件
    registerComponent(xtable);
  }
};
exports.VXETablePluginVirtualTree = VXETablePluginVirtualTree;

if (typeof window !== 'undefined' && window.VXETable) {
  window.VXETable.use(VXETablePluginVirtualTree);
}

var _default = VXETablePluginVirtualTree;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbImNvdW50VHJlZUV4cGFuZCIsIiR4VHJlZSIsInByZXZSb3ciLCJyb3dDaGlsZHJlbiIsInRyZWVPcHRzIiwiY2hpbGRyZW4iLCJjb3VudCIsImlzVHJlZUV4cGFuZEJ5Um93IiwiaW5kZXgiLCJsZW5ndGgiLCJnZXRPZmZzZXRTaXplIiwidlNpemUiLCJjYWxjVHJlZUxpbmUiLCIkdGFibGUiLCJtYXRjaE9iaiIsIml0ZW1zIiwiZXhwYW5kU2l6ZSIsInJvd0hlaWdodCIsInJlZ2lzdGVyQ29tcG9uZW50IiwiVnVlIiwiVGFibGUiLCJHcmlkIiwic2V0dXAiLCJ0IiwiR2xvYmFsQ29uZmlnIiwicHJvcEtleXMiLCJPYmplY3QiLCJrZXlzIiwicHJvcHMiLCJmaWx0ZXIiLCJuYW1lIiwiaW5kZXhPZiIsIlZpcnR1YWxUcmVlIiwiZGF0YSIsInJlbW92ZUxpc3QiLCJjcmVzdGVkIiwia2VlcFNvdXJjZSIsImxhenkiLCJjb25zb2xlIiwiZXJyb3IiLCJjb21wdXRlZCIsInNpemUiLCIkcGFyZW50IiwiYXNzaWduIiwiaGFzQ2hpbGQiLCJpbmRlbnQiLCJ0cmVlQ29uZmlnIiwicmVuZGVyQ2xhc3MiLCJhbmltYXQiLCJsaW5lIiwiaXNNYXhpbWl6ZWQiLCJ0YWJsZUV4dGVuZFByb3BzIiwicmVzdCIsImZvckVhY2giLCJrZXkiLCJ3YXRjaCIsImNvbHVtbnMiLCJsb2FkQ29sdW1uIiwiaGFuZGxlQ29sdW1ucyIsInZhbHVlIiwibG9hZERhdGEiLCJjcmVhdGVkIiwiZnVsbFRyZWVEYXRhIiwidGFibGVEYXRhIiwiZnVsbFRyZWVSb3dNYXAiLCJNYXAiLCJyZWxvYWREYXRhIiwibWV0aG9kcyIsImdldFRhYmxlT25zIiwiJGxpc3RlbmVycyIsInByb3h5Q29uZmlnIiwicHJveHlPcHRzIiwib25zIiwiWEVVdGlscyIsImVhY2giLCJjYiIsInR5cGUiLCJhcmdzIiwiJGVtaXQiLCJjaGVja2JveEFsbEV2ZW50IiwiY2hlY2tib3hDaGFuZ2VFdmVudCIsInNvcnQiLCJzb3J0Q2hhbmdlRXZlbnQiLCJmaWx0ZXJDaGFuZ2VFdmVudCIsInJlbmRlclRyZWVMaW5lIiwicGFyYW1zIiwiaCIsInJvdyIsImNvbHVtbiIsInRyZWVOb2RlIiwicm93TGV2ZWwiLCJfWF9MRVZFTCIsImdldCIsInN0eWxlIiwiaGVpZ2h0IiwibGVmdCIsInJlbmRlclRyZWVJY29uIiwiY2VsbFZOb2RlcyIsImlzSGlkZGVuIiwidHJpZ2dlciIsImljb25PcGVuIiwiaWNvbkNsb3NlIiwiaXNBY2VpdmVkIiwib24iLCJfWF9FWFBBTkQiLCJjbGljayIsInRvZ2dsZVRyZWVFeHBhbmQiLCJwYWRkaW5nTGVmdCIsImljb24iLCJUQUJMRV9UUkVFX09QRU4iLCJUQUJMRV9UUkVFX0NMT1NFIiwiX2xvYWRUcmVlRGF0YSIsInNlbGVjdFJvdyIsImdldFJhZGlvUmVjb3JkIiwiJG5leHRUaWNrIiwidGhlbiIsIiRyZWZzIiwieFRhYmxlIiwic2V0UmFkaW9Sb3ciLCJ0b1ZpcnR1YWxUcmVlIiwiaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQiLCJzZXRUcmVlRXhwYW5zaW9uIiwicm93cyIsImV4cGFuZGVkIiwic2V0VHJlZUV4cGFuZCIsImlzQXJyYXkiLCJ2aXJ0dWFsRXhwYW5kIiwic2V0QWxsVHJlZUV4cGFuc2lvbiIsInNldEFsbFRyZWVFeHBhbmQiLCJ2aXJ0dWFsQWxsRXhwYW5kIiwidG9nZ2xlVHJlZUV4cGFuc2lvbiIsImdldFRyZWVFeHBhbmRSZWNvcmRzIiwiaGFzQ2hpbGRzIiwidHJlZUV4cGFuZFJlY29yZHMiLCJlYWNoVHJlZSIsInB1c2giLCJjbGVhclRyZWVFeHBhbmQiLCJtYXAiLCJjb25mIiwic2xvdHMiLCJjaGlsZExpc3QiLCJnZXRSZWNvcmRzZXQiLCJpbnNlcnRSZWNvcmRzIiwiZ2V0SW5zZXJ0UmVjb3JkcyIsInJlbW92ZVJlY29yZHMiLCJnZXRSZW1vdmVSZWNvcmRzIiwidXBkYXRlUmVjb3JkcyIsImdldFVwZGF0ZVJlY29yZHMiLCJpc0luc2VydEJ5Um93IiwiX1hfSU5TRVJUIiwiaW5zZXJ0IiwicmVjb3JkcyIsImluc2VydEF0IiwibmV3UmVjb3JkcyIsInJlY29yZCIsImRlZmluZUZpZWxkIiwidW5zaGlmdCIsImFwcGx5IiwiZmluZFRyZWUiLCJpdGVtIiwiRXJyb3IiLCJub2RlcyIsInJvd0luZGV4Iiwic3BsaWNlIiwiY29uY2F0IiwicmVtb3ZlU2VsZWN0ZWRzIiwicmVtb3ZlQ2hlY2tib3hSb3ciLCJyZW1vdmUiLCJnZXRTZWxlY3RSZWNvcmRzIiwiY2xlYXJTZWxlY3Rpb24iLCJwYXJlbnQiLCJpc0V4cGFuZCIsImhhbmRsZUNvbGxhcHNpbmciLCJoYW5kbGVFeHBhbmRpbmciLCJ0YWJsZUZ1bGxEYXRhIiwiZXhwYW5kQWxsIiwiZXhwYW5kUm93S2V5cyIsInJvd2tleSIsInJvd0lkIiwicm93aWQiLCJ0cmVlRGF0YSIsImNsZWFyIiwicGF0aHMiLCJzZXQiLCJzbGljZSIsImNoaWxkUm93cyIsImV4cGFuZExpc3QiLCJvYmoiLCJub2RlQ2hpbGRMaXN0IiwidGFibGVMaXN0IiwiY2hlY2tib3hDb25maWciLCJjaGVja0ZpZWxkIiwiaGFsZkZpZWxkIiwiY2hlY2tTdHJpY3RseSIsImNoZWNrZWQiLCJjaGVja1BhcmVudE5vZGVTZWxlY3Rpb24iLCJwYXJlbnRSb3ciLCJpc0FsbCIsImV2ZXJ5Iiwic29tZSIsImNoZWNrU2VsZWN0aW9uU3RhdHVzIiwiZ2V0Q2hlY2tib3hSZWNvcmRzIiwiZ2V0Q2hlY2tib3hJbmRldGVybWluYXRlUmVjb3JkcyIsImNvbXBvbmVudCIsIlZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUiLCJpbnN0YWxsIiwieHRhYmxlIiwid2luZG93IiwiVlhFVGFibGUiLCJ1c2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7Ozs7O0FBRUE7QUFFQSxTQUFTQSxlQUFULENBQTBCQyxNQUExQixFQUF1Q0MsT0FBdkMsRUFBbUQ7QUFDakQsTUFBTUMsV0FBVyxHQUFHRCxPQUFPLENBQUNELE1BQU0sQ0FB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QkFDOUJDLE1BRDhCLEVBQ1A7QUFDOUI7QUFDQTVMLElBQUFBLGlCQUFpQixDQUFDNEwsTUFBRCxDQUFqQjtBQUNEO0FBSnNDLENBQWxDOzs7QUFPUCxJQUFJLE9BQU9DLE1BQVAsS0FBa0IsV0FBbEIsSUFBaUNBLE1BQU0sQ0FBQ0MsUUFBNUMsRUFBc0Q7QUFDcERELEVBQUFBLE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQkMsR0FBaEIsQ0FBb0JMLHlCQUFwQjtBQUNEOztlQUVjQSx5QiIsImZpbGUiOiJpbmRleC5jb21tb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xyXG5pbXBvcnQgeyBDcmVhdGVFbGVtZW50LCBWTm9kZUNoaWxkcmVuIH0gZnJvbSAndnVlJ1xyXG5pbXBvcnQgWEVVdGlscyBmcm9tICd4ZS11dGlscy9tZXRob2RzL3hlLXV0aWxzJ1xyXG5pbXBvcnQgeyBWWEVUYWJsZSB9IGZyb20gJ3Z4ZS10YWJsZS9saWIvdnhlLXRhYmxlJ1xyXG4vKiBlc2xpbnQtZW5hYmxlIG5vLXVudXNlZC12YXJzICovXHJcblxyXG5mdW5jdGlvbiBjb3VudFRyZWVFeHBhbmQgKCR4VHJlZTogYW55LCBwcmV2Um93OiBhbnkpOiBudW1iZXIge1xyXG4gIGNvbnN0IHJvd0NoaWxkcmVuID0gcHJldlJvd1skeFRyZWUudHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgbGV0IGNvdW50ID0gMVxyXG4gIGlmICgkeFRyZWUuaXNUcmVlRXhwYW5kQnlSb3cocHJldlJvdykpIHtcclxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByb3dDaGlsZHJlbi5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgICAgY291bnQgKz0gY291bnRUcmVlRXhwYW5kKCR4VHJlZSwgcm93Q2hpbGRyZW5baW5kZXhdKVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gY291bnRcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0T2Zmc2V0U2l6ZSAoJHhUcmVlOiBhbnkpOiBudW1iZXIge1xyXG4gIHN3aXRjaCAoJHhUcmVlLnZTaXplKSB7XHJcbiAgICBjYXNlICdtaW5pJzpcclxuICAgICAgcmV0dXJuIDNcclxuICAgIGNhc2UgJ3NtYWxsJzpcclxuICAgICAgcmV0dXJuIDJcclxuICAgIGNhc2UgJ21lZGl1bSc6XHJcbiAgICAgIHJldHVybiAxXHJcbiAgfVxyXG4gIHJldHVybiAwXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhbGNUcmVlTGluZSAoJHRhYmxlOiBhbnksICR4VHJlZTogYW55LCBtYXRjaE9iajogYW55KTogbnVtYmVyIHtcclxuICBjb25zdCB7IGluZGV4LCBpdGVtcyB9ID0gbWF0Y2hPYmpcclxuICBsZXQgZXhwYW5kU2l6ZSA9IDFcclxuICBpZiAoaW5kZXgpIHtcclxuICAgIGV4cGFuZFNpemUgPSBjb3VudFRyZWVFeHBhbmQoJHhUcmVlLCBpdGVtc1tpbmRleCAtIDFdKVxyXG4gIH1cclxuICByZXR1cm4gJHRhYmxlLnJvd0hlaWdodCAqIGV4cGFuZFNpemUgLSAoaW5kZXggPyAxIDogKDEyIC0gZ2V0T2Zmc2V0U2l6ZSgkeFRyZWUpKSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVnaXN0ZXJDb21wb25lbnQgKHsgVnVlLCBUYWJsZSwgR3JpZCwgc2V0dXAsIHQgfTogYW55KSB7XHJcbiAgY29uc3QgR2xvYmFsQ29uZmlnID0gc2V0dXAoKVxyXG4gIGNvbnN0IHByb3BLZXlzID0gT2JqZWN0LmtleXMoVGFibGUucHJvcHMpLmZpbHRlcihuYW1lID0+IFsnZGF0YScsICd0cmVlQ29uZmlnJ10uaW5kZXhPZihuYW1lKSA9PT0gLTEpXHJcblxyXG4gIGNvbnN0IFZpcnR1YWxUcmVlOiBhbnkgPSB7XHJcbiAgICBuYW1lOiAnVnhlVmlydHVhbFRyZWUnLFxyXG4gICAgZXh0ZW5kczogR3JpZCxcclxuICAgIGRhdGEgKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlbW92ZUxpc3Q6IFtdXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjcmVzdGVkICgpIHtcclxuICAgICAgaWYgKHRoaXMua2VlcFNvdXJjZSB8fCB0aGlzLnRyZWVPcHRzLmxhenkpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdbcGx1Z2luLXZpcnR1YWwtdHJlZV0gVW5zdXBwb3J0ZWQgcGFyYW1ldGVycy4nKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY29tcHV0ZWQ6IHtcclxuICAgICAgdlNpemUgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNpemUgfHwgdGhpcy4kcGFyZW50LnNpemUgfHwgdGhpcy4kcGFyZW50LnZTaXplXHJcbiAgICAgIH0sXHJcbiAgICAgIHRyZWVPcHRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgICAgICBjaGlsZHJlbjogJ2NoaWxkcmVuJyxcclxuICAgICAgICAgIGhhc0NoaWxkOiAnaGFzQ2hpbGQnLFxyXG4gICAgICAgICAgaW5kZW50OiAyMFxyXG4gICAgICAgIH0sIEdsb2JhbENvbmZpZy50cmVlQ29uZmlnLCB0aGlzLnRyZWVDb25maWcpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbmRlckNsYXNzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7IHZTaXplIH0gPSB0aGlzXHJcbiAgICAgICAgcmV0dXJuIFsndnhlLWdyaWQgdnhlLXZpcnR1YWwtdHJlZScsIHtcclxuICAgICAgICAgIFtgc2l6ZS0tJHt2U2l6ZX1gXTogdlNpemUsXHJcbiAgICAgICAgICAndC0tYW5pbWF0JzogdGhpcy5hbmltYXQsXHJcbiAgICAgICAgICAnaGFzLS10cmVlLWxpbmUnOiB0aGlzLnRyZWVDb25maWcgJiYgdGhpcy50cmVlT3B0cy5saW5lLFxyXG4gICAgICAgICAgJ2lzLS1tYXhpbWl6ZSc6IHRoaXMuaXNNYXhpbWl6ZWQoKVxyXG4gICAgICAgIH1dXHJcbiAgICAgIH0sXHJcbiAgICAgIHRhYmxlRXh0ZW5kUHJvcHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGxldCByZXN0OiBhbnkgPSB7fVxyXG4gICAgICAgIHByb3BLZXlzLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgIHJlc3Rba2V5XSA9IHRoaXNba2V5XVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIHJlc3RcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHdhdGNoOiB7XHJcbiAgICAgIGNvbHVtbnMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHRoaXMubG9hZENvbHVtbih0aGlzLmhhbmRsZUNvbHVtbnMoKSlcclxuICAgICAgfSxcclxuICAgICAgZGF0YSAodGhpczogYW55LCB2YWx1ZTogYW55W10pIHtcclxuICAgICAgICB0aGlzLmxvYWREYXRhKHZhbHVlKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY3JlYXRlZCAodGhpczogYW55KSB7XHJcbiAgICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpc1xyXG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHtcclxuICAgICAgICBmdWxsVHJlZURhdGE6IFtdLFxyXG4gICAgICAgIHRhYmxlRGF0YTogW10sXHJcbiAgICAgICAgZnVsbFRyZWVSb3dNYXA6IG5ldyBNYXAoKVxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLmhhbmRsZUNvbHVtbnMoKVxyXG4gICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIHRoaXMucmVsb2FkRGF0YShkYXRhKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbWV0aG9kczoge1xyXG4gICAgICBnZXRUYWJsZU9ucyAodGhpczogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyAkbGlzdGVuZXJzLCBwcm94eUNvbmZpZywgcHJveHlPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgY29uc3Qgb25zOiB7IFtrZXk6IHN0cmluZ106IEZ1bmN0aW9uIH0gPSB7fVxyXG4gICAgICAgIFhFVXRpbHMuZWFjaCgkbGlzdGVuZXJzLCAoY2IsIHR5cGUpID0+IHtcclxuICAgICAgICAgIG9uc1t0eXBlXSA9ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLiRlbWl0KHR5cGUsIC4uLmFyZ3MpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBvbnNbJ2NoZWNrYm94LWFsbCddID0gdGhpcy5jaGVja2JveEFsbEV2ZW50XHJcbiAgICAgICAgb25zWydjaGVja2JveC1jaGFuZ2UnXSA9IHRoaXMuY2hlY2tib3hDaGFuZ2VFdmVudFxyXG4gICAgICAgIGlmIChwcm94eUNvbmZpZykge1xyXG4gICAgICAgICAgaWYgKHByb3h5T3B0cy5zb3J0KSB7XHJcbiAgICAgICAgICAgIG9uc1snc29ydC1jaGFuZ2UnXSA9IHRoaXMuc29ydENoYW5nZUV2ZW50XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocHJveHlPcHRzLmZpbHRlcikge1xyXG4gICAgICAgICAgICBvbnNbJ2ZpbHRlci1jaGFuZ2UnXSA9IHRoaXMuZmlsdGVyQ2hhbmdlRXZlbnRcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9uc1xyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJUcmVlTGluZSAodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogQ3JlYXRlRWxlbWVudCkge1xyXG4gICAgICAgIGNvbnN0IHsgdHJlZUNvbmZpZywgdHJlZU9wdHMsIGZ1bGxUcmVlUm93TWFwIH0gPSB0aGlzXHJcbiAgICAgICAgY29uc3QgeyAkdGFibGUsIHJvdywgY29sdW1uIH0gPSBwYXJhbXNcclxuICAgICAgICBjb25zdCB7IHRyZWVOb2RlIH0gPSBjb2x1bW5cclxuICAgICAgICBpZiAodHJlZU5vZGUgJiYgdHJlZUNvbmZpZyAmJiB0cmVlT3B0cy5saW5lKSB7XHJcbiAgICAgICAgICBjb25zdCAkeFRyZWUgPSB0aGlzXHJcbiAgICAgICAgICBjb25zdCByb3dMZXZlbCA9IHJvdy5fWF9MRVZFTFxyXG4gICAgICAgICAgY29uc3QgbWF0Y2hPYmogPSBmdWxsVHJlZVJvd01hcC5nZXQocm93KVxyXG4gICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgdHJlZU5vZGUgJiYgdHJlZU9wdHMubGluZSA/IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1saW5lLXdyYXBwZXInXHJcbiAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1saW5lJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogYCR7Y2FsY1RyZWVMaW5lKCR0YWJsZSwgJHhUcmVlLCBtYXRjaE9iail9cHhgLFxyXG4gICAgICAgICAgICAgICAgICBsZWZ0OiBgJHtyb3dMZXZlbCAqICh0cmVlT3B0cy5pbmRlbnQgfHwgMjApICsgKHJvd0xldmVsID8gMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSA6IDApICsgMTZ9cHhgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgXSkgOiBudWxsXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbXVxyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJUcmVlSWNvbiAodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogQ3JlYXRlRWxlbWVudCwgY2VsbFZOb2RlczogVk5vZGVDaGlsZHJlbikge1xyXG4gICAgICAgIGxldCB7IGlzSGlkZGVuIH0gPSBwYXJhbXNcclxuICAgICAgICBsZXQgeyByb3cgfSA9IHBhcmFtc1xyXG4gICAgICAgIGxldCB7IGNoaWxkcmVuLCBpbmRlbnQsIHRyaWdnZXIsIGljb25PcGVuLCBpY29uQ2xvc2UgfSA9IHRoaXMudHJlZU9wdHNcclxuICAgICAgICBsZXQgcm93Q2hpbGRyZW4gPSByb3dbY2hpbGRyZW5dXHJcbiAgICAgICAgbGV0IGlzQWNlaXZlZCA9IGZhbHNlXHJcbiAgICAgICAgbGV0IG9uOiBhbnkgPSB7fVxyXG4gICAgICAgIGlmICghaXNIaWRkZW4pIHtcclxuICAgICAgICAgIGlzQWNlaXZlZCA9IHJvdy5fWF9FWFBBTkRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0cmlnZ2VyIHx8IHRyaWdnZXIgPT09ICdkZWZhdWx0Jykge1xyXG4gICAgICAgICAgb24uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZVRyZWVFeHBhbmQocm93KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICBjbGFzczogWyd2eGUtY2VsbC0tdHJlZS1ub2RlJywge1xyXG4gICAgICAgICAgICAgICdpcy0tYWN0aXZlJzogaXNBY2VpdmVkXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgIHBhZGRpbmdMZWZ0OiBgJHtyb3cuX1hfTEVWRUwgKiBpbmRlbnR9cHhgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgcm93Q2hpbGRyZW4gJiYgcm93Q2hpbGRyZW4ubGVuZ3RoID8gW1xyXG4gICAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtLWJ0bi13cmFwcGVyJyxcclxuICAgICAgICAgICAgICAgIG9uXHJcbiAgICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgaCgnaScsIHtcclxuICAgICAgICAgICAgICAgICAgY2xhc3M6IFsndnhlLXRyZWUtLW5vZGUtYnRuJywgaXNBY2VpdmVkID8gKGljb25PcGVuIHx8IEdsb2JhbENvbmZpZy5pY29uLlRBQkxFX1RSRUVfT1BFTikgOiAoaWNvbkNsb3NlIHx8IEdsb2JhbENvbmZpZy5pY29uLlRBQkxFX1RSRUVfQ0xPU0UpXVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICBdIDogbnVsbCxcclxuICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtY2VsbCdcclxuICAgICAgICAgICAgfSwgY2VsbFZOb2RlcylcclxuICAgICAgICAgIF0pXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICBfbG9hZFRyZWVEYXRhICh0aGlzOiBhbnksIGRhdGE6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHNlbGVjdFJvdyA9IHRoaXMuZ2V0UmFkaW9SZWNvcmQoKVxyXG4gICAgICAgIHJldHVybiB0aGlzLiRuZXh0VGljaygpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLiRyZWZzLnhUYWJsZS5sb2FkRGF0YShkYXRhKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdFJvdykge1xyXG4gICAgICAgICAgICAgIHRoaXMuc2V0UmFkaW9Sb3coc2VsZWN0Um93KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICBsb2FkRGF0YSAoZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRvVmlydHVhbFRyZWUoZGF0YSkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbG9hZERhdGEgKHRoaXM6IGFueSwgZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJG5leHRUaWNrKClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuJHJlZnMueFRhYmxlLnJlbG9hZERhdGEodGhpcy50b1ZpcnR1YWxUcmVlKGRhdGEpKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQoKSlcclxuICAgICAgfSxcclxuICAgICAgaXNUcmVlRXhwYW5kQnlSb3cgKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuICEhcm93Ll9YX0VYUEFORFxyXG4gICAgICB9LFxyXG4gICAgICBzZXRUcmVlRXhwYW5zaW9uIChyb3dzOiBhbnksIGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXRUcmVlRXhwYW5kKHJvd3MsIGV4cGFuZGVkKVxyXG4gICAgICB9LFxyXG4gICAgICBzZXRUcmVlRXhwYW5kICh0aGlzOiBhbnksIHJvd3M6IGFueSwgZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIGlmIChyb3dzKSB7XHJcbiAgICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyb3dzKSkge1xyXG4gICAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByb3dzLmZvckVhY2goKHJvdzogYW55KSA9PiB0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhIWV4cGFuZGVkKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRhYmxlRGF0YSlcclxuICAgICAgfSxcclxuICAgICAgc2V0QWxsVHJlZUV4cGFuc2lvbiAoZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNldEFsbFRyZWVFeHBhbmQoZXhwYW5kZWQpXHJcbiAgICAgIH0sXHJcbiAgICAgIHNldEFsbFRyZWVFeHBhbmQgKGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFRyZWVEYXRhKHRoaXMudmlydHVhbEFsbEV4cGFuZChleHBhbmRlZCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHRvZ2dsZVRyZWVFeHBhbnNpb24gKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudG9nZ2xlVHJlZUV4cGFuZChyb3cpXHJcbiAgICAgIH0sXHJcbiAgICAgIHRvZ2dsZVRyZWVFeHBhbmQgKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhcm93Ll9YX0VYUEFORCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldFRyZWVFeHBhbmRSZWNvcmRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBoYXNDaGlsZHMgPSB0aGlzLmhhc0NoaWxkc1xyXG4gICAgICAgIGNvbnN0IHRyZWVFeHBhbmRSZWNvcmRzOiBhbnlbXSA9IFtdXHJcbiAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0aGlzLmZ1bGxUcmVlRGF0YSwgcm93ID0+IHtcclxuICAgICAgICAgIGlmIChyb3cuX1hfRVhQQU5EICYmIGhhc0NoaWxkcyhyb3cpKSB7XHJcbiAgICAgICAgICAgIHRyZWVFeHBhbmRSZWNvcmRzLnB1c2gocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMudHJlZU9wdHMpXHJcbiAgICAgICAgcmV0dXJuIHRyZWVFeHBhbmRSZWNvcmRzXHJcbiAgICAgIH0sXHJcbiAgICAgIGNsZWFyVHJlZUV4cGFuZCAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWxsVHJlZUV4cGFuZChmYWxzZSlcclxuICAgICAgfSxcclxuICAgICAgaGFuZGxlQ29sdW1ucyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1ucy5tYXAoKGNvbmY6IGFueSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGNvbmYudHJlZU5vZGUpIHtcclxuICAgICAgICAgICAgbGV0IHNsb3RzID0gY29uZi5zbG90cyB8fCB7fVxyXG4gICAgICAgICAgICBzbG90cy5pY29uID0gdGhpcy5yZW5kZXJUcmVlSWNvblxyXG4gICAgICAgICAgICBzbG90cy5saW5lID0gdGhpcy5yZW5kZXJUcmVlTGluZVxyXG4gICAgICAgICAgICBjb25mLnNsb3RzID0gc2xvdHNcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBjb25mXHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgaGFzQ2hpbGRzICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgY2hpbGRMaXN0ID0gcm93W3RoaXMudHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgICAgICAgcmV0dXJuIGNoaWxkTGlzdCAmJiBjaGlsZExpc3QubGVuZ3RoXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDojrflj5booajmoLzmlbDmja7pm4bvvIzljIXlkKvmlrDlop7jgIHliKDpmaTjgIHkv67mlLlcclxuICAgICAgICovXHJcbiAgICAgIGdldFJlY29yZHNldCAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGluc2VydFJlY29yZHM6IHRoaXMuZ2V0SW5zZXJ0UmVjb3JkcygpLFxyXG4gICAgICAgICAgcmVtb3ZlUmVjb3JkczogdGhpcy5nZXRSZW1vdmVSZWNvcmRzKCksXHJcbiAgICAgICAgICB1cGRhdGVSZWNvcmRzOiB0aGlzLmdldFVwZGF0ZVJlY29yZHMoKVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgaXNJbnNlcnRCeVJvdyAocm93OiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gISFyb3cuX1hfSU5TRVJUXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldEluc2VydFJlY29yZHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGluc2VydFJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgaWYgKHJvdy5fWF9JTlNFUlQpIHtcclxuICAgICAgICAgICAgaW5zZXJ0UmVjb3Jkcy5wdXNoKHJvdylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzLnRyZWVPcHRzKVxyXG4gICAgICAgIHJldHVybiBpbnNlcnRSZWNvcmRzXHJcbiAgICAgIH0sXHJcbiAgICAgIGluc2VydCAodGhpczogYW55LCByZWNvcmRzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbnNlcnRBdChyZWNvcmRzKVxyXG4gICAgICB9LFxyXG4gICAgICBpbnNlcnRBdCAodGhpczogYW55LCByZWNvcmRzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBmdWxsVHJlZURhdGEsIHRhYmxlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyZWNvcmRzKSkge1xyXG4gICAgICAgICAgcmVjb3JkcyA9IFtyZWNvcmRzXVxyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbmV3UmVjb3JkcyA9IHJlY29yZHMubWFwKChyZWNvcmQ6IGFueSkgPT4gdGhpcy5kZWZpbmVGaWVsZChPYmplY3QuYXNzaWduKHtcclxuICAgICAgICAgIF9YX0VYUEFORDogZmFsc2UsXHJcbiAgICAgICAgICBfWF9JTlNFUlQ6IHRydWUsXHJcbiAgICAgICAgICBfWF9MRVZFTDogMFxyXG4gICAgICAgIH0sIHJlY29yZCkpKVxyXG4gICAgICAgIGlmICghcm93KSB7XHJcbiAgICAgICAgICBmdWxsVHJlZURhdGEudW5zaGlmdC5hcHBseShmdWxsVHJlZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgICB0YWJsZURhdGEudW5zaGlmdC5hcHBseSh0YWJsZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmIChyb3cgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGZ1bGxUcmVlRGF0YS5wdXNoLmFwcGx5KGZ1bGxUcmVlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICAgICAgdGFibGVEYXRhLnB1c2guYXBwbHkodGFibGVEYXRhLCBuZXdSZWNvcmRzKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IG1hdGNoT2JqID0gWEVVdGlscy5maW5kVHJlZShmdWxsVHJlZURhdGEsIGl0ZW0gPT4gaXRlbSA9PT0gcm93LCB0cmVlT3B0cylcclxuICAgICAgICAgICAgaWYgKCFtYXRjaE9iaiB8fCBtYXRjaE9iai5pbmRleCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodCgndnhlLmVycm9yLnVuYWJsZUluc2VydCcpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCB7IGl0ZW1zLCBpbmRleCwgbm9kZXMgfTogYW55ID0gbWF0Y2hPYmpcclxuICAgICAgICAgICAgbGV0IHJvd0luZGV4ID0gdGFibGVEYXRhLmluZGV4T2Yocm93KVxyXG4gICAgICAgICAgICBpZiAocm93SW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgIHRhYmxlRGF0YS5zcGxpY2UuYXBwbHkodGFibGVEYXRhLCBbcm93SW5kZXgsIDBdLmNvbmNhdChuZXdSZWNvcmRzKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpdGVtcy5zcGxpY2UuYXBwbHkoaXRlbXMsIFtpbmRleCwgMF0uY29uY2F0KG5ld1JlY29yZHMpKVxyXG4gICAgICAgICAgICBuZXdSZWNvcmRzLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgIGl0ZW0uX1hfTEVWRUwgPSBub2Rlcy5sZW5ndGggLSAxXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGFibGVEYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJvdzogbmV3UmVjb3Jkcy5sZW5ndGggPyBuZXdSZWNvcmRzW25ld1JlY29yZHMubGVuZ3RoIC0gMV0gOiBudWxsLFxyXG4gICAgICAgICAgICByb3dzOiBuZXdSZWNvcmRzXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOiOt+WPluW3suWIoOmZpOeahOaVsOaNrlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0UmVtb3ZlUmVjb3JkcyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdFxyXG4gICAgICB9LFxyXG4gICAgICByZW1vdmVTZWxlY3RlZHMgKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZUNoZWNrYm94Um93KClcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWIoOmZpOmAieS4reaVsOaNrlxyXG4gICAgICAgKi9cclxuICAgICAgcmVtb3ZlQ2hlY2tib3hSb3cgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZSh0aGlzLmdldFNlbGVjdFJlY29yZHMoKSkudGhlbigocGFyYW1zOiBhbnkpID0+IHtcclxuICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3Rpb24oKVxyXG4gICAgICAgICAgcmV0dXJuIHBhcmFtc1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbW92ZSAodGhpczogYW55LCByb3dzOiBhbnlbXSkge1xyXG4gICAgICAgIGNvbnN0IHsgcmVtb3ZlTGlzdCwgZnVsbFRyZWVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGxldCByZXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgaWYgKCFyb3dzKSB7XHJcbiAgICAgICAgICByb3dzID0gZnVsbFRyZWVEYXRhXHJcbiAgICAgICAgfSBlbHNlIGlmICghWEVVdGlscy5pc0FycmF5KHJvd3MpKSB7XHJcbiAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJvd3MuZm9yRWFjaCgocm93OiBhbnkpID0+IHtcclxuICAgICAgICAgIGxldCBtYXRjaE9iaiA9IFhFVXRpbHMuZmluZFRyZWUoZnVsbFRyZWVEYXRhLCBpdGVtID0+IGl0ZW0gPT09IHJvdywgdHJlZU9wdHMpXHJcbiAgICAgICAgICBpZiAobWF0Y2hPYmopIHtcclxuICAgICAgICAgICAgY29uc3QgeyBpdGVtLCBpdGVtcywgaW5kZXgsIHBhcmVudCB9OiBhbnkgPSBtYXRjaE9ialxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbnNlcnRCeVJvdyhyb3cpKSB7XHJcbiAgICAgICAgICAgICAgcmVtb3ZlTGlzdC5wdXNoKHJvdylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgbGV0IGlzRXhwYW5kID0gdGhpcy5pc1RyZWVFeHBhbmRCeVJvdyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocGFyZW50KVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpdGVtcy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUV4cGFuZGluZyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29sbGFwc2luZyhpdGVtKVxyXG4gICAgICAgICAgICAgIGl0ZW1zLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgICB0aGlzLnRhYmxlRGF0YS5zcGxpY2UodGhpcy50YWJsZURhdGEuaW5kZXhPZihpdGVtKSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGhpcy50YWJsZURhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHsgcm93OiByZXN0Lmxlbmd0aCA/IHJlc3RbcmVzdC5sZW5ndGggLSAxXSA6IG51bGwsIHJvd3M6IHJlc3QgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDlpITnkIbpu5jorqTlsZXlvIDmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIGhhbmRsZURlZmF1bHRUcmVlRXhwYW5kICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBsZXQgeyB0cmVlQ29uZmlnLCB0cmVlT3B0cywgdGFibGVGdWxsRGF0YSB9ID0gdGhpc1xyXG4gICAgICAgIGlmICh0cmVlQ29uZmlnKSB7XHJcbiAgICAgICAgICBsZXQgeyBjaGlsZHJlbiwgZXhwYW5kQWxsLCBleHBhbmRSb3dLZXlzIH0gPSB0cmVlT3B0c1xyXG4gICAgICAgICAgaWYgKGV4cGFuZEFsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEFsbFRyZWVFeHBhbmQodHJ1ZSlcclxuICAgICAgICAgIH0gZWxzZSBpZiAoZXhwYW5kUm93S2V5cykge1xyXG4gICAgICAgICAgICBsZXQgcm93a2V5ID0gdGhpcy5yb3dJZFxyXG4gICAgICAgICAgICBleHBhbmRSb3dLZXlzLmZvckVhY2goKHJvd2lkOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKHRhYmxlRnVsbERhdGEsIGl0ZW0gPT4gcm93aWQgPT09IFhFVXRpbHMuZ2V0KGl0ZW0sIHJvd2tleSksIHRyZWVPcHRzKVxyXG4gICAgICAgICAgICAgIGxldCByb3dDaGlsZHJlbiA9IG1hdGNoT2JqID8gbWF0Y2hPYmouaXRlbVtjaGlsZHJlbl0gOiAwXHJcbiAgICAgICAgICAgICAgaWYgKHJvd0NoaWxkcmVuICYmIHJvd0NoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRUcmVlRXhwYW5kKG1hdGNoT2JqLml0ZW0sIHRydWUpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWumuS5ieagkeWxnuaAp1xyXG4gICAgICAgKi9cclxuICAgICAgdG9WaXJ0dWFsVHJlZSAodGhpczogYW55LCB0cmVlRGF0YTogYW55W10pIHtcclxuICAgICAgICBsZXQgZnVsbFRyZWVSb3dNYXAgPSB0aGlzLmZ1bGxUcmVlUm93TWFwXHJcbiAgICAgICAgZnVsbFRyZWVSb3dNYXAuY2xlYXIoKVxyXG4gICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodHJlZURhdGEsIChpdGVtLCBpbmRleCwgaXRlbXMsIHBhdGhzLCBwYXJlbnQsIG5vZGVzKSA9PiB7XHJcbiAgICAgICAgICBpdGVtLl9YX0VYUEFORCA9IGZhbHNlXHJcbiAgICAgICAgICBpdGVtLl9YX0lOU0VSVCA9IGZhbHNlXHJcbiAgICAgICAgICBpdGVtLl9YX0xFVkVMID0gbm9kZXMubGVuZ3RoIC0gMVxyXG4gICAgICAgICAgZnVsbFRyZWVSb3dNYXAuc2V0KGl0ZW0sIHsgaXRlbSwgaW5kZXgsIGl0ZW1zLCBwYXRocywgcGFyZW50LCBub2RlcyB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5mdWxsVHJlZURhdGEgPSB0cmVlRGF0YS5zbGljZSgwKVxyXG4gICAgICAgIHRoaXMudGFibGVEYXRhID0gdHJlZURhdGEuc2xpY2UoMClcclxuICAgICAgICByZXR1cm4gdHJlZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxFeHBhbmQgKHRoaXM6IGFueSwgcm93OiBhbnksIGV4cGFuZGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHJvdy5fWF9FWFBBTkQgIT09IGV4cGFuZGVkKSB7XHJcbiAgICAgICAgICBpZiAocm93Ll9YX0VYUEFORCkge1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocm93KVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5oYW5kbGVFeHBhbmRpbmcocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLy8g5bGV5byA6IqC54K5XHJcbiAgICAgIGhhbmRsZUV4cGFuZGluZyAodGhpczogYW55LCByb3c6IGFueSkge1xyXG4gICAgICAgIGlmICh0aGlzLmhhc0NoaWxkcyhyb3cpKSB7XHJcbiAgICAgICAgICBjb25zdCB7IHRhYmxlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICAgIGxldCBjaGlsZFJvd3MgPSByb3dbdHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgICAgICAgICBsZXQgZXhwYW5kTGlzdDogYW55W10gPSBbXVxyXG4gICAgICAgICAgbGV0IHJvd0luZGV4ID0gdGFibGVEYXRhLmluZGV4T2Yocm93KVxyXG4gICAgICAgICAgaWYgKHJvd0luZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mUmeivr+eahOaTjeS9nO+8gScpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKGNoaWxkUm93cywgKGl0ZW0sIGluZGV4LCBvYmosIHBhdGhzLCBwYXJlbnQsIG5vZGVzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghcGFyZW50IHx8IHBhcmVudC5fWF9FWFBBTkQpIHtcclxuICAgICAgICAgICAgICBleHBhbmRMaXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gdHJ1ZVxyXG4gICAgICAgICAgdGFibGVEYXRhLnNwbGljZS5hcHBseSh0YWJsZURhdGEsIFtyb3dJbmRleCArIDEsIDBdLmNvbmNhdChleHBhbmRMaXN0KSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGFibGVEYXRhXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIOaUtui1t+iKgueCuVxyXG4gICAgICBoYW5kbGVDb2xsYXBzaW5nICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgIGNvbnN0IHsgdGFibGVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgICAgbGV0IGNoaWxkUm93cyA9IHJvd1t0cmVlT3B0cy5jaGlsZHJlbl1cclxuICAgICAgICAgIGxldCBub2RlQ2hpbGRMaXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKGNoaWxkUm93cywgaXRlbSA9PiB7XHJcbiAgICAgICAgICAgIG5vZGVDaGlsZExpc3QucHVzaChpdGVtKVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gZmFsc2VcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGFibGVEYXRhLmZpbHRlcigoaXRlbTogYW55KSA9PiBub2RlQ2hpbGRMaXN0LmluZGV4T2YoaXRlbSkgPT09IC0xKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmiYDmnInmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxBbGxFeHBhbmQgKHRoaXM6IGFueSwgZXhwYW5kZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCB7IHRyZWVPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgaWYgKGV4cGFuZGVkKSB7XHJcbiAgICAgICAgICBjb25zdCB0YWJsZUxpc3Q6IGFueVtdID0gW11cclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSBleHBhbmRlZFxyXG4gICAgICAgICAgICB0YWJsZUxpc3QucHVzaChyb3cpXHJcbiAgICAgICAgICB9LCB0cmVlT3B0cylcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGFibGVMaXN0XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSBleHBhbmRlZFxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICB0aGlzLnRhYmxlRGF0YSA9IHRoaXMuZnVsbFRyZWVEYXRhLnNsaWNlKDApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9LFxyXG4gICAgICBjaGVja2JveEFsbEV2ZW50ICh0aGlzOiBhbnksIHBhcmFtczogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBjaGVja2JveENvbmZpZyA9IHt9LCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tGaWVsZCwgaGFsZkZpZWxkLCBjaGVja1N0cmljdGx5IH0gPSBjaGVja2JveENvbmZpZ1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tlZCB9ID0gcGFyYW1zXHJcbiAgICAgICAgaWYgKGNoZWNrRmllbGQgJiYgIWNoZWNrU3RyaWN0bHkpIHtcclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvd1tjaGVja0ZpZWxkXSA9IGNoZWNrZWRcclxuICAgICAgICAgICAgaWYgKGhhbGZGaWVsZCkge1xyXG4gICAgICAgICAgICAgIHJvd1toYWxmRmllbGRdID0gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuJGVtaXQoJ2NoZWNrYm94LWFsbCcsIHBhcmFtcylcclxuICAgICAgfSxcclxuICAgICAgY2hlY2tib3hDaGFuZ2VFdmVudCAodGhpczogYW55LCBwYXJhbXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tib3hDb25maWcgPSB7fSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBjb25zdCB7IGNoZWNrRmllbGQsIGhhbGZGaWVsZCwgY2hlY2tTdHJpY3RseSB9ID0gY2hlY2tib3hDb25maWdcclxuICAgICAgICBjb25zdCB7IHJvdywgY2hlY2tlZCB9ID0gcGFyYW1zXHJcbiAgICAgICAgaWYgKGNoZWNrRmllbGQgJiYgIWNoZWNrU3RyaWN0bHkpIHtcclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUoW3Jvd10sIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvd1tjaGVja0ZpZWxkXSA9IGNoZWNrZWRcclxuICAgICAgICAgICAgaWYgKGhhbGZGaWVsZCkge1xyXG4gICAgICAgICAgICAgIHJvd1toYWxmRmllbGRdID0gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICB0aGlzLmNoZWNrUGFyZW50Tm9kZVNlbGVjdGlvbihyb3cpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuJGVtaXQoJ2NoZWNrYm94LWNoYW5nZScsIHBhcmFtcylcclxuICAgICAgfSxcclxuICAgICAgY2hlY2tQYXJlbnROb2RlU2VsZWN0aW9uICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBjaGVja2JveENvbmZpZyA9IHt9LCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGNvbnN0IHsgY2hpbGRyZW4gfSA9IHRyZWVPcHRzXHJcbiAgICAgICAgY29uc3QgeyBjaGVja0ZpZWxkLCBoYWxmRmllbGQsIGNoZWNrU3RyaWN0bHkgfSA9IGNoZWNrYm94Q29uZmlnXHJcbiAgICAgICAgY29uc3QgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCBpdGVtID0+IGl0ZW0gPT09IHJvdywgdHJlZU9wdHMpXHJcbiAgICAgICAgaWYgKG1hdGNoT2JqICYmIGNoZWNrRmllbGQgJiYgIWNoZWNrU3RyaWN0bHkpIHtcclxuICAgICAgICAgIGNvbnN0IHBhcmVudFJvdyA9IG1hdGNoT2JqLnBhcmVudFxyXG4gICAgICAgICAgaWYgKHBhcmVudFJvdykge1xyXG4gICAgICAgICAgICBjb25zdCBpc0FsbCA9IHBhcmVudFJvd1tjaGlsZHJlbl0uZXZlcnkoKGl0ZW06IGFueSkgPT4gaXRlbVtjaGVja0ZpZWxkXSlcclxuICAgICAgICAgICAgaWYgKGhhbGZGaWVsZCAmJiAhaXNBbGwpIHtcclxuICAgICAgICAgICAgICBwYXJlbnRSb3dbaGFsZkZpZWxkXSA9IHBhcmVudFJvd1tjaGlsZHJlbl0uc29tZSgoaXRlbTogYW55KSA9PiBpdGVtW2NoZWNrRmllbGRdIHx8IGl0ZW1baGFsZkZpZWxkXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwYXJlbnRSb3dbY2hlY2tGaWVsZF0gPSBpc0FsbFxyXG4gICAgICAgICAgICB0aGlzLmNoZWNrUGFyZW50Tm9kZVNlbGVjdGlvbihwYXJlbnRSb3cpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLiRyZWZzLnhUYWJsZS5jaGVja1NlbGVjdGlvblN0YXR1cygpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBnZXRDaGVja2JveFJlY29yZHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tib3hDb25maWcgPSB7fSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBjb25zdCB7IGNoZWNrRmllbGQgfSA9IGNoZWNrYm94Q29uZmlnXHJcbiAgICAgICAgaWYgKGNoZWNrRmllbGQpIHtcclxuICAgICAgICAgIGNvbnN0IHJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyb3dbY2hlY2tGaWVsZF0pIHtcclxuICAgICAgICAgICAgICByZWNvcmRzLnB1c2gocm93KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCB0cmVlT3B0cylcclxuICAgICAgICAgIHJldHVybiByZWNvcmRzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLiRyZWZzLnhUYWJsZS5nZXRDaGVja2JveFJlY29yZHMoKVxyXG4gICAgICB9LFxyXG4gICAgICBnZXRDaGVja2JveEluZGV0ZXJtaW5hdGVSZWNvcmRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7IGNoZWNrYm94Q29uZmlnID0ge30sIHRyZWVPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgY29uc3QgeyBoYWxmRmllbGQgfSA9IGNoZWNrYm94Q29uZmlnXHJcbiAgICAgICAgaWYgKGhhbGZGaWVsZCkge1xyXG4gICAgICAgICAgY29uc3QgcmVjb3JkczogYW55W10gPSBbXVxyXG4gICAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0aGlzLmZ1bGxUcmVlRGF0YSwgcm93ID0+IHtcclxuICAgICAgICAgICAgaWYgKHJvd1toYWxmRmllbGRdKSB7XHJcbiAgICAgICAgICAgICAgcmVjb3Jkcy5wdXNoKHJvdylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByZXR1cm4gcmVjb3Jkc1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy4kcmVmcy54VGFibGUuZ2V0Q2hlY2tib3hJbmRldGVybWluYXRlUmVjb3JkcygpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIFZ1ZS5jb21wb25lbnQoVmlydHVhbFRyZWUubmFtZSwgVmlydHVhbFRyZWUpXHJcbn1cclxuXHJcbi8qKlxyXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOWunueOsOeugOWNleeahOiZmuaLn+agkeihqOagvFxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUgPSB7XHJcbiAgaW5zdGFsbCAoeHRhYmxlOiB0eXBlb2YgVlhFVGFibGUpIHtcclxuICAgIC8vIOazqOWGjOe7hOS7tlxyXG4gICAgcmVnaXN0ZXJDb21wb25lbnQoeHRhYmxlKVxyXG4gIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSkge1xyXG4gIHdpbmRvdy5WWEVUYWJsZS51c2UoVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZSlcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZVxyXG4iXX0=
