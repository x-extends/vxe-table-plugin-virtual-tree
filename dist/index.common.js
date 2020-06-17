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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbImNvdW50VHJlZUV4cGFuZCIsIiR4VHJlZSIsInByZXZSb3ciLCJyb3dDaGlsZHJlbiIsInRyZWVPcHRzIiwiY2hpbGRyZW4iLCJjb3VudCIsImlzVHJlZUV4cGFuZEJ5Um93IiwiaW5kZXgiLCJsZW5ndGgiLCJnZXRPZmZzZXRTaXplIiwidlNpemUiLCJjYWxjVHJlZUxpbmUiLCIkdGFibGUiLCJtYXRjaE9iaiIsIml0ZW1zIiwiZXhwYW5kU2l6ZSIsInJvd0hlaWdodCIsInJlZ2lzdGVyQ29tcG9uZW50IiwiVnVlIiwiVGFibGUiLCJHcmlkIiwic2V0dXAiLCJ0IiwiR2xvYmFsQ29uZmlnIiwicHJvcEtleXMiLCJPYmplY3QiLCJrZXlzIiwicHJvcHMiLCJmaWx0ZXIiLCJuYW1lIiwiaW5kZXhPZiIsIlZpcnR1YWxUcmVlIiwiZGF0YSIsInJlbW92ZUxpc3QiLCJjb21wdXRlZCIsInNpemUiLCIkcGFyZW50IiwiYXNzaWduIiwiaGFzQ2hpbGQiLCJpbmRlbnQiLCJ0cmVlQ29uZmlnIiwicmVuZGVyQ2xhc3MiLCJhbmltYXQiLCJsaW5lIiwiaXNNYXhpbWl6ZWQiLCJ0YWJsZUV4dGVuZFByb3BzIiwicmVzdCIsImZvckVhY2giLCJrZXkiLCJ3YXRjaCIsImNvbHVtbnMiLCJsb2FkQ29sdW1uIiwiaGFuZGxlQ29sdW1ucyIsInZhbHVlIiwibG9hZERhdGEiLCJjcmVhdGVkIiwiZnVsbFRyZWVEYXRhIiwidGFibGVEYXRhIiwiZnVsbFRyZWVSb3dNYXAiLCJNYXAiLCJyZWxvYWREYXRhIiwibWV0aG9kcyIsImdldFRhYmxlT25zIiwiJGxpc3RlbmVycyIsInByb3h5Q29uZmlnIiwicHJveHlPcHRzIiwib25zIiwiWEVVdGlscyIsImVhY2giLCJjYiIsInR5cGUiLCJhcmdzIiwiJGVtaXQiLCJjaGVja2JveEFsbEV2ZW50IiwiY2hlY2tib3hDaGFuZ2VFdmVudCIsInNvcnQiLCJzb3J0Q2hhbmdlRXZlbnQiLCJmaWx0ZXJDaGFuZ2VFdmVudCIsInJlbmRlclRyZWVMaW5lIiwicGFyYW1zIiwiaCIsInJvdyIsImNvbHVtbiIsInRyZWVOb2RlIiwicm93TGV2ZWwiLCJfWF9MRVZFTCIsImdldCIsInN0eWxlIiwiaGVpZ2h0IiwibGVmdCIsInJlbmRlclRyZWVJY29uIiwiY2VsbFZOb2RlcyIsImlzSGlkZGVuIiwidHJpZ2dlciIsImljb25PcGVuIiwiaWNvbkNsb3NlIiwiaXNBY2VpdmVkIiwib24iLCJfWF9FWFBBTkQiLCJjbGljayIsInRvZ2dsZVRyZWVFeHBhbmQiLCJwYWRkaW5nTGVmdCIsImljb24iLCJUQUJMRV9UUkVFX09QRU4iLCJUQUJMRV9UUkVFX0NMT1NFIiwiX2xvYWRUcmVlRGF0YSIsInNlbGVjdFJvdyIsImdldFJhZGlvUmVjb3JkIiwiJG5leHRUaWNrIiwidGhlbiIsIiRyZWZzIiwieFRhYmxlIiwic2V0UmFkaW9Sb3ciLCJ0b1ZpcnR1YWxUcmVlIiwiaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQiLCJzZXRUcmVlRXhwYW5zaW9uIiwicm93cyIsImV4cGFuZGVkIiwic2V0VHJlZUV4cGFuZCIsImlzQXJyYXkiLCJ2aXJ0dWFsRXhwYW5kIiwic2V0QWxsVHJlZUV4cGFuc2lvbiIsInNldEFsbFRyZWVFeHBhbmQiLCJ2aXJ0dWFsQWxsRXhwYW5kIiwidG9nZ2xlVHJlZUV4cGFuc2lvbiIsImdldFRyZWVFeHBhbmRSZWNvcmRzIiwiaGFzQ2hpbGRzIiwidHJlZUV4cGFuZFJlY29yZHMiLCJlYWNoVHJlZSIsInB1c2giLCJjbGVhclRyZWVFeHBhbmQiLCJtYXAiLCJjb25mIiwic2xvdHMiLCJjaGlsZExpc3QiLCJnZXRSZWNvcmRzZXQiLCJpbnNlcnRSZWNvcmRzIiwiZ2V0SW5zZXJ0UmVjb3JkcyIsInJlbW92ZVJlY29yZHMiLCJnZXRSZW1vdmVSZWNvcmRzIiwidXBkYXRlUmVjb3JkcyIsImdldFVwZGF0ZVJlY29yZHMiLCJpc0luc2VydEJ5Um93IiwiX1hfSU5TRVJUIiwiaW5zZXJ0IiwicmVjb3JkcyIsImluc2VydEF0IiwibmV3UmVjb3JkcyIsInJlY29yZCIsImRlZmluZUZpZWxkIiwidW5zaGlmdCIsImFwcGx5IiwiZmluZFRyZWUiLCJpdGVtIiwiRXJyb3IiLCJub2RlcyIsInJvd0luZGV4Iiwic3BsaWNlIiwiY29uY2F0IiwicmVtb3ZlU2VsZWN0ZWRzIiwicmVtb3ZlQ2hlY2tib3hSb3ciLCJyZW1vdmUiLCJnZXRTZWxlY3RSZWNvcmRzIiwiY2xlYXJTZWxlY3Rpb24iLCJwYXJlbnQiLCJpc0V4cGFuZCIsImhhbmRsZUNvbGxhcHNpbmciLCJoYW5kbGVFeHBhbmRpbmciLCJ0YWJsZUZ1bGxEYXRhIiwiZXhwYW5kQWxsIiwiZXhwYW5kUm93S2V5cyIsInJvd2tleSIsInJvd0lkIiwicm93aWQiLCJ0cmVlRGF0YSIsImNsZWFyIiwicGF0aHMiLCJzZXQiLCJzbGljZSIsImNoaWxkUm93cyIsImV4cGFuZExpc3QiLCJvYmoiLCJub2RlQ2hpbGRMaXN0IiwidGFibGVMaXN0IiwiY2hlY2tib3hDb25maWciLCJjaGVja0ZpZWxkIiwiaGFsZkZpZWxkIiwiY2hlY2tTdHJpY3RseSIsImNoZWNrZWQiLCJjaGVja1BhcmVudE5vZGVTZWxlY3Rpb24iLCJwYXJlbnRSb3ciLCJpc0FsbCIsImV2ZXJ5Iiwic29tZSIsImNoZWNrU2VsZWN0aW9uU3RhdHVzIiwiZ2V0Q2hlY2tib3hSZWNvcmRzIiwiZ2V0Q2hlY2tib3hJbmRldGVybWluYXRlUmVjb3JkcyIsImNvbXBvbmVudCIsIlZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUiLCJpbnN0YWxsIiwieHRhYmxlIiwid2luZG93IiwiVlhFVGFibGUiLCJ1c2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7Ozs7O0FBRUE7QUFFQSxTQUFTQSxlQUFULENBQTBCQyxNQUExQixFQUF1Q0MsT0FBdkMsRUFBbUQ7QUFDakQsTUFBTUMsV0FBVyxHQUFHRCxPQUFPLENBQUNELE1BQU0sQ0FBQ0csUUFBUCxDQUFnQkMsUUFBakIsQ0FBM0I7QUFDQSxNQUFJQyxLQUFLLEdBQUcs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TCx5QkFBcEI7QUFDRDs7ZUFFY0EseUIiLCJmaWxlIjoiaW5kZXguY29tbW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cclxuaW1wb3J0IHsgQ3JlYXRlRWxlbWVudCwgVk5vZGVDaGlsZHJlbiB9IGZyb20gJ3Z1ZSdcclxuaW1wb3J0IFhFVXRpbHMgZnJvbSAneGUtdXRpbHMvbWV0aG9kcy94ZS11dGlscydcclxuaW1wb3J0IHsgVlhFVGFibGUgfSBmcm9tICd2eGUtdGFibGUvbGliL3Z4ZS10YWJsZSdcclxuLyogZXNsaW50LWVuYWJsZSBuby11bnVzZWQtdmFycyAqL1xyXG5cclxuZnVuY3Rpb24gY291bnRUcmVlRXhwYW5kICgkeFRyZWU6IGFueSwgcHJldlJvdzogYW55KTogbnVtYmVyIHtcclxuICBjb25zdCByb3dDaGlsZHJlbiA9IHByZXZSb3dbJHhUcmVlLnRyZWVPcHRzLmNoaWxkcmVuXVxyXG4gIGxldCBjb3VudCA9IDFcclxuICBpZiAoJHhUcmVlLmlzVHJlZUV4cGFuZEJ5Um93KHByZXZSb3cpKSB7XHJcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcm93Q2hpbGRyZW4ubGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgIGNvdW50ICs9IGNvdW50VHJlZUV4cGFuZCgkeFRyZWUsIHJvd0NoaWxkcmVuW2luZGV4XSlcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGNvdW50XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE9mZnNldFNpemUgKCR4VHJlZTogYW55KTogbnVtYmVyIHtcclxuICBzd2l0Y2ggKCR4VHJlZS52U2l6ZSkge1xyXG4gICAgY2FzZSAnbWluaSc6XHJcbiAgICAgIHJldHVybiAzXHJcbiAgICBjYXNlICdzbWFsbCc6XHJcbiAgICAgIHJldHVybiAyXHJcbiAgICBjYXNlICdtZWRpdW0nOlxyXG4gICAgICByZXR1cm4gMVxyXG4gIH1cclxuICByZXR1cm4gMFxyXG59XHJcblxyXG5mdW5jdGlvbiBjYWxjVHJlZUxpbmUgKCR0YWJsZTogYW55LCAkeFRyZWU6IGFueSwgbWF0Y2hPYmo6IGFueSk6IG51bWJlciB7XHJcbiAgY29uc3QgeyBpbmRleCwgaXRlbXMgfSA9IG1hdGNoT2JqXHJcbiAgbGV0IGV4cGFuZFNpemUgPSAxXHJcbiAgaWYgKGluZGV4KSB7XHJcbiAgICBleHBhbmRTaXplID0gY291bnRUcmVlRXhwYW5kKCR4VHJlZSwgaXRlbXNbaW5kZXggLSAxXSlcclxuICB9XHJcbiAgcmV0dXJuICR0YWJsZS5yb3dIZWlnaHQgKiBleHBhbmRTaXplIC0gKGluZGV4ID8gMSA6ICgxMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSkpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50ICh7IFZ1ZSwgVGFibGUsIEdyaWQsIHNldHVwLCB0IH06IGFueSkge1xyXG4gIGNvbnN0IEdsb2JhbENvbmZpZyA9IHNldHVwKClcclxuICBjb25zdCBwcm9wS2V5cyA9IE9iamVjdC5rZXlzKFRhYmxlLnByb3BzKS5maWx0ZXIobmFtZSA9PiBbJ2RhdGEnLCAndHJlZUNvbmZpZyddLmluZGV4T2YobmFtZSkgPT09IC0xKVxyXG5cclxuICBjb25zdCBWaXJ0dWFsVHJlZTogYW55ID0ge1xyXG4gICAgbmFtZTogJ1Z4ZVZpcnR1YWxUcmVlJyxcclxuICAgIGV4dGVuZHM6IEdyaWQsXHJcbiAgICBkYXRhICgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZW1vdmVMaXN0OiBbXVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY29tcHV0ZWQ6IHtcclxuICAgICAgdlNpemUgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNpemUgfHwgdGhpcy4kcGFyZW50LnNpemUgfHwgdGhpcy4kcGFyZW50LnZTaXplXHJcbiAgICAgIH0sXHJcbiAgICAgIHRyZWVPcHRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgICAgICBjaGlsZHJlbjogJ2NoaWxkcmVuJyxcclxuICAgICAgICAgIGhhc0NoaWxkOiAnaGFzQ2hpbGQnLFxyXG4gICAgICAgICAgaW5kZW50OiAyMFxyXG4gICAgICAgIH0sIEdsb2JhbENvbmZpZy50cmVlQ29uZmlnLCB0aGlzLnRyZWVDb25maWcpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbmRlckNsYXNzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7IHZTaXplIH0gPSB0aGlzXHJcbiAgICAgICAgcmV0dXJuIFsndnhlLWdyaWQgdnhlLXZpcnR1YWwtdHJlZScsIHtcclxuICAgICAgICAgIFtgc2l6ZS0tJHt2U2l6ZX1gXTogdlNpemUsXHJcbiAgICAgICAgICAndC0tYW5pbWF0JzogdGhpcy5hbmltYXQsXHJcbiAgICAgICAgICAnaGFzLS10cmVlLWxpbmUnOiB0aGlzLnRyZWVDb25maWcgJiYgdGhpcy50cmVlT3B0cy5saW5lLFxyXG4gICAgICAgICAgJ2lzLS1tYXhpbWl6ZSc6IHRoaXMuaXNNYXhpbWl6ZWQoKVxyXG4gICAgICAgIH1dXHJcbiAgICAgIH0sXHJcbiAgICAgIHRhYmxlRXh0ZW5kUHJvcHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGxldCByZXN0OiBhbnkgPSB7fVxyXG4gICAgICAgIHByb3BLZXlzLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgIHJlc3Rba2V5XSA9IHRoaXNba2V5XVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIHJlc3RcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHdhdGNoOiB7XHJcbiAgICAgIGNvbHVtbnMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHRoaXMubG9hZENvbHVtbih0aGlzLmhhbmRsZUNvbHVtbnMoKSlcclxuICAgICAgfSxcclxuICAgICAgZGF0YSAodGhpczogYW55LCB2YWx1ZTogYW55W10pIHtcclxuICAgICAgICB0aGlzLmxvYWREYXRhKHZhbHVlKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY3JlYXRlZCAodGhpczogYW55KSB7XHJcbiAgICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpc1xyXG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHtcclxuICAgICAgICBmdWxsVHJlZURhdGE6IFtdLFxyXG4gICAgICAgIHRhYmxlRGF0YTogW10sXHJcbiAgICAgICAgZnVsbFRyZWVSb3dNYXA6IG5ldyBNYXAoKVxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLmhhbmRsZUNvbHVtbnMoKVxyXG4gICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIHRoaXMucmVsb2FkRGF0YShkYXRhKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbWV0aG9kczoge1xyXG4gICAgICBnZXRUYWJsZU9ucyAodGhpczogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyAkbGlzdGVuZXJzLCBwcm94eUNvbmZpZywgcHJveHlPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgY29uc3Qgb25zOiB7IFtrZXk6IHN0cmluZ106IEZ1bmN0aW9uIH0gPSB7fVxyXG4gICAgICAgIFhFVXRpbHMuZWFjaCgkbGlzdGVuZXJzLCAoY2IsIHR5cGUpID0+IHtcclxuICAgICAgICAgIG9uc1t0eXBlXSA9ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLiRlbWl0KHR5cGUsIC4uLmFyZ3MpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBvbnNbJ2NoZWNrYm94LWFsbCddID0gdGhpcy5jaGVja2JveEFsbEV2ZW50XHJcbiAgICAgICAgb25zWydjaGVja2JveC1jaGFuZ2UnXSA9IHRoaXMuY2hlY2tib3hDaGFuZ2VFdmVudFxyXG4gICAgICAgIGlmIChwcm94eUNvbmZpZykge1xyXG4gICAgICAgICAgaWYgKHByb3h5T3B0cy5zb3J0KSB7XHJcbiAgICAgICAgICAgIG9uc1snc29ydC1jaGFuZ2UnXSA9IHRoaXMuc29ydENoYW5nZUV2ZW50XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocHJveHlPcHRzLmZpbHRlcikge1xyXG4gICAgICAgICAgICBvbnNbJ2ZpbHRlci1jaGFuZ2UnXSA9IHRoaXMuZmlsdGVyQ2hhbmdlRXZlbnRcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9uc1xyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJUcmVlTGluZSAodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogQ3JlYXRlRWxlbWVudCkge1xyXG4gICAgICAgIGNvbnN0IHsgdHJlZUNvbmZpZywgdHJlZU9wdHMsIGZ1bGxUcmVlUm93TWFwIH0gPSB0aGlzXHJcbiAgICAgICAgY29uc3QgeyAkdGFibGUsIHJvdywgY29sdW1uIH0gPSBwYXJhbXNcclxuICAgICAgICBjb25zdCB7IHRyZWVOb2RlIH0gPSBjb2x1bW5cclxuICAgICAgICBpZiAodHJlZU5vZGUgJiYgdHJlZUNvbmZpZyAmJiB0cmVlT3B0cy5saW5lKSB7XHJcbiAgICAgICAgICBjb25zdCAkeFRyZWUgPSB0aGlzXHJcbiAgICAgICAgICBjb25zdCByb3dMZXZlbCA9IHJvdy5fWF9MRVZFTFxyXG4gICAgICAgICAgY29uc3QgbWF0Y2hPYmogPSBmdWxsVHJlZVJvd01hcC5nZXQocm93KVxyXG4gICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgdHJlZU5vZGUgJiYgdHJlZU9wdHMubGluZSA/IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1saW5lLXdyYXBwZXInXHJcbiAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1saW5lJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogYCR7Y2FsY1RyZWVMaW5lKCR0YWJsZSwgJHhUcmVlLCBtYXRjaE9iail9cHhgLFxyXG4gICAgICAgICAgICAgICAgICBsZWZ0OiBgJHtyb3dMZXZlbCAqICh0cmVlT3B0cy5pbmRlbnQgfHwgMjApICsgKHJvd0xldmVsID8gMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSA6IDApICsgMTZ9cHhgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgXSkgOiBudWxsXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbXVxyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJUcmVlSWNvbiAodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogQ3JlYXRlRWxlbWVudCwgY2VsbFZOb2RlczogVk5vZGVDaGlsZHJlbikge1xyXG4gICAgICAgIGxldCB7IGlzSGlkZGVuIH0gPSBwYXJhbXNcclxuICAgICAgICBsZXQgeyByb3cgfSA9IHBhcmFtc1xyXG4gICAgICAgIGxldCB7IGNoaWxkcmVuLCBpbmRlbnQsIHRyaWdnZXIsIGljb25PcGVuLCBpY29uQ2xvc2UgfSA9IHRoaXMudHJlZU9wdHNcclxuICAgICAgICBsZXQgcm93Q2hpbGRyZW4gPSByb3dbY2hpbGRyZW5dXHJcbiAgICAgICAgbGV0IGlzQWNlaXZlZCA9IGZhbHNlXHJcbiAgICAgICAgbGV0IG9uOiBhbnkgPSB7fVxyXG4gICAgICAgIGlmICghaXNIaWRkZW4pIHtcclxuICAgICAgICAgIGlzQWNlaXZlZCA9IHJvdy5fWF9FWFBBTkRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0cmlnZ2VyIHx8IHRyaWdnZXIgPT09ICdkZWZhdWx0Jykge1xyXG4gICAgICAgICAgb24uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZVRyZWVFeHBhbmQocm93KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICBjbGFzczogWyd2eGUtY2VsbC0tdHJlZS1ub2RlJywge1xyXG4gICAgICAgICAgICAgICdpcy0tYWN0aXZlJzogaXNBY2VpdmVkXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgIHBhZGRpbmdMZWZ0OiBgJHtyb3cuX1hfTEVWRUwgKiBpbmRlbnR9cHhgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgcm93Q2hpbGRyZW4gJiYgcm93Q2hpbGRyZW4ubGVuZ3RoID8gW1xyXG4gICAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtLWJ0bi13cmFwcGVyJyxcclxuICAgICAgICAgICAgICAgIG9uXHJcbiAgICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgaCgnaScsIHtcclxuICAgICAgICAgICAgICAgICAgY2xhc3M6IFsndnhlLXRyZWUtLW5vZGUtYnRuJywgaXNBY2VpdmVkID8gKGljb25PcGVuIHx8IEdsb2JhbENvbmZpZy5pY29uLlRBQkxFX1RSRUVfT1BFTikgOiAoaWNvbkNsb3NlIHx8IEdsb2JhbENvbmZpZy5pY29uLlRBQkxFX1RSRUVfQ0xPU0UpXVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICBdIDogbnVsbCxcclxuICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtY2VsbCdcclxuICAgICAgICAgICAgfSwgY2VsbFZOb2RlcylcclxuICAgICAgICAgIF0pXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICBfbG9hZFRyZWVEYXRhICh0aGlzOiBhbnksIGRhdGE6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHNlbGVjdFJvdyA9IHRoaXMuZ2V0UmFkaW9SZWNvcmQoKVxyXG4gICAgICAgIHJldHVybiB0aGlzLiRuZXh0VGljaygpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLiRyZWZzLnhUYWJsZS5sb2FkRGF0YShkYXRhKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdFJvdykge1xyXG4gICAgICAgICAgICAgIHRoaXMuc2V0UmFkaW9Sb3coc2VsZWN0Um93KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICBsb2FkRGF0YSAoZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRvVmlydHVhbFRyZWUoZGF0YSkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbG9hZERhdGEgKHRoaXM6IGFueSwgZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJG5leHRUaWNrKClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuJHJlZnMueFRhYmxlLnJlbG9hZERhdGEodGhpcy50b1ZpcnR1YWxUcmVlKGRhdGEpKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQoKSlcclxuICAgICAgfSxcclxuICAgICAgaXNUcmVlRXhwYW5kQnlSb3cgKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuICEhcm93Ll9YX0VYUEFORFxyXG4gICAgICB9LFxyXG4gICAgICBzZXRUcmVlRXhwYW5zaW9uIChyb3dzOiBhbnksIGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXRUcmVlRXhwYW5kKHJvd3MsIGV4cGFuZGVkKVxyXG4gICAgICB9LFxyXG4gICAgICBzZXRUcmVlRXhwYW5kICh0aGlzOiBhbnksIHJvd3M6IGFueSwgZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIGlmIChyb3dzKSB7XHJcbiAgICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyb3dzKSkge1xyXG4gICAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByb3dzLmZvckVhY2goKHJvdzogYW55KSA9PiB0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhIWV4cGFuZGVkKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRhYmxlRGF0YSlcclxuICAgICAgfSxcclxuICAgICAgc2V0QWxsVHJlZUV4cGFuc2lvbiAoZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNldEFsbFRyZWVFeHBhbmQoZXhwYW5kZWQpXHJcbiAgICAgIH0sXHJcbiAgICAgIHNldEFsbFRyZWVFeHBhbmQgKGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFRyZWVEYXRhKHRoaXMudmlydHVhbEFsbEV4cGFuZChleHBhbmRlZCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHRvZ2dsZVRyZWVFeHBhbnNpb24gKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudG9nZ2xlVHJlZUV4cGFuZChyb3cpXHJcbiAgICAgIH0sXHJcbiAgICAgIHRvZ2dsZVRyZWVFeHBhbmQgKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhcm93Ll9YX0VYUEFORCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldFRyZWVFeHBhbmRSZWNvcmRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBoYXNDaGlsZHMgPSB0aGlzLmhhc0NoaWxkc1xyXG4gICAgICAgIGNvbnN0IHRyZWVFeHBhbmRSZWNvcmRzOiBhbnlbXSA9IFtdXHJcbiAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0aGlzLmZ1bGxUcmVlRGF0YSwgcm93ID0+IHtcclxuICAgICAgICAgIGlmIChyb3cuX1hfRVhQQU5EICYmIGhhc0NoaWxkcyhyb3cpKSB7XHJcbiAgICAgICAgICAgIHRyZWVFeHBhbmRSZWNvcmRzLnB1c2gocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMudHJlZU9wdHMpXHJcbiAgICAgICAgcmV0dXJuIHRyZWVFeHBhbmRSZWNvcmRzXHJcbiAgICAgIH0sXHJcbiAgICAgIGNsZWFyVHJlZUV4cGFuZCAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWxsVHJlZUV4cGFuZChmYWxzZSlcclxuICAgICAgfSxcclxuICAgICAgaGFuZGxlQ29sdW1ucyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1ucy5tYXAoKGNvbmY6IGFueSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGNvbmYudHJlZU5vZGUpIHtcclxuICAgICAgICAgICAgbGV0IHNsb3RzID0gY29uZi5zbG90cyB8fCB7fVxyXG4gICAgICAgICAgICBzbG90cy5pY29uID0gdGhpcy5yZW5kZXJUcmVlSWNvblxyXG4gICAgICAgICAgICBzbG90cy5saW5lID0gdGhpcy5yZW5kZXJUcmVlTGluZVxyXG4gICAgICAgICAgICBjb25mLnNsb3RzID0gc2xvdHNcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBjb25mXHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgaGFzQ2hpbGRzICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgY2hpbGRMaXN0ID0gcm93W3RoaXMudHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgICAgICAgcmV0dXJuIGNoaWxkTGlzdCAmJiBjaGlsZExpc3QubGVuZ3RoXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDojrflj5booajmoLzmlbDmja7pm4bvvIzljIXlkKvmlrDlop7jgIHliKDpmaTjgIHkv67mlLlcclxuICAgICAgICovXHJcbiAgICAgIGdldFJlY29yZHNldCAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGluc2VydFJlY29yZHM6IHRoaXMuZ2V0SW5zZXJ0UmVjb3JkcygpLFxyXG4gICAgICAgICAgcmVtb3ZlUmVjb3JkczogdGhpcy5nZXRSZW1vdmVSZWNvcmRzKCksXHJcbiAgICAgICAgICB1cGRhdGVSZWNvcmRzOiB0aGlzLmdldFVwZGF0ZVJlY29yZHMoKVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgaXNJbnNlcnRCeVJvdyAocm93OiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gISFyb3cuX1hfSU5TRVJUXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldEluc2VydFJlY29yZHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGluc2VydFJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgaWYgKHJvdy5fWF9JTlNFUlQpIHtcclxuICAgICAgICAgICAgaW5zZXJ0UmVjb3Jkcy5wdXNoKHJvdylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzLnRyZWVPcHRzKVxyXG4gICAgICAgIHJldHVybiBpbnNlcnRSZWNvcmRzXHJcbiAgICAgIH0sXHJcbiAgICAgIGluc2VydCAodGhpczogYW55LCByZWNvcmRzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbnNlcnRBdChyZWNvcmRzKVxyXG4gICAgICB9LFxyXG4gICAgICBpbnNlcnRBdCAodGhpczogYW55LCByZWNvcmRzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBmdWxsVHJlZURhdGEsIHRhYmxlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyZWNvcmRzKSkge1xyXG4gICAgICAgICAgcmVjb3JkcyA9IFtyZWNvcmRzXVxyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbmV3UmVjb3JkcyA9IHJlY29yZHMubWFwKChyZWNvcmQ6IGFueSkgPT4gdGhpcy5kZWZpbmVGaWVsZChPYmplY3QuYXNzaWduKHtcclxuICAgICAgICAgIF9YX0VYUEFORDogZmFsc2UsXHJcbiAgICAgICAgICBfWF9JTlNFUlQ6IHRydWUsXHJcbiAgICAgICAgICBfWF9MRVZFTDogMFxyXG4gICAgICAgIH0sIHJlY29yZCkpKVxyXG4gICAgICAgIGlmICghcm93KSB7XHJcbiAgICAgICAgICBmdWxsVHJlZURhdGEudW5zaGlmdC5hcHBseShmdWxsVHJlZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgICB0YWJsZURhdGEudW5zaGlmdC5hcHBseSh0YWJsZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmIChyb3cgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGZ1bGxUcmVlRGF0YS5wdXNoLmFwcGx5KGZ1bGxUcmVlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICAgICAgdGFibGVEYXRhLnB1c2guYXBwbHkodGFibGVEYXRhLCBuZXdSZWNvcmRzKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IG1hdGNoT2JqID0gWEVVdGlscy5maW5kVHJlZShmdWxsVHJlZURhdGEsIGl0ZW0gPT4gaXRlbSA9PT0gcm93LCB0cmVlT3B0cylcclxuICAgICAgICAgICAgaWYgKCFtYXRjaE9iaiB8fCBtYXRjaE9iai5pbmRleCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodCgndnhlLmVycm9yLnVuYWJsZUluc2VydCcpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCB7IGl0ZW1zLCBpbmRleCwgbm9kZXMgfTogYW55ID0gbWF0Y2hPYmpcclxuICAgICAgICAgICAgbGV0IHJvd0luZGV4ID0gdGFibGVEYXRhLmluZGV4T2Yocm93KVxyXG4gICAgICAgICAgICBpZiAocm93SW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgIHRhYmxlRGF0YS5zcGxpY2UuYXBwbHkodGFibGVEYXRhLCBbcm93SW5kZXgsIDBdLmNvbmNhdChuZXdSZWNvcmRzKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpdGVtcy5zcGxpY2UuYXBwbHkoaXRlbXMsIFtpbmRleCwgMF0uY29uY2F0KG5ld1JlY29yZHMpKVxyXG4gICAgICAgICAgICBuZXdSZWNvcmRzLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgIGl0ZW0uX1hfTEVWRUwgPSBub2Rlcy5sZW5ndGggLSAxXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGFibGVEYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJvdzogbmV3UmVjb3Jkcy5sZW5ndGggPyBuZXdSZWNvcmRzW25ld1JlY29yZHMubGVuZ3RoIC0gMV0gOiBudWxsLFxyXG4gICAgICAgICAgICByb3dzOiBuZXdSZWNvcmRzXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOiOt+WPluW3suWIoOmZpOeahOaVsOaNrlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0UmVtb3ZlUmVjb3JkcyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdFxyXG4gICAgICB9LFxyXG4gICAgICByZW1vdmVTZWxlY3RlZHMgKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZUNoZWNrYm94Um93KClcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWIoOmZpOmAieS4reaVsOaNrlxyXG4gICAgICAgKi9cclxuICAgICAgcmVtb3ZlQ2hlY2tib3hSb3cgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZSh0aGlzLmdldFNlbGVjdFJlY29yZHMoKSkudGhlbigocGFyYW1zOiBhbnkpID0+IHtcclxuICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3Rpb24oKVxyXG4gICAgICAgICAgcmV0dXJuIHBhcmFtc1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbW92ZSAodGhpczogYW55LCByb3dzOiBhbnlbXSkge1xyXG4gICAgICAgIGNvbnN0IHsgcmVtb3ZlTGlzdCwgZnVsbFRyZWVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGxldCByZXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgaWYgKCFyb3dzKSB7XHJcbiAgICAgICAgICByb3dzID0gZnVsbFRyZWVEYXRhXHJcbiAgICAgICAgfSBlbHNlIGlmICghWEVVdGlscy5pc0FycmF5KHJvd3MpKSB7XHJcbiAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJvd3MuZm9yRWFjaCgocm93OiBhbnkpID0+IHtcclxuICAgICAgICAgIGxldCBtYXRjaE9iaiA9IFhFVXRpbHMuZmluZFRyZWUoZnVsbFRyZWVEYXRhLCBpdGVtID0+IGl0ZW0gPT09IHJvdywgdHJlZU9wdHMpXHJcbiAgICAgICAgICBpZiAobWF0Y2hPYmopIHtcclxuICAgICAgICAgICAgY29uc3QgeyBpdGVtLCBpdGVtcywgaW5kZXgsIHBhcmVudCB9OiBhbnkgPSBtYXRjaE9ialxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbnNlcnRCeVJvdyhyb3cpKSB7XHJcbiAgICAgICAgICAgICAgcmVtb3ZlTGlzdC5wdXNoKHJvdylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgbGV0IGlzRXhwYW5kID0gdGhpcy5pc1RyZWVFeHBhbmRCeVJvdyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocGFyZW50KVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpdGVtcy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUV4cGFuZGluZyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29sbGFwc2luZyhpdGVtKVxyXG4gICAgICAgICAgICAgIGl0ZW1zLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgICB0aGlzLnRhYmxlRGF0YS5zcGxpY2UodGhpcy50YWJsZURhdGEuaW5kZXhPZihpdGVtKSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGhpcy50YWJsZURhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHsgcm93OiByZXN0Lmxlbmd0aCA/IHJlc3RbcmVzdC5sZW5ndGggLSAxXSA6IG51bGwsIHJvd3M6IHJlc3QgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDlpITnkIbpu5jorqTlsZXlvIDmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIGhhbmRsZURlZmF1bHRUcmVlRXhwYW5kICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBsZXQgeyB0cmVlQ29uZmlnLCB0cmVlT3B0cywgdGFibGVGdWxsRGF0YSB9ID0gdGhpc1xyXG4gICAgICAgIGlmICh0cmVlQ29uZmlnKSB7XHJcbiAgICAgICAgICBsZXQgeyBjaGlsZHJlbiwgZXhwYW5kQWxsLCBleHBhbmRSb3dLZXlzIH0gPSB0cmVlT3B0c1xyXG4gICAgICAgICAgaWYgKGV4cGFuZEFsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEFsbFRyZWVFeHBhbmQodHJ1ZSlcclxuICAgICAgICAgIH0gZWxzZSBpZiAoZXhwYW5kUm93S2V5cykge1xyXG4gICAgICAgICAgICBsZXQgcm93a2V5ID0gdGhpcy5yb3dJZFxyXG4gICAgICAgICAgICBleHBhbmRSb3dLZXlzLmZvckVhY2goKHJvd2lkOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKHRhYmxlRnVsbERhdGEsIGl0ZW0gPT4gcm93aWQgPT09IFhFVXRpbHMuZ2V0KGl0ZW0sIHJvd2tleSksIHRyZWVPcHRzKVxyXG4gICAgICAgICAgICAgIGxldCByb3dDaGlsZHJlbiA9IG1hdGNoT2JqID8gbWF0Y2hPYmouaXRlbVtjaGlsZHJlbl0gOiAwXHJcbiAgICAgICAgICAgICAgaWYgKHJvd0NoaWxkcmVuICYmIHJvd0NoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRUcmVlRXhwYW5kKG1hdGNoT2JqLml0ZW0sIHRydWUpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWumuS5ieagkeWxnuaAp1xyXG4gICAgICAgKi9cclxuICAgICAgdG9WaXJ0dWFsVHJlZSAodGhpczogYW55LCB0cmVlRGF0YTogYW55W10pIHtcclxuICAgICAgICBsZXQgZnVsbFRyZWVSb3dNYXAgPSB0aGlzLmZ1bGxUcmVlUm93TWFwXHJcbiAgICAgICAgZnVsbFRyZWVSb3dNYXAuY2xlYXIoKVxyXG4gICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodHJlZURhdGEsIChpdGVtLCBpbmRleCwgaXRlbXMsIHBhdGhzLCBwYXJlbnQsIG5vZGVzKSA9PiB7XHJcbiAgICAgICAgICBpdGVtLl9YX0VYUEFORCA9IGZhbHNlXHJcbiAgICAgICAgICBpdGVtLl9YX0lOU0VSVCA9IGZhbHNlXHJcbiAgICAgICAgICBpdGVtLl9YX0xFVkVMID0gbm9kZXMubGVuZ3RoIC0gMVxyXG4gICAgICAgICAgZnVsbFRyZWVSb3dNYXAuc2V0KGl0ZW0sIHsgaXRlbSwgaW5kZXgsIGl0ZW1zLCBwYXRocywgcGFyZW50LCBub2RlcyB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5mdWxsVHJlZURhdGEgPSB0cmVlRGF0YS5zbGljZSgwKVxyXG4gICAgICAgIHRoaXMudGFibGVEYXRhID0gdHJlZURhdGEuc2xpY2UoMClcclxuICAgICAgICByZXR1cm4gdHJlZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxFeHBhbmQgKHRoaXM6IGFueSwgcm93OiBhbnksIGV4cGFuZGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHJvdy5fWF9FWFBBTkQgIT09IGV4cGFuZGVkKSB7XHJcbiAgICAgICAgICBpZiAocm93Ll9YX0VYUEFORCkge1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocm93KVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5oYW5kbGVFeHBhbmRpbmcocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLy8g5bGV5byA6IqC54K5XHJcbiAgICAgIGhhbmRsZUV4cGFuZGluZyAodGhpczogYW55LCByb3c6IGFueSkge1xyXG4gICAgICAgIGlmICh0aGlzLmhhc0NoaWxkcyhyb3cpKSB7XHJcbiAgICAgICAgICBjb25zdCB7IHRhYmxlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICAgIGxldCBjaGlsZFJvd3MgPSByb3dbdHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgICAgICAgICBsZXQgZXhwYW5kTGlzdDogYW55W10gPSBbXVxyXG4gICAgICAgICAgbGV0IHJvd0luZGV4ID0gdGFibGVEYXRhLmluZGV4T2Yocm93KVxyXG4gICAgICAgICAgaWYgKHJvd0luZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mUmeivr+eahOaTjeS9nO+8gScpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKGNoaWxkUm93cywgKGl0ZW0sIGluZGV4LCBvYmosIHBhdGhzLCBwYXJlbnQsIG5vZGVzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghcGFyZW50IHx8IHBhcmVudC5fWF9FWFBBTkQpIHtcclxuICAgICAgICAgICAgICBleHBhbmRMaXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gdHJ1ZVxyXG4gICAgICAgICAgdGFibGVEYXRhLnNwbGljZS5hcHBseSh0YWJsZURhdGEsIFtyb3dJbmRleCArIDEsIDBdLmNvbmNhdChleHBhbmRMaXN0KSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGFibGVEYXRhXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIOaUtui1t+iKgueCuVxyXG4gICAgICBoYW5kbGVDb2xsYXBzaW5nICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgIGNvbnN0IHsgdGFibGVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgICAgbGV0IGNoaWxkUm93cyA9IHJvd1t0cmVlT3B0cy5jaGlsZHJlbl1cclxuICAgICAgICAgIGxldCBub2RlQ2hpbGRMaXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKGNoaWxkUm93cywgaXRlbSA9PiB7XHJcbiAgICAgICAgICAgIG5vZGVDaGlsZExpc3QucHVzaChpdGVtKVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gZmFsc2VcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGFibGVEYXRhLmZpbHRlcigoaXRlbTogYW55KSA9PiBub2RlQ2hpbGRMaXN0LmluZGV4T2YoaXRlbSkgPT09IC0xKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmiYDmnInmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxBbGxFeHBhbmQgKHRoaXM6IGFueSwgZXhwYW5kZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCB7IHRyZWVPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgaWYgKGV4cGFuZGVkKSB7XHJcbiAgICAgICAgICBjb25zdCB0YWJsZUxpc3Q6IGFueVtdID0gW11cclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSBleHBhbmRlZFxyXG4gICAgICAgICAgICB0YWJsZUxpc3QucHVzaChyb3cpXHJcbiAgICAgICAgICB9LCB0cmVlT3B0cylcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGFibGVMaXN0XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSBleHBhbmRlZFxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICB0aGlzLnRhYmxlRGF0YSA9IHRoaXMuZnVsbFRyZWVEYXRhLnNsaWNlKDApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9LFxyXG4gICAgICBjaGVja2JveEFsbEV2ZW50ICh0aGlzOiBhbnksIHBhcmFtczogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBjaGVja2JveENvbmZpZyA9IHt9LCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tGaWVsZCwgaGFsZkZpZWxkLCBjaGVja1N0cmljdGx5IH0gPSBjaGVja2JveENvbmZpZ1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tlZCB9ID0gcGFyYW1zXHJcbiAgICAgICAgaWYgKGNoZWNrRmllbGQgJiYgIWNoZWNrU3RyaWN0bHkpIHtcclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvd1tjaGVja0ZpZWxkXSA9IGNoZWNrZWRcclxuICAgICAgICAgICAgaWYgKGhhbGZGaWVsZCkge1xyXG4gICAgICAgICAgICAgIHJvd1toYWxmRmllbGRdID0gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuJGVtaXQoJ2NoZWNrYm94LWFsbCcsIHBhcmFtcylcclxuICAgICAgfSxcclxuICAgICAgY2hlY2tib3hDaGFuZ2VFdmVudCAodGhpczogYW55LCBwYXJhbXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tib3hDb25maWcgPSB7fSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBjb25zdCB7IGNoZWNrRmllbGQsIGhhbGZGaWVsZCwgY2hlY2tTdHJpY3RseSB9ID0gY2hlY2tib3hDb25maWdcclxuICAgICAgICBjb25zdCB7IHJvdywgY2hlY2tlZCB9ID0gcGFyYW1zXHJcbiAgICAgICAgaWYgKGNoZWNrRmllbGQgJiYgIWNoZWNrU3RyaWN0bHkpIHtcclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUoW3Jvd10sIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvd1tjaGVja0ZpZWxkXSA9IGNoZWNrZWRcclxuICAgICAgICAgICAgaWYgKGhhbGZGaWVsZCkge1xyXG4gICAgICAgICAgICAgIHJvd1toYWxmRmllbGRdID0gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICB0aGlzLmNoZWNrUGFyZW50Tm9kZVNlbGVjdGlvbihyb3cpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuJGVtaXQoJ2NoZWNrYm94LWNoYW5nZScsIHBhcmFtcylcclxuICAgICAgfSxcclxuICAgICAgY2hlY2tQYXJlbnROb2RlU2VsZWN0aW9uICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBjaGVja2JveENvbmZpZyA9IHt9LCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGNvbnN0IHsgY2hpbGRyZW4gfSA9IHRyZWVPcHRzXHJcbiAgICAgICAgY29uc3QgeyBjaGVja0ZpZWxkLCBoYWxmRmllbGQsIGNoZWNrU3RyaWN0bHkgfSA9IGNoZWNrYm94Q29uZmlnXHJcbiAgICAgICAgY29uc3QgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCBpdGVtID0+IGl0ZW0gPT09IHJvdywgdHJlZU9wdHMpXHJcbiAgICAgICAgaWYgKG1hdGNoT2JqICYmIGNoZWNrRmllbGQgJiYgIWNoZWNrU3RyaWN0bHkpIHtcclxuICAgICAgICAgIGNvbnN0IHBhcmVudFJvdyA9IG1hdGNoT2JqLnBhcmVudFxyXG4gICAgICAgICAgaWYgKHBhcmVudFJvdykge1xyXG4gICAgICAgICAgICBjb25zdCBpc0FsbCA9IHBhcmVudFJvd1tjaGlsZHJlbl0uZXZlcnkoKGl0ZW06IGFueSkgPT4gaXRlbVtjaGVja0ZpZWxkXSlcclxuICAgICAgICAgICAgaWYgKGhhbGZGaWVsZCAmJiAhaXNBbGwpIHtcclxuICAgICAgICAgICAgICBwYXJlbnRSb3dbaGFsZkZpZWxkXSA9IHBhcmVudFJvd1tjaGlsZHJlbl0uc29tZSgoaXRlbTogYW55KSA9PiBpdGVtW2NoZWNrRmllbGRdIHx8IGl0ZW1baGFsZkZpZWxkXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwYXJlbnRSb3dbY2hlY2tGaWVsZF0gPSBpc0FsbFxyXG4gICAgICAgICAgICB0aGlzLmNoZWNrUGFyZW50Tm9kZVNlbGVjdGlvbihwYXJlbnRSb3cpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLiRyZWZzLnhUYWJsZS5jaGVja1NlbGVjdGlvblN0YXR1cygpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBnZXRDaGVja2JveFJlY29yZHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tib3hDb25maWcgPSB7fSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBjb25zdCB7IGNoZWNrRmllbGQgfSA9IGNoZWNrYm94Q29uZmlnXHJcbiAgICAgICAgaWYgKGNoZWNrRmllbGQpIHtcclxuICAgICAgICAgIGNvbnN0IHJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyb3dbY2hlY2tGaWVsZF0pIHtcclxuICAgICAgICAgICAgICByZWNvcmRzLnB1c2gocm93KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCB0cmVlT3B0cylcclxuICAgICAgICAgIHJldHVybiByZWNvcmRzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLiRyZWZzLnhUYWJsZS5nZXRDaGVja2JveFJlY29yZHMoKVxyXG4gICAgICB9LFxyXG4gICAgICBnZXRDaGVja2JveEluZGV0ZXJtaW5hdGVSZWNvcmRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7IGNoZWNrYm94Q29uZmlnID0ge30sIHRyZWVPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgY29uc3QgeyBoYWxmRmllbGQgfSA9IGNoZWNrYm94Q29uZmlnXHJcbiAgICAgICAgaWYgKGhhbGZGaWVsZCkge1xyXG4gICAgICAgICAgY29uc3QgcmVjb3JkczogYW55W10gPSBbXVxyXG4gICAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0aGlzLmZ1bGxUcmVlRGF0YSwgcm93ID0+IHtcclxuICAgICAgICAgICAgaWYgKHJvd1toYWxmRmllbGRdKSB7XHJcbiAgICAgICAgICAgICAgcmVjb3Jkcy5wdXNoKHJvdylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByZXR1cm4gcmVjb3Jkc1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy4kcmVmcy54VGFibGUuZ2V0Q2hlY2tib3hJbmRldGVybWluYXRlUmVjb3JkcygpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIFZ1ZS5jb21wb25lbnQoVmlydHVhbFRyZWUubmFtZSwgVmlydHVhbFRyZWUpXHJcbn1cclxuXHJcbi8qKlxyXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOWunueOsOeugOWNleeahOiZmuaLn+agkeihqOagvFxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUgPSB7XHJcbiAgaW5zdGFsbCAoeHRhYmxlOiB0eXBlb2YgVlhFVGFibGUpIHtcclxuICAgIC8vIOazqOWGjOe7hOS7tlxyXG4gICAgcmVnaXN0ZXJDb21wb25lbnQoeHRhYmxlKVxyXG4gIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSkge1xyXG4gIHdpbmRvdy5WWEVUYWJsZS51c2UoVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZSlcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZVxyXG4iXX0=
