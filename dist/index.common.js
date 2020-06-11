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
        var $listeners = this.$listeners,
            proxyConfig = this.proxyConfig,
            proxyOpts = this.proxyOpts;
        var ons = {};

        _xeUtils["default"].each($listeners, function (cb, type) {
          ons[type] = function () {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            this.$emit.apply(this, [type].concat(args));
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
        var _this2 = this;

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
            return _this2.toggleTreeExpand(row);
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
        var _this3 = this;

        var selectRow = this.getRadioRecord();
        return this.$nextTick().then(function () {
          return _this3.$refs.xTable.loadData(data);
        }).then(function () {
          if (selectRow) {
            _this3.setRadioRow(selectRow);
          }
        });
      },
      loadData: function loadData(data) {
        return this._loadTreeData(this.toVirtualTree(data));
      },
      reloadData: function reloadData(data) {
        var _this4 = this;

        return this.$nextTick().then(function () {
          return _this4.$refs.xTable.reloadData(_this4.toVirtualTree(data));
        }).then(function () {
          return _this4.handleDefaultTreeExpand();
        });
      },
      isTreeExpandByRow: function isTreeExpandByRow(row) {
        return !!row._X_EXPAND;
      },
      setTreeExpansion: function setTreeExpansion(rows, expanded) {
        return this.setTreeExpand(rows, expanded);
      },
      setTreeExpand: function setTreeExpand(rows, expanded) {
        var _this5 = this;

        if (rows) {
          if (!_xeUtils["default"].isArray(rows)) {
            rows = [rows];
          }

          rows.forEach(function (row) {
            return _this5.virtualExpand(row, !!expanded);
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
        var _this6 = this;

        return this.columns.map(function (conf) {
          if (conf.treeNode) {
            var slots = conf.slots || {};
            slots.icon = _this6.renderTreeIcon;
            slots.line = _this6.renderTreeLine;
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
        var _this7 = this;

        var fullTreeData = this.fullTreeData,
            tableData = this.tableData,
            treeOpts = this.treeOpts;

        if (!_xeUtils["default"].isArray(records)) {
          records = [records];
        }

        var newRecords = records.map(function (record) {
          return _this7.defineField(Object.assign({
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
        var _this8 = this;

        return this.remove(this.getSelectRecords()).then(function (params) {
          _this8.clearSelection();

          return params;
        });
      },
      remove: function remove(rows) {
        var _this9 = this;

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

            if (!_this9.isInsertByRow(row)) {
              removeList.push(row);
            }

            if (parent) {
              var isExpand = _this9.isTreeExpandByRow(parent);

              if (isExpand) {
                _this9.handleCollapsing(parent);
              }

              items.splice(index, 1);

              if (isExpand) {
                _this9.handleExpanding(parent);
              }
            } else {
              _this9.handleCollapsing(item);

              items.splice(index, 1);

              _this9.tableData.splice(_this9.tableData.indexOf(item), 1);
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
        var _this10 = this;

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
                _this10.setTreeExpand(matchObj.item, true);
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
                return item[checkField];
              });
            }

            parentRow[checkField] = isAll;
            this.checkParentNodeSelection(parentRow);
          } else {
            this.$refs.xTable.checkSelectionStatus();
          }
        }
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbImNvdW50VHJlZUV4cGFuZCIsIiR4VHJlZSIsInByZXZSb3ciLCJyb3dDaGlsZHJlbiIsInRyZWVPcHRzIiwiY2hpbGRyZW4iLCJjb3VudCIsImlzVHJlZUV4cGFuZEJ5Um93IiwiaW5kZXgiLCJsZW5ndGgiLCJnZXRPZmZzZXRTaXplIiwidlNpemUiLCJjYWxjVHJlZUxpbmUiLCIkdGFibGUiLCJtYXRjaE9iaiIsIml0ZW1zIiwiZXhwYW5kU2l6ZSIsInJvd0hlaWdodCIsInJlZ2lzdGVyQ29tcG9uZW50IiwiVnVlIiwiVGFibGUiLCJHcmlkIiwic2V0dXAiLCJ0IiwiR2xvYmFsQ29uZmlnIiwicHJvcEtleXMiLCJPYmplY3QiLCJrZXlzIiwicHJvcHMiLCJmaWx0ZXIiLCJuYW1lIiwiaW5kZXhPZiIsIlZpcnR1YWxUcmVlIiwiZGF0YSIsInJlbW92ZUxpc3QiLCJjb21wdXRlZCIsInNpemUiLCIkcGFyZW50IiwiYXNzaWduIiwiaGFzQ2hpbGQiLCJpbmRlbnQiLCJ0cmVlQ29uZmlnIiwicmVuZGVyQ2xhc3MiLCJhbmltYXQiLCJsaW5lIiwiaXNNYXhpbWl6ZWQiLCJ0YWJsZUV4dGVuZFByb3BzIiwicmVzdCIsImZvckVhY2giLCJrZXkiLCJ3YXRjaCIsImNvbHVtbnMiLCJsb2FkQ29sdW1uIiwiaGFuZGxlQ29sdW1ucyIsInZhbHVlIiwibG9hZERhdGEiLCJjcmVhdGVkIiwiZnVsbFRyZWVEYXRhIiwidGFibGVEYXRhIiwiZnVsbFRyZWVSb3dNYXAiLCJNYXAiLCJyZWxvYWREYXRhIiwibWV0aG9kcyIsImdldFRhYmxlT25zIiwiJGxpc3RlbmVycyIsInByb3h5Q29uZmlnIiwicHJveHlPcHRzIiwib25zIiwiWEVVdGlscyIsImVhY2giLCJjYiIsInR5cGUiLCJhcmdzIiwiJGVtaXQiLCJjaGVja2JveEFsbEV2ZW50IiwiY2hlY2tib3hDaGFuZ2VFdmVudCIsInNvcnQiLCJzb3J0Q2hhbmdlRXZlbnQiLCJmaWx0ZXJDaGFuZ2VFdmVudCIsInJlbmRlclRyZWVMaW5lIiwicGFyYW1zIiwiaCIsInJvdyIsImNvbHVtbiIsInRyZWVOb2RlIiwicm93TGV2ZWwiLCJfWF9MRVZFTCIsImdldCIsInN0eWxlIiwiaGVpZ2h0IiwibGVmdCIsInJlbmRlclRyZWVJY29uIiwiY2VsbFZOb2RlcyIsImlzSGlkZGVuIiwidHJpZ2dlciIsImljb25PcGVuIiwiaWNvbkNsb3NlIiwiaXNBY2VpdmVkIiwib24iLCJfWF9FWFBBTkQiLCJjbGljayIsInRvZ2dsZVRyZWVFeHBhbmQiLCJwYWRkaW5nTGVmdCIsImljb24iLCJUQUJMRV9UUkVFX09QRU4iLCJUQUJMRV9UUkVFX0NMT1NFIiwiX2xvYWRUcmVlRGF0YSIsInNlbGVjdFJvdyIsImdldFJhZGlvUmVjb3JkIiwiJG5leHRUaWNrIiwidGhlbiIsIiRyZWZzIiwieFRhYmxlIiwic2V0UmFkaW9Sb3ciLCJ0b1ZpcnR1YWxUcmVlIiwiaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQiLCJzZXRUcmVlRXhwYW5zaW9uIiwicm93cyIsImV4cGFuZGVkIiwic2V0VHJlZUV4cGFuZCIsImlzQXJyYXkiLCJ2aXJ0dWFsRXhwYW5kIiwic2V0QWxsVHJlZUV4cGFuc2lvbiIsInNldEFsbFRyZWVFeHBhbmQiLCJ2aXJ0dWFsQWxsRXhwYW5kIiwidG9nZ2xlVHJlZUV4cGFuc2lvbiIsImdldFRyZWVFeHBhbmRSZWNvcmRzIiwiaGFzQ2hpbGRzIiwidHJlZUV4cGFuZFJlY29yZHMiLCJlYWNoVHJlZSIsInB1c2giLCJjbGVhclRyZWVFeHBhbmQiLCJtYXAiLCJjb25mIiwic2xvdHMiLCJjaGlsZExpc3QiLCJnZXRSZWNvcmRzZXQiLCJpbnNlcnRSZWNvcmRzIiwiZ2V0SW5zZXJ0UmVjb3JkcyIsInJlbW92ZVJlY29yZHMiLCJnZXRSZW1vdmVSZWNvcmRzIiwidXBkYXRlUmVjb3JkcyIsImdldFVwZGF0ZVJlY29yZHMiLCJpc0luc2VydEJ5Um93IiwiX1hfSU5TRVJUIiwiaW5zZXJ0IiwicmVjb3JkcyIsImluc2VydEF0IiwibmV3UmVjb3JkcyIsInJlY29yZCIsImRlZmluZUZpZWxkIiwidW5zaGlmdCIsImFwcGx5IiwiZmluZFRyZWUiLCJpdGVtIiwiRXJyb3IiLCJub2RlcyIsInJvd0luZGV4Iiwic3BsaWNlIiwiY29uY2F0IiwicmVtb3ZlU2VsZWN0ZWRzIiwicmVtb3ZlQ2hlY2tib3hSb3ciLCJyZW1vdmUiLCJnZXRTZWxlY3RSZWNvcmRzIiwiY2xlYXJTZWxlY3Rpb24iLCJwYXJlbnQiLCJpc0V4cGFuZCIsImhhbmRsZUNvbGxhcHNpbmciLCJoYW5kbGVFeHBhbmRpbmciLCJ0YWJsZUZ1bGxEYXRhIiwiZXhwYW5kQWxsIiwiZXhwYW5kUm93S2V5cyIsInJvd2tleSIsInJvd0lkIiwicm93aWQiLCJ0cmVlRGF0YSIsImNsZWFyIiwicGF0aHMiLCJzZXQiLCJzbGljZSIsImNoaWxkUm93cyIsImV4cGFuZExpc3QiLCJvYmoiLCJub2RlQ2hpbGRMaXN0IiwidGFibGVMaXN0IiwiY2hlY2tib3hDb25maWciLCJjaGVja0ZpZWxkIiwiaGFsZkZpZWxkIiwiY2hlY2tTdHJpY3RseSIsImNoZWNrZWQiLCJjaGVja1BhcmVudE5vZGVTZWxlY3Rpb24iLCJwYXJlbnRSb3ciLCJpc0FsbCIsImV2ZXJ5Iiwic29tZSIsImNoZWNrU2VsZWN0aW9uU3RhdHVzIiwiY29tcG9uZW50IiwiVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZSIsImluc3RhbGwiLCJ4dGFibGUiLCJ3aW5kb3ciLCJWWEVUYWJsZSIsInVzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs7Ozs7QUFFQTtBQUVBLFNBQVNBLGVBQVQsQ0FBMEJDLE1BQTFCLEVBQXVDQyxPQUF2QyxFQUFtRDtBQUNqRCxNQUFNQyxXQUFXLEdBQUdELE9BQU8sQ0FBQ0QsTUFBTSxDQUFDRyxRQUFQLENBQWdCQyxRQUFqQixDQUEzQjtBQUNBLE1BQUlDLEtBQUssR0FBRyxDQUFaOztBQUNBLE1BQUlMLE1BQU0sQ0FBQ00saUJBQVAsQ0FBeUJMLE9BQXpCLENBQUosRUFB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cUJBQWVBLElBQUksQ0FBQ2dDLFVBQUQsQ0FBbkI7QUFBQSxhQUExQixDQUFkOztBQUNBLGdCQUFJQyxTQUFTLElBQUksQ0FBQ0ssS0FBbEIsRUFBeUI7QUFDdkJELGNBQUFBLFNBQVMsQ0FBQ0osU0FBRCxDQUFULEdBQXVCSSxTQUFTLENBQUMxTCxRQUFELENBQVQsQ0FBb0I2TCxJQUFwQixDQUF5QixVQUFDeEMsSUFBRDtBQUFBLHVCQUFlQSxJQUFJLENBQUNnQyxVQUFELENBQW5CO0FBQUEsZUFBekIsQ0FBdkI7QUFDRDs7QUFDREssWUFBQUEsU0FBUyxDQUFDTCxVQUFELENBQVQsR0FBd0JNLEtBQXhCO0FBQ0EsaUJBQUtGLHdCQUFMLENBQThCQyxTQUE5QjtBQUNELFdBUEQsTUFPTztBQUNMLGlCQUFLaEYsS0FBTCxDQUFXQyxNQUFYLENBQWtCbUYsb0JBQWxCO0FBQ0Q7QUFDRjtBQUNGO0FBMWFNO0FBeERjLEdBQXpCO0FBc2VBaEwsRUFBQUEsR0FBRyxDQUFDaUwsU0FBSixDQUFjcEssV0FBVyxDQUFDRixJQUExQixFQUFnQ0UsV0FBaEM7QUFDRDtBQUVEOzs7OztBQUdPLElBQU1xSyx5QkFBeUIsR0FBRztBQUN2Q0MsRUFBQUEsT0FEdUMsbUJBQzlCQyxNQUQ4QixFQUNQO0FBQzlCO0FBQ0FyTCxJQUFBQSxpQkFBaUIsQ0FBQ3FMLE1BQUQsQ0FBakI7QUFDRDtBQUpzQyxDQUFsQzs7O0FBT1AsSUFBSSxPQUFPQyxNQUFQLEtBQWtCLFdBQWxCLElBQWlDQSxNQUFNLENBQUNDLFFBQTVDLEVBQXNEO0FBQ3BERCxFQUFBQSxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JDLEdBQWhCLENBQW9CTCx5QkFBcEI7QUFDRDs7ZUFFY0EseUIiLCJmaWxlIjoiaW5kZXguY29tbW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cclxuaW1wb3J0IHsgQ3JlYXRlRWxlbWVudCwgVk5vZGVDaGlsZHJlbiB9IGZyb20gJ3Z1ZSdcclxuaW1wb3J0IFhFVXRpbHMgZnJvbSAneGUtdXRpbHMvbWV0aG9kcy94ZS11dGlscydcclxuaW1wb3J0IHsgVlhFVGFibGUgfSBmcm9tICd2eGUtdGFibGUvbGliL3Z4ZS10YWJsZSdcclxuLyogZXNsaW50LWVuYWJsZSBuby11bnVzZWQtdmFycyAqL1xyXG5cclxuZnVuY3Rpb24gY291bnRUcmVlRXhwYW5kICgkeFRyZWU6IGFueSwgcHJldlJvdzogYW55KTogbnVtYmVyIHtcclxuICBjb25zdCByb3dDaGlsZHJlbiA9IHByZXZSb3dbJHhUcmVlLnRyZWVPcHRzLmNoaWxkcmVuXVxyXG4gIGxldCBjb3VudCA9IDFcclxuICBpZiAoJHhUcmVlLmlzVHJlZUV4cGFuZEJ5Um93KHByZXZSb3cpKSB7XHJcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcm93Q2hpbGRyZW4ubGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgIGNvdW50ICs9IGNvdW50VHJlZUV4cGFuZCgkeFRyZWUsIHJvd0NoaWxkcmVuW2luZGV4XSlcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGNvdW50XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE9mZnNldFNpemUgKCR4VHJlZTogYW55KTogbnVtYmVyIHtcclxuICBzd2l0Y2ggKCR4VHJlZS52U2l6ZSkge1xyXG4gICAgY2FzZSAnbWluaSc6XHJcbiAgICAgIHJldHVybiAzXHJcbiAgICBjYXNlICdzbWFsbCc6XHJcbiAgICAgIHJldHVybiAyXHJcbiAgICBjYXNlICdtZWRpdW0nOlxyXG4gICAgICByZXR1cm4gMVxyXG4gIH1cclxuICByZXR1cm4gMFxyXG59XHJcblxyXG5mdW5jdGlvbiBjYWxjVHJlZUxpbmUgKCR0YWJsZTogYW55LCAkeFRyZWU6IGFueSwgbWF0Y2hPYmo6IGFueSk6IG51bWJlciB7XHJcbiAgY29uc3QgeyBpbmRleCwgaXRlbXMgfSA9IG1hdGNoT2JqXHJcbiAgbGV0IGV4cGFuZFNpemUgPSAxXHJcbiAgaWYgKGluZGV4KSB7XHJcbiAgICBleHBhbmRTaXplID0gY291bnRUcmVlRXhwYW5kKCR4VHJlZSwgaXRlbXNbaW5kZXggLSAxXSlcclxuICB9XHJcbiAgcmV0dXJuICR0YWJsZS5yb3dIZWlnaHQgKiBleHBhbmRTaXplIC0gKGluZGV4ID8gMSA6ICgxMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSkpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50ICh7IFZ1ZSwgVGFibGUsIEdyaWQsIHNldHVwLCB0IH06IGFueSkge1xyXG4gIGNvbnN0IEdsb2JhbENvbmZpZyA9IHNldHVwKClcclxuICBjb25zdCBwcm9wS2V5cyA9IE9iamVjdC5rZXlzKFRhYmxlLnByb3BzKS5maWx0ZXIobmFtZSA9PiBbJ2RhdGEnLCAndHJlZUNvbmZpZyddLmluZGV4T2YobmFtZSkgPT09IC0xKVxyXG5cclxuICBjb25zdCBWaXJ0dWFsVHJlZTogYW55ID0ge1xyXG4gICAgbmFtZTogJ1Z4ZVZpcnR1YWxUcmVlJyxcclxuICAgIGV4dGVuZHM6IEdyaWQsXHJcbiAgICBkYXRhICgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZW1vdmVMaXN0OiBbXVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY29tcHV0ZWQ6IHtcclxuICAgICAgdlNpemUgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNpemUgfHwgdGhpcy4kcGFyZW50LnNpemUgfHwgdGhpcy4kcGFyZW50LnZTaXplXHJcbiAgICAgIH0sXHJcbiAgICAgIHRyZWVPcHRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgICAgICBjaGlsZHJlbjogJ2NoaWxkcmVuJyxcclxuICAgICAgICAgIGhhc0NoaWxkOiAnaGFzQ2hpbGQnLFxyXG4gICAgICAgICAgaW5kZW50OiAyMFxyXG4gICAgICAgIH0sIEdsb2JhbENvbmZpZy50cmVlQ29uZmlnLCB0aGlzLnRyZWVDb25maWcpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbmRlckNsYXNzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7IHZTaXplIH0gPSB0aGlzXHJcbiAgICAgICAgcmV0dXJuIFsndnhlLWdyaWQgdnhlLXZpcnR1YWwtdHJlZScsIHtcclxuICAgICAgICAgIFtgc2l6ZS0tJHt2U2l6ZX1gXTogdlNpemUsXHJcbiAgICAgICAgICAndC0tYW5pbWF0JzogdGhpcy5hbmltYXQsXHJcbiAgICAgICAgICAnaGFzLS10cmVlLWxpbmUnOiB0aGlzLnRyZWVDb25maWcgJiYgdGhpcy50cmVlT3B0cy5saW5lLFxyXG4gICAgICAgICAgJ2lzLS1tYXhpbWl6ZSc6IHRoaXMuaXNNYXhpbWl6ZWQoKVxyXG4gICAgICAgIH1dXHJcbiAgICAgIH0sXHJcbiAgICAgIHRhYmxlRXh0ZW5kUHJvcHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGxldCByZXN0OiBhbnkgPSB7fVxyXG4gICAgICAgIHByb3BLZXlzLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgIHJlc3Rba2V5XSA9IHRoaXNba2V5XVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIHJlc3RcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHdhdGNoOiB7XHJcbiAgICAgIGNvbHVtbnMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHRoaXMubG9hZENvbHVtbih0aGlzLmhhbmRsZUNvbHVtbnMoKSlcclxuICAgICAgfSxcclxuICAgICAgZGF0YSAodGhpczogYW55LCB2YWx1ZTogYW55W10pIHtcclxuICAgICAgICB0aGlzLmxvYWREYXRhKHZhbHVlKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY3JlYXRlZCAodGhpczogYW55KSB7XHJcbiAgICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpc1xyXG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHtcclxuICAgICAgICBmdWxsVHJlZURhdGE6IFtdLFxyXG4gICAgICAgIHRhYmxlRGF0YTogW10sXHJcbiAgICAgICAgZnVsbFRyZWVSb3dNYXA6IG5ldyBNYXAoKVxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLmhhbmRsZUNvbHVtbnMoKVxyXG4gICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIHRoaXMucmVsb2FkRGF0YShkYXRhKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbWV0aG9kczoge1xyXG4gICAgICBnZXRUYWJsZU9ucyAodGhpczogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyAkbGlzdGVuZXJzLCBwcm94eUNvbmZpZywgcHJveHlPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgY29uc3Qgb25zOiB7IFtrZXk6IHN0cmluZ106IEZ1bmN0aW9uIH0gPSB7fVxyXG4gICAgICAgIFhFVXRpbHMuZWFjaCgkbGlzdGVuZXJzLCAoY2IsIHR5cGUpID0+IHtcclxuICAgICAgICAgIG9uc1t0eXBlXSA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xyXG4gICAgICAgICAgICB0aGlzLiRlbWl0KHR5cGUsIC4uLmFyZ3MpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBvbnNbJ2NoZWNrYm94LWFsbCddID0gdGhpcy5jaGVja2JveEFsbEV2ZW50XHJcbiAgICAgICAgb25zWydjaGVja2JveC1jaGFuZ2UnXSA9IHRoaXMuY2hlY2tib3hDaGFuZ2VFdmVudFxyXG4gICAgICAgIGlmIChwcm94eUNvbmZpZykge1xyXG4gICAgICAgICAgaWYgKHByb3h5T3B0cy5zb3J0KSB7XHJcbiAgICAgICAgICAgIG9uc1snc29ydC1jaGFuZ2UnXSA9IHRoaXMuc29ydENoYW5nZUV2ZW50XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocHJveHlPcHRzLmZpbHRlcikge1xyXG4gICAgICAgICAgICBvbnNbJ2ZpbHRlci1jaGFuZ2UnXSA9IHRoaXMuZmlsdGVyQ2hhbmdlRXZlbnRcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9uc1xyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJUcmVlTGluZSAodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogQ3JlYXRlRWxlbWVudCkge1xyXG4gICAgICAgIGNvbnN0IHsgdHJlZUNvbmZpZywgdHJlZU9wdHMsIGZ1bGxUcmVlUm93TWFwIH0gPSB0aGlzXHJcbiAgICAgICAgY29uc3QgeyAkdGFibGUsIHJvdywgY29sdW1uIH0gPSBwYXJhbXNcclxuICAgICAgICBjb25zdCB7IHRyZWVOb2RlIH0gPSBjb2x1bW5cclxuICAgICAgICBpZiAodHJlZU5vZGUgJiYgdHJlZUNvbmZpZyAmJiB0cmVlT3B0cy5saW5lKSB7XHJcbiAgICAgICAgICBjb25zdCAkeFRyZWUgPSB0aGlzXHJcbiAgICAgICAgICBjb25zdCByb3dMZXZlbCA9IHJvdy5fWF9MRVZFTFxyXG4gICAgICAgICAgY29uc3QgbWF0Y2hPYmogPSBmdWxsVHJlZVJvd01hcC5nZXQocm93KVxyXG4gICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgdHJlZU5vZGUgJiYgdHJlZU9wdHMubGluZSA/IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1saW5lLXdyYXBwZXInXHJcbiAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1saW5lJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogYCR7Y2FsY1RyZWVMaW5lKCR0YWJsZSwgJHhUcmVlLCBtYXRjaE9iail9cHhgLFxyXG4gICAgICAgICAgICAgICAgICBsZWZ0OiBgJHtyb3dMZXZlbCAqICh0cmVlT3B0cy5pbmRlbnQgfHwgMjApICsgKHJvd0xldmVsID8gMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSA6IDApICsgMTZ9cHhgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgXSkgOiBudWxsXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbXVxyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJUcmVlSWNvbiAodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogQ3JlYXRlRWxlbWVudCwgY2VsbFZOb2RlczogVk5vZGVDaGlsZHJlbikge1xyXG4gICAgICAgIGxldCB7IGlzSGlkZGVuIH0gPSBwYXJhbXNcclxuICAgICAgICBsZXQgeyByb3cgfSA9IHBhcmFtc1xyXG4gICAgICAgIGxldCB7IGNoaWxkcmVuLCBpbmRlbnQsIHRyaWdnZXIsIGljb25PcGVuLCBpY29uQ2xvc2UgfSA9IHRoaXMudHJlZU9wdHNcclxuICAgICAgICBsZXQgcm93Q2hpbGRyZW4gPSByb3dbY2hpbGRyZW5dXHJcbiAgICAgICAgbGV0IGlzQWNlaXZlZCA9IGZhbHNlXHJcbiAgICAgICAgbGV0IG9uOiBhbnkgPSB7fVxyXG4gICAgICAgIGlmICghaXNIaWRkZW4pIHtcclxuICAgICAgICAgIGlzQWNlaXZlZCA9IHJvdy5fWF9FWFBBTkRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0cmlnZ2VyIHx8IHRyaWdnZXIgPT09ICdkZWZhdWx0Jykge1xyXG4gICAgICAgICAgb24uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZVRyZWVFeHBhbmQocm93KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICBjbGFzczogWyd2eGUtY2VsbC0tdHJlZS1ub2RlJywge1xyXG4gICAgICAgICAgICAgICdpcy0tYWN0aXZlJzogaXNBY2VpdmVkXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgIHBhZGRpbmdMZWZ0OiBgJHtyb3cuX1hfTEVWRUwgKiBpbmRlbnR9cHhgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgcm93Q2hpbGRyZW4gJiYgcm93Q2hpbGRyZW4ubGVuZ3RoID8gW1xyXG4gICAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtLWJ0bi13cmFwcGVyJyxcclxuICAgICAgICAgICAgICAgIG9uXHJcbiAgICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgaCgnaScsIHtcclxuICAgICAgICAgICAgICAgICAgY2xhc3M6IFsndnhlLXRyZWUtLW5vZGUtYnRuJywgaXNBY2VpdmVkID8gKGljb25PcGVuIHx8IEdsb2JhbENvbmZpZy5pY29uLlRBQkxFX1RSRUVfT1BFTikgOiAoaWNvbkNsb3NlIHx8IEdsb2JhbENvbmZpZy5pY29uLlRBQkxFX1RSRUVfQ0xPU0UpXVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICBdIDogbnVsbCxcclxuICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtY2VsbCdcclxuICAgICAgICAgICAgfSwgY2VsbFZOb2RlcylcclxuICAgICAgICAgIF0pXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICBfbG9hZFRyZWVEYXRhICh0aGlzOiBhbnksIGRhdGE6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHNlbGVjdFJvdyA9IHRoaXMuZ2V0UmFkaW9SZWNvcmQoKVxyXG4gICAgICAgIHJldHVybiB0aGlzLiRuZXh0VGljaygpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLiRyZWZzLnhUYWJsZS5sb2FkRGF0YShkYXRhKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdFJvdykge1xyXG4gICAgICAgICAgICAgIHRoaXMuc2V0UmFkaW9Sb3coc2VsZWN0Um93KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICBsb2FkRGF0YSAoZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRvVmlydHVhbFRyZWUoZGF0YSkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbG9hZERhdGEgKHRoaXM6IGFueSwgZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJG5leHRUaWNrKClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuJHJlZnMueFRhYmxlLnJlbG9hZERhdGEodGhpcy50b1ZpcnR1YWxUcmVlKGRhdGEpKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQoKSlcclxuICAgICAgfSxcclxuICAgICAgaXNUcmVlRXhwYW5kQnlSb3cgKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuICEhcm93Ll9YX0VYUEFORFxyXG4gICAgICB9LFxyXG4gICAgICBzZXRUcmVlRXhwYW5zaW9uIChyb3dzOiBhbnksIGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXRUcmVlRXhwYW5kKHJvd3MsIGV4cGFuZGVkKVxyXG4gICAgICB9LFxyXG4gICAgICBzZXRUcmVlRXhwYW5kICh0aGlzOiBhbnksIHJvd3M6IGFueSwgZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIGlmIChyb3dzKSB7XHJcbiAgICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyb3dzKSkge1xyXG4gICAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByb3dzLmZvckVhY2goKHJvdzogYW55KSA9PiB0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhIWV4cGFuZGVkKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRhYmxlRGF0YSlcclxuICAgICAgfSxcclxuICAgICAgc2V0QWxsVHJlZUV4cGFuc2lvbiAoZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNldEFsbFRyZWVFeHBhbmQoZXhwYW5kZWQpXHJcbiAgICAgIH0sXHJcbiAgICAgIHNldEFsbFRyZWVFeHBhbmQgKGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFRyZWVEYXRhKHRoaXMudmlydHVhbEFsbEV4cGFuZChleHBhbmRlZCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHRvZ2dsZVRyZWVFeHBhbnNpb24gKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudG9nZ2xlVHJlZUV4cGFuZChyb3cpXHJcbiAgICAgIH0sXHJcbiAgICAgIHRvZ2dsZVRyZWVFeHBhbmQgKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhcm93Ll9YX0VYUEFORCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldFRyZWVFeHBhbmRSZWNvcmRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBoYXNDaGlsZHMgPSB0aGlzLmhhc0NoaWxkc1xyXG4gICAgICAgIGNvbnN0IHRyZWVFeHBhbmRSZWNvcmRzOiBhbnlbXSA9IFtdXHJcbiAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0aGlzLmZ1bGxUcmVlRGF0YSwgcm93ID0+IHtcclxuICAgICAgICAgIGlmIChyb3cuX1hfRVhQQU5EICYmIGhhc0NoaWxkcyhyb3cpKSB7XHJcbiAgICAgICAgICAgIHRyZWVFeHBhbmRSZWNvcmRzLnB1c2gocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMudHJlZU9wdHMpXHJcbiAgICAgICAgcmV0dXJuIHRyZWVFeHBhbmRSZWNvcmRzXHJcbiAgICAgIH0sXHJcbiAgICAgIGNsZWFyVHJlZUV4cGFuZCAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWxsVHJlZUV4cGFuZChmYWxzZSlcclxuICAgICAgfSxcclxuICAgICAgaGFuZGxlQ29sdW1ucyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1ucy5tYXAoKGNvbmY6IGFueSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGNvbmYudHJlZU5vZGUpIHtcclxuICAgICAgICAgICAgbGV0IHNsb3RzID0gY29uZi5zbG90cyB8fCB7fVxyXG4gICAgICAgICAgICBzbG90cy5pY29uID0gdGhpcy5yZW5kZXJUcmVlSWNvblxyXG4gICAgICAgICAgICBzbG90cy5saW5lID0gdGhpcy5yZW5kZXJUcmVlTGluZVxyXG4gICAgICAgICAgICBjb25mLnNsb3RzID0gc2xvdHNcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBjb25mXHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgaGFzQ2hpbGRzICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgY2hpbGRMaXN0ID0gcm93W3RoaXMudHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgICAgICAgcmV0dXJuIGNoaWxkTGlzdCAmJiBjaGlsZExpc3QubGVuZ3RoXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDojrflj5booajmoLzmlbDmja7pm4bvvIzljIXlkKvmlrDlop7jgIHliKDpmaTjgIHkv67mlLlcclxuICAgICAgICovXHJcbiAgICAgIGdldFJlY29yZHNldCAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGluc2VydFJlY29yZHM6IHRoaXMuZ2V0SW5zZXJ0UmVjb3JkcygpLFxyXG4gICAgICAgICAgcmVtb3ZlUmVjb3JkczogdGhpcy5nZXRSZW1vdmVSZWNvcmRzKCksXHJcbiAgICAgICAgICB1cGRhdGVSZWNvcmRzOiB0aGlzLmdldFVwZGF0ZVJlY29yZHMoKVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgaXNJbnNlcnRCeVJvdyAocm93OiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gISFyb3cuX1hfSU5TRVJUXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldEluc2VydFJlY29yZHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGluc2VydFJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgaWYgKHJvdy5fWF9JTlNFUlQpIHtcclxuICAgICAgICAgICAgaW5zZXJ0UmVjb3Jkcy5wdXNoKHJvdylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzLnRyZWVPcHRzKVxyXG4gICAgICAgIHJldHVybiBpbnNlcnRSZWNvcmRzXHJcbiAgICAgIH0sXHJcbiAgICAgIGluc2VydCAodGhpczogYW55LCByZWNvcmRzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbnNlcnRBdChyZWNvcmRzKVxyXG4gICAgICB9LFxyXG4gICAgICBpbnNlcnRBdCAodGhpczogYW55LCByZWNvcmRzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBmdWxsVHJlZURhdGEsIHRhYmxlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyZWNvcmRzKSkge1xyXG4gICAgICAgICAgcmVjb3JkcyA9IFtyZWNvcmRzXVxyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbmV3UmVjb3JkcyA9IHJlY29yZHMubWFwKChyZWNvcmQ6IGFueSkgPT4gdGhpcy5kZWZpbmVGaWVsZChPYmplY3QuYXNzaWduKHtcclxuICAgICAgICAgIF9YX0VYUEFORDogZmFsc2UsXHJcbiAgICAgICAgICBfWF9JTlNFUlQ6IHRydWUsXHJcbiAgICAgICAgICBfWF9MRVZFTDogMFxyXG4gICAgICAgIH0sIHJlY29yZCkpKVxyXG4gICAgICAgIGlmICghcm93KSB7XHJcbiAgICAgICAgICBmdWxsVHJlZURhdGEudW5zaGlmdC5hcHBseShmdWxsVHJlZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgICB0YWJsZURhdGEudW5zaGlmdC5hcHBseSh0YWJsZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmIChyb3cgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGZ1bGxUcmVlRGF0YS5wdXNoLmFwcGx5KGZ1bGxUcmVlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICAgICAgdGFibGVEYXRhLnB1c2guYXBwbHkodGFibGVEYXRhLCBuZXdSZWNvcmRzKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IG1hdGNoT2JqID0gWEVVdGlscy5maW5kVHJlZShmdWxsVHJlZURhdGEsIGl0ZW0gPT4gaXRlbSA9PT0gcm93LCB0cmVlT3B0cylcclxuICAgICAgICAgICAgaWYgKCFtYXRjaE9iaiB8fCBtYXRjaE9iai5pbmRleCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodCgndnhlLmVycm9yLnVuYWJsZUluc2VydCcpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCB7IGl0ZW1zLCBpbmRleCwgbm9kZXMgfTogYW55ID0gbWF0Y2hPYmpcclxuICAgICAgICAgICAgbGV0IHJvd0luZGV4ID0gdGFibGVEYXRhLmluZGV4T2Yocm93KVxyXG4gICAgICAgICAgICBpZiAocm93SW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgIHRhYmxlRGF0YS5zcGxpY2UuYXBwbHkodGFibGVEYXRhLCBbcm93SW5kZXgsIDBdLmNvbmNhdChuZXdSZWNvcmRzKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpdGVtcy5zcGxpY2UuYXBwbHkoaXRlbXMsIFtpbmRleCwgMF0uY29uY2F0KG5ld1JlY29yZHMpKVxyXG4gICAgICAgICAgICBuZXdSZWNvcmRzLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgIGl0ZW0uX1hfTEVWRUwgPSBub2Rlcy5sZW5ndGggLSAxXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGFibGVEYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJvdzogbmV3UmVjb3Jkcy5sZW5ndGggPyBuZXdSZWNvcmRzW25ld1JlY29yZHMubGVuZ3RoIC0gMV0gOiBudWxsLFxyXG4gICAgICAgICAgICByb3dzOiBuZXdSZWNvcmRzXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOiOt+WPluW3suWIoOmZpOeahOaVsOaNrlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0UmVtb3ZlUmVjb3JkcyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdFxyXG4gICAgICB9LFxyXG4gICAgICByZW1vdmVTZWxlY3RlZHMgKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZUNoZWNrYm94Um93KClcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWIoOmZpOmAieS4reaVsOaNrlxyXG4gICAgICAgKi9cclxuICAgICAgcmVtb3ZlQ2hlY2tib3hSb3cgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZSh0aGlzLmdldFNlbGVjdFJlY29yZHMoKSkudGhlbigocGFyYW1zOiBhbnkpID0+IHtcclxuICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3Rpb24oKVxyXG4gICAgICAgICAgcmV0dXJuIHBhcmFtc1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbW92ZSAodGhpczogYW55LCByb3dzOiBhbnlbXSkge1xyXG4gICAgICAgIGNvbnN0IHsgcmVtb3ZlTGlzdCwgZnVsbFRyZWVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGxldCByZXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgaWYgKCFyb3dzKSB7XHJcbiAgICAgICAgICByb3dzID0gZnVsbFRyZWVEYXRhXHJcbiAgICAgICAgfSBlbHNlIGlmICghWEVVdGlscy5pc0FycmF5KHJvd3MpKSB7XHJcbiAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJvd3MuZm9yRWFjaCgocm93OiBhbnkpID0+IHtcclxuICAgICAgICAgIGxldCBtYXRjaE9iaiA9IFhFVXRpbHMuZmluZFRyZWUoZnVsbFRyZWVEYXRhLCBpdGVtID0+IGl0ZW0gPT09IHJvdywgdHJlZU9wdHMpXHJcbiAgICAgICAgICBpZiAobWF0Y2hPYmopIHtcclxuICAgICAgICAgICAgY29uc3QgeyBpdGVtLCBpdGVtcywgaW5kZXgsIHBhcmVudCB9OiBhbnkgPSBtYXRjaE9ialxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbnNlcnRCeVJvdyhyb3cpKSB7XHJcbiAgICAgICAgICAgICAgcmVtb3ZlTGlzdC5wdXNoKHJvdylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgbGV0IGlzRXhwYW5kID0gdGhpcy5pc1RyZWVFeHBhbmRCeVJvdyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocGFyZW50KVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpdGVtcy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUV4cGFuZGluZyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29sbGFwc2luZyhpdGVtKVxyXG4gICAgICAgICAgICAgIGl0ZW1zLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgICB0aGlzLnRhYmxlRGF0YS5zcGxpY2UodGhpcy50YWJsZURhdGEuaW5kZXhPZihpdGVtKSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGhpcy50YWJsZURhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHsgcm93OiByZXN0Lmxlbmd0aCA/IHJlc3RbcmVzdC5sZW5ndGggLSAxXSA6IG51bGwsIHJvd3M6IHJlc3QgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDlpITnkIbpu5jorqTlsZXlvIDmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIGhhbmRsZURlZmF1bHRUcmVlRXhwYW5kICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBsZXQgeyB0cmVlQ29uZmlnLCB0cmVlT3B0cywgdGFibGVGdWxsRGF0YSB9ID0gdGhpc1xyXG4gICAgICAgIGlmICh0cmVlQ29uZmlnKSB7XHJcbiAgICAgICAgICBsZXQgeyBjaGlsZHJlbiwgZXhwYW5kQWxsLCBleHBhbmRSb3dLZXlzIH0gPSB0cmVlT3B0c1xyXG4gICAgICAgICAgaWYgKGV4cGFuZEFsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEFsbFRyZWVFeHBhbmQodHJ1ZSlcclxuICAgICAgICAgIH0gZWxzZSBpZiAoZXhwYW5kUm93S2V5cykge1xyXG4gICAgICAgICAgICBsZXQgcm93a2V5ID0gdGhpcy5yb3dJZFxyXG4gICAgICAgICAgICBleHBhbmRSb3dLZXlzLmZvckVhY2goKHJvd2lkOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKHRhYmxlRnVsbERhdGEsIGl0ZW0gPT4gcm93aWQgPT09IFhFVXRpbHMuZ2V0KGl0ZW0sIHJvd2tleSksIHRyZWVPcHRzKVxyXG4gICAgICAgICAgICAgIGxldCByb3dDaGlsZHJlbiA9IG1hdGNoT2JqID8gbWF0Y2hPYmouaXRlbVtjaGlsZHJlbl0gOiAwXHJcbiAgICAgICAgICAgICAgaWYgKHJvd0NoaWxkcmVuICYmIHJvd0NoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRUcmVlRXhwYW5kKG1hdGNoT2JqLml0ZW0sIHRydWUpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWumuS5ieagkeWxnuaAp1xyXG4gICAgICAgKi9cclxuICAgICAgdG9WaXJ0dWFsVHJlZSAodGhpczogYW55LCB0cmVlRGF0YTogYW55W10pIHtcclxuICAgICAgICBsZXQgZnVsbFRyZWVSb3dNYXAgPSB0aGlzLmZ1bGxUcmVlUm93TWFwXHJcbiAgICAgICAgZnVsbFRyZWVSb3dNYXAuY2xlYXIoKVxyXG4gICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodHJlZURhdGEsIChpdGVtLCBpbmRleCwgaXRlbXMsIHBhdGhzLCBwYXJlbnQsIG5vZGVzKSA9PiB7XHJcbiAgICAgICAgICBpdGVtLl9YX0VYUEFORCA9IGZhbHNlXHJcbiAgICAgICAgICBpdGVtLl9YX0lOU0VSVCA9IGZhbHNlXHJcbiAgICAgICAgICBpdGVtLl9YX0xFVkVMID0gbm9kZXMubGVuZ3RoIC0gMVxyXG4gICAgICAgICAgZnVsbFRyZWVSb3dNYXAuc2V0KGl0ZW0sIHsgaXRlbSwgaW5kZXgsIGl0ZW1zLCBwYXRocywgcGFyZW50LCBub2RlcyB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5mdWxsVHJlZURhdGEgPSB0cmVlRGF0YS5zbGljZSgwKVxyXG4gICAgICAgIHRoaXMudGFibGVEYXRhID0gdHJlZURhdGEuc2xpY2UoMClcclxuICAgICAgICByZXR1cm4gdHJlZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxFeHBhbmQgKHRoaXM6IGFueSwgcm93OiBhbnksIGV4cGFuZGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHJvdy5fWF9FWFBBTkQgIT09IGV4cGFuZGVkKSB7XHJcbiAgICAgICAgICBpZiAocm93Ll9YX0VYUEFORCkge1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocm93KVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5oYW5kbGVFeHBhbmRpbmcocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLy8g5bGV5byA6IqC54K5XHJcbiAgICAgIGhhbmRsZUV4cGFuZGluZyAodGhpczogYW55LCByb3c6IGFueSkge1xyXG4gICAgICAgIGlmICh0aGlzLmhhc0NoaWxkcyhyb3cpKSB7XHJcbiAgICAgICAgICBjb25zdCB7IHRhYmxlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICAgIGxldCBjaGlsZFJvd3MgPSByb3dbdHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgICAgICAgICBsZXQgZXhwYW5kTGlzdDogYW55W10gPSBbXVxyXG4gICAgICAgICAgbGV0IHJvd0luZGV4ID0gdGFibGVEYXRhLmluZGV4T2Yocm93KVxyXG4gICAgICAgICAgaWYgKHJvd0luZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mUmeivr+eahOaTjeS9nO+8gScpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKGNoaWxkUm93cywgKGl0ZW0sIGluZGV4LCBvYmosIHBhdGhzLCBwYXJlbnQsIG5vZGVzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghcGFyZW50IHx8IHBhcmVudC5fWF9FWFBBTkQpIHtcclxuICAgICAgICAgICAgICBleHBhbmRMaXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gdHJ1ZVxyXG4gICAgICAgICAgdGFibGVEYXRhLnNwbGljZS5hcHBseSh0YWJsZURhdGEsIFtyb3dJbmRleCArIDEsIDBdLmNvbmNhdChleHBhbmRMaXN0KSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGFibGVEYXRhXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIOaUtui1t+iKgueCuVxyXG4gICAgICBoYW5kbGVDb2xsYXBzaW5nICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgIGNvbnN0IHsgdGFibGVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgICAgbGV0IGNoaWxkUm93cyA9IHJvd1t0cmVlT3B0cy5jaGlsZHJlbl1cclxuICAgICAgICAgIGxldCBub2RlQ2hpbGRMaXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKGNoaWxkUm93cywgaXRlbSA9PiB7XHJcbiAgICAgICAgICAgIG5vZGVDaGlsZExpc3QucHVzaChpdGVtKVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gZmFsc2VcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGFibGVEYXRhLmZpbHRlcigoaXRlbTogYW55KSA9PiBub2RlQ2hpbGRMaXN0LmluZGV4T2YoaXRlbSkgPT09IC0xKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmiYDmnInmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxBbGxFeHBhbmQgKHRoaXM6IGFueSwgZXhwYW5kZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCB7IHRyZWVPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgaWYgKGV4cGFuZGVkKSB7XHJcbiAgICAgICAgICBjb25zdCB0YWJsZUxpc3Q6IGFueVtdID0gW11cclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSBleHBhbmRlZFxyXG4gICAgICAgICAgICB0YWJsZUxpc3QucHVzaChyb3cpXHJcbiAgICAgICAgICB9LCB0cmVlT3B0cylcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGFibGVMaXN0XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSBleHBhbmRlZFxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICB0aGlzLnRhYmxlRGF0YSA9IHRoaXMuZnVsbFRyZWVEYXRhLnNsaWNlKDApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9LFxyXG4gICAgICBjaGVja2JveEFsbEV2ZW50ICh0aGlzOiBhbnksIHBhcmFtczogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBjaGVja2JveENvbmZpZyA9IHt9LCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tGaWVsZCwgaGFsZkZpZWxkLCBjaGVja1N0cmljdGx5IH0gPSBjaGVja2JveENvbmZpZ1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tlZCB9ID0gcGFyYW1zXHJcbiAgICAgICAgaWYgKGNoZWNrRmllbGQgJiYgIWNoZWNrU3RyaWN0bHkpIHtcclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvd1tjaGVja0ZpZWxkXSA9IGNoZWNrZWRcclxuICAgICAgICAgICAgaWYgKGhhbGZGaWVsZCkge1xyXG4gICAgICAgICAgICAgIHJvd1toYWxmRmllbGRdID0gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuJGVtaXQoJ2NoZWNrYm94LWFsbCcsIHBhcmFtcylcclxuICAgICAgfSxcclxuICAgICAgY2hlY2tib3hDaGFuZ2VFdmVudCAodGhpczogYW55LCBwYXJhbXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHsgY2hlY2tib3hDb25maWcgPSB7fSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBjb25zdCB7IGNoZWNrRmllbGQsIGhhbGZGaWVsZCwgY2hlY2tTdHJpY3RseSB9ID0gY2hlY2tib3hDb25maWdcclxuICAgICAgICBjb25zdCB7IHJvdywgY2hlY2tlZCB9ID0gcGFyYW1zXHJcbiAgICAgICAgaWYgKGNoZWNrRmllbGQgJiYgIWNoZWNrU3RyaWN0bHkpIHtcclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUoW3Jvd10sIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvd1tjaGVja0ZpZWxkXSA9IGNoZWNrZWRcclxuICAgICAgICAgICAgaWYgKGhhbGZGaWVsZCkge1xyXG4gICAgICAgICAgICAgIHJvd1toYWxmRmllbGRdID0gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICB0aGlzLmNoZWNrUGFyZW50Tm9kZVNlbGVjdGlvbihyb3cpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuJGVtaXQoJ2NoZWNrYm94LWNoYW5nZScsIHBhcmFtcylcclxuICAgICAgfSxcclxuICAgICAgY2hlY2tQYXJlbnROb2RlU2VsZWN0aW9uICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBjaGVja2JveENvbmZpZyA9IHt9LCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGNvbnN0IHsgY2hpbGRyZW4gfSA9IHRyZWVPcHRzXHJcbiAgICAgICAgY29uc3QgeyBjaGVja0ZpZWxkLCBoYWxmRmllbGQsIGNoZWNrU3RyaWN0bHkgfSA9IGNoZWNrYm94Q29uZmlnXHJcbiAgICAgICAgY29uc3QgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCBpdGVtID0+IGl0ZW0gPT09IHJvdywgdHJlZU9wdHMpXHJcbiAgICAgICAgaWYgKG1hdGNoT2JqICYmIGNoZWNrRmllbGQgJiYgIWNoZWNrU3RyaWN0bHkpIHtcclxuICAgICAgICAgIGNvbnN0IHBhcmVudFJvdyA9IG1hdGNoT2JqLnBhcmVudFxyXG4gICAgICAgICAgaWYgKHBhcmVudFJvdykge1xyXG4gICAgICAgICAgICBjb25zdCBpc0FsbCA9IHBhcmVudFJvd1tjaGlsZHJlbl0uZXZlcnkoKGl0ZW06IGFueSkgPT4gaXRlbVtjaGVja0ZpZWxkXSlcclxuICAgICAgICAgICAgaWYgKGhhbGZGaWVsZCAmJiAhaXNBbGwpIHtcclxuICAgICAgICAgICAgICBwYXJlbnRSb3dbaGFsZkZpZWxkXSA9IHBhcmVudFJvd1tjaGlsZHJlbl0uc29tZSgoaXRlbTogYW55KSA9PiBpdGVtW2NoZWNrRmllbGRdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBhcmVudFJvd1tjaGVja0ZpZWxkXSA9IGlzQWxsXHJcbiAgICAgICAgICAgIHRoaXMuY2hlY2tQYXJlbnROb2RlU2VsZWN0aW9uKHBhcmVudFJvdylcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHJlZnMueFRhYmxlLmNoZWNrU2VsZWN0aW9uU3RhdHVzKClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIFZ1ZS5jb21wb25lbnQoVmlydHVhbFRyZWUubmFtZSwgVmlydHVhbFRyZWUpXHJcbn1cclxuXHJcbi8qKlxyXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOWunueOsOeugOWNleeahOiZmuaLn+agkeihqOagvFxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUgPSB7XHJcbiAgaW5zdGFsbCAoeHRhYmxlOiB0eXBlb2YgVlhFVGFibGUpIHtcclxuICAgIC8vIOazqOWGjOe7hOS7tlxyXG4gICAgcmVnaXN0ZXJDb21wb25lbnQoeHRhYmxlKVxyXG4gIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSkge1xyXG4gIHdpbmRvdy5WWEVUYWJsZS51c2UoVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZSlcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZVxyXG4iXX0=
