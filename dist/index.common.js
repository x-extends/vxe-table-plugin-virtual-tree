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
        if (expanded) {
          var tableList = [];

          _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
            row._X_EXPAND = expanded;
            tableList.push(row);
          }, this.treeOpts);

          this.tableData = tableList;
        } else {
          _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
            row._X_EXPAND = expanded;
          }, this.treeOpts);

          this.tableData = this.fullTreeData.slice(0);
        }

        return this.tableData;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbImNvdW50VHJlZUV4cGFuZCIsIiR4VHJlZSIsInByZXZSb3ciLCJyb3dDaGlsZHJlbiIsInRyZWVPcHRzIiwiY2hpbGRyZW4iLCJjb3VudCIsImlzVHJlZUV4cGFuZEJ5Um93IiwiaW5kZXgiLCJsZW5ndGgiLCJnZXRPZmZzZXRTaXplIiwidlNpemUiLCJjYWxjVHJlZUxpbmUiLCIkdGFibGUiLCJtYXRjaE9iaiIsIml0ZW1zIiwiZXhwYW5kU2l6ZSIsInJvd0hlaWdodCIsInJlZ2lzdGVyQ29tcG9uZW50IiwiVnVlIiwiVGFibGUiLCJHcmlkIiwic2V0dXAiLCJ0IiwiR2xvYmFsQ29uZmlnIiwicHJvcEtleXMiLCJPYmplY3QiLCJrZXlzIiwicHJvcHMiLCJmaWx0ZXIiLCJuYW1lIiwiaW5kZXhPZiIsIlZpcnR1YWxUcmVlIiwiZGF0YSIsInJlbW92ZUxpc3QiLCJjb21wdXRlZCIsInNpemUiLCIkcGFyZW50IiwiYXNzaWduIiwiaGFzQ2hpbGQiLCJpbmRlbnQiLCJ0cmVlQ29uZmlnIiwicmVuZGVyQ2xhc3MiLCJhbmltYXQiLCJsaW5lIiwiaXNNYXhpbWl6ZWQiLCJ0YWJsZUV4dGVuZFByb3BzIiwicmVzdCIsImZvckVhY2giLCJrZXkiLCJ3YXRjaCIsImNvbHVtbnMiLCJsb2FkQ29sdW1uIiwiaGFuZGxlQ29sdW1ucyIsInZhbHVlIiwibG9hZERhdGEiLCJjcmVhdGVkIiwiZnVsbFRyZWVEYXRhIiwidGFibGVEYXRhIiwiZnVsbFRyZWVSb3dNYXAiLCJNYXAiLCJyZWxvYWREYXRhIiwibWV0aG9kcyIsInJlbmRlclRyZWVMaW5lIiwicGFyYW1zIiwiaCIsInJvdyIsImNvbHVtbiIsInRyZWVOb2RlIiwicm93TGV2ZWwiLCJfWF9MRVZFTCIsImdldCIsInN0eWxlIiwiaGVpZ2h0IiwibGVmdCIsInJlbmRlclRyZWVJY29uIiwiY2VsbFZOb2RlcyIsImlzSGlkZGVuIiwidHJpZ2dlciIsImljb25PcGVuIiwiaWNvbkNsb3NlIiwiaXNBY2VpdmVkIiwib24iLCJfWF9FWFBBTkQiLCJjbGljayIsInRvZ2dsZVRyZWVFeHBhbmQiLCJwYWRkaW5nTGVmdCIsImljb24iLCJUQUJMRV9UUkVFX09QRU4iLCJUQUJMRV9UUkVFX0NMT1NFIiwiX2xvYWRUcmVlRGF0YSIsInNlbGVjdFJvdyIsImdldFJhZGlvUmVjb3JkIiwiJG5leHRUaWNrIiwidGhlbiIsIiRyZWZzIiwieFRhYmxlIiwic2V0UmFkaW9Sb3ciLCJ0b1ZpcnR1YWxUcmVlIiwiaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQiLCJzZXRUcmVlRXhwYW5zaW9uIiwicm93cyIsImV4cGFuZGVkIiwic2V0VHJlZUV4cGFuZCIsIlhFVXRpbHMiLCJpc0FycmF5IiwidmlydHVhbEV4cGFuZCIsInNldEFsbFRyZWVFeHBhbnNpb24iLCJzZXRBbGxUcmVlRXhwYW5kIiwidmlydHVhbEFsbEV4cGFuZCIsInRvZ2dsZVRyZWVFeHBhbnNpb24iLCJnZXRUcmVlRXhwYW5kUmVjb3JkcyIsImhhc0NoaWxkcyIsInRyZWVFeHBhbmRSZWNvcmRzIiwiZWFjaFRyZWUiLCJwdXNoIiwiY2xlYXJUcmVlRXhwYW5kIiwibWFwIiwiY29uZiIsInNsb3RzIiwiY2hpbGRMaXN0IiwiZ2V0UmVjb3Jkc2V0IiwiaW5zZXJ0UmVjb3JkcyIsImdldEluc2VydFJlY29yZHMiLCJyZW1vdmVSZWNvcmRzIiwiZ2V0UmVtb3ZlUmVjb3JkcyIsInVwZGF0ZVJlY29yZHMiLCJnZXRVcGRhdGVSZWNvcmRzIiwiaXNJbnNlcnRCeVJvdyIsIl9YX0lOU0VSVCIsImluc2VydCIsInJlY29yZHMiLCJpbnNlcnRBdCIsIm5ld1JlY29yZHMiLCJyZWNvcmQiLCJkZWZpbmVGaWVsZCIsInVuc2hpZnQiLCJhcHBseSIsImZpbmRUcmVlIiwiaXRlbSIsIkVycm9yIiwibm9kZXMiLCJyb3dJbmRleCIsInNwbGljZSIsImNvbmNhdCIsInJlbW92ZVNlbGVjdGVkcyIsInJlbW92ZUNoZWNrYm94Um93IiwicmVtb3ZlIiwiZ2V0U2VsZWN0UmVjb3JkcyIsImNsZWFyU2VsZWN0aW9uIiwicGFyZW50IiwiaXNFeHBhbmQiLCJoYW5kbGVDb2xsYXBzaW5nIiwiaGFuZGxlRXhwYW5kaW5nIiwidGFibGVGdWxsRGF0YSIsImV4cGFuZEFsbCIsImV4cGFuZFJvd0tleXMiLCJyb3drZXkiLCJyb3dJZCIsInJvd2lkIiwidHJlZURhdGEiLCJjbGVhciIsInBhdGhzIiwic2V0Iiwic2xpY2UiLCJjaGlsZFJvd3MiLCJleHBhbmRMaXN0Iiwib2JqIiwibm9kZUNoaWxkTGlzdCIsInRhYmxlTGlzdCIsImNvbXBvbmVudCIsIlZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUiLCJpbnN0YWxsIiwieHRhYmxlIiwid2luZG93IiwiVlhFVGFibGUiLCJ1c2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7Ozs7O0FBRUE7QUFFQSxTQUFTQSxlQUFULENBQTBCQyxNQUExQixFQUF1Q0MsT0FBdkMsRUFBbUQ7QUFDakQsTUFBTUMsV0FBVyxHQUFHRCxPQUFPLENBQUNELE1BQU0sQ0FBQ0csUUFBUCxDQUFnQkMsUUFBakIsQ0FBM0I7QUFDQSxNQUFJQyxLQUFLLEdBQUcsQ0FBWjs7QUFDQSxNQUFJTCxNQUFNLENBQUNNLGlCQUFQLENBQXlCTCxPQUF6QixDQUFKLEVBQXVDO0FBQ3JDLFNBQUssSUFBSU0sS0FBSyxHQUFHLENBQWpCLEVBQW9CQSxLQUFLLEdBQUdMLFdBQVcsQ0FBQ00sTUFBeEMsRUFBZ0RELEtBQUssRUFBckQsRUFBeUQ7QUFDdkRGLE1BQUFBLEtBQUssSUFBSU4sZUFBZSxDQUFDQyxNQUFELEVBQVNFLFdBQVcsQ0FBQ0ssS0FBRCxDQUFwQixDQUF4QjtBQUNEO0FBQ0Y7O0FBQ0QsU0FBT0YsS0FBUDtBQUNEOztBQUVELFNBQVNJLGFBQVQsQ0FBd0JULE1BQXhCLEVBQW1DO0FBQ2pDLFVBQVFBLE1BQU0sQ0FBQ1UsS0FBZjtBQUNFLFNBQUssTUFBTDtBQUNFLGFBQU8sQ0FBUDs7QUFDRixTQUFLLE9BQUw7QUFDRSxhQUFPLENBQVA7O0FBQ0Ys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cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cclxuaW1wb3J0IHsgQ3JlYXRlRWxlbWVudCwgVk5vZGVDaGlsZHJlbiB9IGZyb20gJ3Z1ZSdcclxuaW1wb3J0IFhFVXRpbHMgZnJvbSAneGUtdXRpbHMvbWV0aG9kcy94ZS11dGlscydcclxuaW1wb3J0IHsgVlhFVGFibGUgfSBmcm9tICd2eGUtdGFibGUvbGliL3Z4ZS10YWJsZSdcclxuLyogZXNsaW50LWVuYWJsZSBuby11bnVzZWQtdmFycyAqL1xyXG5cclxuZnVuY3Rpb24gY291bnRUcmVlRXhwYW5kICgkeFRyZWU6IGFueSwgcHJldlJvdzogYW55KTogbnVtYmVyIHtcclxuICBjb25zdCByb3dDaGlsZHJlbiA9IHByZXZSb3dbJHhUcmVlLnRyZWVPcHRzLmNoaWxkcmVuXVxyXG4gIGxldCBjb3VudCA9IDFcclxuICBpZiAoJHhUcmVlLmlzVHJlZUV4cGFuZEJ5Um93KHByZXZSb3cpKSB7XHJcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcm93Q2hpbGRyZW4ubGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgIGNvdW50ICs9IGNvdW50VHJlZUV4cGFuZCgkeFRyZWUsIHJvd0NoaWxkcmVuW2luZGV4XSlcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGNvdW50XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE9mZnNldFNpemUgKCR4VHJlZTogYW55KTogbnVtYmVyIHtcclxuICBzd2l0Y2ggKCR4VHJlZS52U2l6ZSkge1xyXG4gICAgY2FzZSAnbWluaSc6XHJcbiAgICAgIHJldHVybiAzXHJcbiAgICBjYXNlICdzbWFsbCc6XHJcbiAgICAgIHJldHVybiAyXHJcbiAgICBjYXNlICdtZWRpdW0nOlxyXG4gICAgICByZXR1cm4gMVxyXG4gIH1cclxuICByZXR1cm4gMFxyXG59XHJcblxyXG5mdW5jdGlvbiBjYWxjVHJlZUxpbmUgKCR0YWJsZTogYW55LCAkeFRyZWU6IGFueSwgbWF0Y2hPYmo6IGFueSk6IG51bWJlciB7XHJcbiAgY29uc3QgeyBpbmRleCwgaXRlbXMgfSA9IG1hdGNoT2JqXHJcbiAgbGV0IGV4cGFuZFNpemUgPSAxXHJcbiAgaWYgKGluZGV4KSB7XHJcbiAgICBleHBhbmRTaXplID0gY291bnRUcmVlRXhwYW5kKCR4VHJlZSwgaXRlbXNbaW5kZXggLSAxXSlcclxuICB9XHJcbiAgcmV0dXJuICR0YWJsZS5yb3dIZWlnaHQgKiBleHBhbmRTaXplIC0gKGluZGV4ID8gMSA6ICgxMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSkpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50ICh7IFZ1ZSwgVGFibGUsIEdyaWQsIHNldHVwLCB0IH06IGFueSkge1xyXG4gIGNvbnN0IEdsb2JhbENvbmZpZyA9IHNldHVwKClcclxuICBjb25zdCBwcm9wS2V5cyA9IE9iamVjdC5rZXlzKFRhYmxlLnByb3BzKS5maWx0ZXIobmFtZSA9PiBbJ2RhdGEnLCAndHJlZUNvbmZpZyddLmluZGV4T2YobmFtZSkgPT09IC0xKVxyXG5cclxuICBjb25zdCBWaXJ0dWFsVHJlZTogYW55ID0ge1xyXG4gICAgbmFtZTogJ1Z4ZVZpcnR1YWxUcmVlJyxcclxuICAgIGV4dGVuZHM6IEdyaWQsXHJcbiAgICBkYXRhICgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZW1vdmVMaXN0OiBbXVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY29tcHV0ZWQ6IHtcclxuICAgICAgdlNpemUgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNpemUgfHwgdGhpcy4kcGFyZW50LnNpemUgfHwgdGhpcy4kcGFyZW50LnZTaXplXHJcbiAgICAgIH0sXHJcbiAgICAgIHRyZWVPcHRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgICAgICBjaGlsZHJlbjogJ2NoaWxkcmVuJyxcclxuICAgICAgICAgIGhhc0NoaWxkOiAnaGFzQ2hpbGQnLFxyXG4gICAgICAgICAgaW5kZW50OiAyMFxyXG4gICAgICAgIH0sIEdsb2JhbENvbmZpZy50cmVlQ29uZmlnLCB0aGlzLnRyZWVDb25maWcpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbmRlckNsYXNzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7IHZTaXplIH0gPSB0aGlzXHJcbiAgICAgICAgcmV0dXJuIFsndnhlLWdyaWQgdnhlLXZpcnR1YWwtdHJlZScsIHtcclxuICAgICAgICAgIFtgc2l6ZS0tJHt2U2l6ZX1gXTogdlNpemUsXHJcbiAgICAgICAgICAndC0tYW5pbWF0JzogdGhpcy5hbmltYXQsXHJcbiAgICAgICAgICAnaGFzLS10cmVlLWxpbmUnOiB0aGlzLnRyZWVDb25maWcgJiYgdGhpcy50cmVlT3B0cy5saW5lLFxyXG4gICAgICAgICAgJ2lzLS1tYXhpbWl6ZSc6IHRoaXMuaXNNYXhpbWl6ZWQoKVxyXG4gICAgICAgIH1dXHJcbiAgICAgIH0sXHJcbiAgICAgIHRhYmxlRXh0ZW5kUHJvcHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGxldCByZXN0OiBhbnkgPSB7fVxyXG4gICAgICAgIHByb3BLZXlzLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgIHJlc3Rba2V5XSA9IHRoaXNba2V5XVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIHJlc3RcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHdhdGNoOiB7XHJcbiAgICAgIGNvbHVtbnMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHRoaXMubG9hZENvbHVtbih0aGlzLmhhbmRsZUNvbHVtbnMoKSlcclxuICAgICAgfSxcclxuICAgICAgZGF0YSAodGhpczogYW55LCB2YWx1ZTogYW55W10pIHtcclxuICAgICAgICB0aGlzLmxvYWREYXRhKHZhbHVlKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY3JlYXRlZCAodGhpczogYW55KSB7XHJcbiAgICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpc1xyXG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHtcclxuICAgICAgICBmdWxsVHJlZURhdGE6IFtdLFxyXG4gICAgICAgIHRhYmxlRGF0YTogW10sXHJcbiAgICAgICAgZnVsbFRyZWVSb3dNYXA6IG5ldyBNYXAoKVxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLmhhbmRsZUNvbHVtbnMoKVxyXG4gICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIHRoaXMucmVsb2FkRGF0YShkYXRhKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbWV0aG9kczoge1xyXG4gICAgICByZW5kZXJUcmVlTGluZSAodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogQ3JlYXRlRWxlbWVudCkge1xyXG4gICAgICAgIGNvbnN0IHsgdHJlZUNvbmZpZywgdHJlZU9wdHMsIGZ1bGxUcmVlUm93TWFwIH0gPSB0aGlzXHJcbiAgICAgICAgY29uc3QgeyAkdGFibGUsIHJvdywgY29sdW1uIH0gPSBwYXJhbXNcclxuICAgICAgICBjb25zdCB7IHRyZWVOb2RlIH0gPSBjb2x1bW5cclxuICAgICAgICBpZiAodHJlZU5vZGUgJiYgdHJlZUNvbmZpZyAmJiB0cmVlT3B0cy5saW5lKSB7XHJcbiAgICAgICAgICBjb25zdCAkeFRyZWUgPSB0aGlzXHJcbiAgICAgICAgICBjb25zdCByb3dMZXZlbCA9IHJvdy5fWF9MRVZFTFxyXG4gICAgICAgICAgY29uc3QgbWF0Y2hPYmogPSBmdWxsVHJlZVJvd01hcC5nZXQocm93KVxyXG4gICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgdHJlZU5vZGUgJiYgdHJlZU9wdHMubGluZSA/IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1saW5lLXdyYXBwZXInXHJcbiAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1saW5lJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogYCR7Y2FsY1RyZWVMaW5lKCR0YWJsZSwgJHhUcmVlLCBtYXRjaE9iail9cHhgLFxyXG4gICAgICAgICAgICAgICAgICBsZWZ0OiBgJHtyb3dMZXZlbCAqICh0cmVlT3B0cy5pbmRlbnQgfHwgMjApICsgKHJvd0xldmVsID8gMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSA6IDApICsgMTZ9cHhgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgXSkgOiBudWxsXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbXVxyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJUcmVlSWNvbiAodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogQ3JlYXRlRWxlbWVudCwgY2VsbFZOb2RlczogVk5vZGVDaGlsZHJlbikge1xyXG4gICAgICAgIGxldCB7IGlzSGlkZGVuIH0gPSBwYXJhbXNcclxuICAgICAgICBsZXQgeyByb3cgfSA9IHBhcmFtc1xyXG4gICAgICAgIGxldCB7IGNoaWxkcmVuLCBpbmRlbnQsIHRyaWdnZXIsIGljb25PcGVuLCBpY29uQ2xvc2UgfSA9IHRoaXMudHJlZU9wdHNcclxuICAgICAgICBsZXQgcm93Q2hpbGRyZW4gPSByb3dbY2hpbGRyZW5dXHJcbiAgICAgICAgbGV0IGlzQWNlaXZlZCA9IGZhbHNlXHJcbiAgICAgICAgbGV0IG9uOiBhbnkgPSB7fVxyXG4gICAgICAgIGlmICghaXNIaWRkZW4pIHtcclxuICAgICAgICAgIGlzQWNlaXZlZCA9IHJvdy5fWF9FWFBBTkRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0cmlnZ2VyIHx8IHRyaWdnZXIgPT09ICdkZWZhdWx0Jykge1xyXG4gICAgICAgICAgb24uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZVRyZWVFeHBhbmQocm93KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICBjbGFzczogWyd2eGUtY2VsbC0tdHJlZS1ub2RlJywge1xyXG4gICAgICAgICAgICAgICdpcy0tYWN0aXZlJzogaXNBY2VpdmVkXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgIHBhZGRpbmdMZWZ0OiBgJHtyb3cuX1hfTEVWRUwgKiBpbmRlbnR9cHhgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgcm93Q2hpbGRyZW4gJiYgcm93Q2hpbGRyZW4ubGVuZ3RoID8gW1xyXG4gICAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtLWJ0bi13cmFwcGVyJyxcclxuICAgICAgICAgICAgICAgIG9uXHJcbiAgICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgaCgnaScsIHtcclxuICAgICAgICAgICAgICAgICAgY2xhc3M6IFsndnhlLXRyZWUtLW5vZGUtYnRuJywgaXNBY2VpdmVkID8gKGljb25PcGVuIHx8IEdsb2JhbENvbmZpZy5pY29uLlRBQkxFX1RSRUVfT1BFTikgOiAoaWNvbkNsb3NlIHx8IEdsb2JhbENvbmZpZy5pY29uLlRBQkxFX1RSRUVfQ0xPU0UpXVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICBdIDogbnVsbCxcclxuICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtY2VsbCdcclxuICAgICAgICAgICAgfSwgY2VsbFZOb2RlcylcclxuICAgICAgICAgIF0pXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICBfbG9hZFRyZWVEYXRhICh0aGlzOiBhbnksIGRhdGE6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHNlbGVjdFJvdyA9IHRoaXMuZ2V0UmFkaW9SZWNvcmQoKVxyXG4gICAgICAgIHJldHVybiB0aGlzLiRuZXh0VGljaygpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLiRyZWZzLnhUYWJsZS5sb2FkRGF0YShkYXRhKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdFJvdykge1xyXG4gICAgICAgICAgICAgIHRoaXMuc2V0UmFkaW9Sb3coc2VsZWN0Um93KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICBsb2FkRGF0YSAoZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRvVmlydHVhbFRyZWUoZGF0YSkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbG9hZERhdGEgKHRoaXM6IGFueSwgZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJG5leHRUaWNrKClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuJHJlZnMueFRhYmxlLnJlbG9hZERhdGEodGhpcy50b1ZpcnR1YWxUcmVlKGRhdGEpKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQoKSlcclxuICAgICAgfSxcclxuICAgICAgaXNUcmVlRXhwYW5kQnlSb3cgKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuICEhcm93Ll9YX0VYUEFORFxyXG4gICAgICB9LFxyXG4gICAgICBzZXRUcmVlRXhwYW5zaW9uIChyb3dzOiBhbnksIGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXRUcmVlRXhwYW5kKHJvd3MsIGV4cGFuZGVkKVxyXG4gICAgICB9LFxyXG4gICAgICBzZXRUcmVlRXhwYW5kICh0aGlzOiBhbnksIHJvd3M6IGFueSwgZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIGlmIChyb3dzKSB7XHJcbiAgICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyb3dzKSkge1xyXG4gICAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByb3dzLmZvckVhY2goKHJvdzogYW55KSA9PiB0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhIWV4cGFuZGVkKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRhYmxlRGF0YSlcclxuICAgICAgfSxcclxuICAgICAgc2V0QWxsVHJlZUV4cGFuc2lvbiAoZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNldEFsbFRyZWVFeHBhbmQoZXhwYW5kZWQpXHJcbiAgICAgIH0sXHJcbiAgICAgIHNldEFsbFRyZWVFeHBhbmQgKGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFRyZWVEYXRhKHRoaXMudmlydHVhbEFsbEV4cGFuZChleHBhbmRlZCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHRvZ2dsZVRyZWVFeHBhbnNpb24gKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudG9nZ2xlVHJlZUV4cGFuZChyb3cpXHJcbiAgICAgIH0sXHJcbiAgICAgIHRvZ2dsZVRyZWVFeHBhbmQgKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhcm93Ll9YX0VYUEFORCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldFRyZWVFeHBhbmRSZWNvcmRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBoYXNDaGlsZHMgPSB0aGlzLmhhc0NoaWxkc1xyXG4gICAgICAgIGNvbnN0IHRyZWVFeHBhbmRSZWNvcmRzOiBhbnlbXSA9IFtdXHJcbiAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0aGlzLmZ1bGxUcmVlRGF0YSwgcm93ID0+IHtcclxuICAgICAgICAgIGlmIChyb3cuX1hfRVhQQU5EICYmIGhhc0NoaWxkcyhyb3cpKSB7XHJcbiAgICAgICAgICAgIHRyZWVFeHBhbmRSZWNvcmRzLnB1c2gocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMudHJlZU9wdHMpXHJcbiAgICAgICAgcmV0dXJuIHRyZWVFeHBhbmRSZWNvcmRzXHJcbiAgICAgIH0sXHJcbiAgICAgIGNsZWFyVHJlZUV4cGFuZCAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWxsVHJlZUV4cGFuZChmYWxzZSlcclxuICAgICAgfSxcclxuICAgICAgaGFuZGxlQ29sdW1ucyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1ucy5tYXAoKGNvbmY6IGFueSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGNvbmYudHJlZU5vZGUpIHtcclxuICAgICAgICAgICAgbGV0IHNsb3RzID0gY29uZi5zbG90cyB8fCB7fVxyXG4gICAgICAgICAgICBzbG90cy5pY29uID0gdGhpcy5yZW5kZXJUcmVlSWNvblxyXG4gICAgICAgICAgICBzbG90cy5saW5lID0gdGhpcy5yZW5kZXJUcmVlTGluZVxyXG4gICAgICAgICAgICBjb25mLnNsb3RzID0gc2xvdHNcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBjb25mXHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgaGFzQ2hpbGRzICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgY2hpbGRMaXN0ID0gcm93W3RoaXMudHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgICAgICAgcmV0dXJuIGNoaWxkTGlzdCAmJiBjaGlsZExpc3QubGVuZ3RoXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDojrflj5booajmoLzmlbDmja7pm4bvvIzljIXlkKvmlrDlop7jgIHliKDpmaTjgIHkv67mlLlcclxuICAgICAgICovXHJcbiAgICAgIGdldFJlY29yZHNldCAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGluc2VydFJlY29yZHM6IHRoaXMuZ2V0SW5zZXJ0UmVjb3JkcygpLFxyXG4gICAgICAgICAgcmVtb3ZlUmVjb3JkczogdGhpcy5nZXRSZW1vdmVSZWNvcmRzKCksXHJcbiAgICAgICAgICB1cGRhdGVSZWNvcmRzOiB0aGlzLmdldFVwZGF0ZVJlY29yZHMoKVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgaXNJbnNlcnRCeVJvdyAocm93OiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gISFyb3cuX1hfSU5TRVJUXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldEluc2VydFJlY29yZHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGluc2VydFJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgaWYgKHJvdy5fWF9JTlNFUlQpIHtcclxuICAgICAgICAgICAgaW5zZXJ0UmVjb3Jkcy5wdXNoKHJvdylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzLnRyZWVPcHRzKVxyXG4gICAgICAgIHJldHVybiBpbnNlcnRSZWNvcmRzXHJcbiAgICAgIH0sXHJcbiAgICAgIGluc2VydCAodGhpczogYW55LCByZWNvcmRzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbnNlcnRBdChyZWNvcmRzKVxyXG4gICAgICB9LFxyXG4gICAgICBpbnNlcnRBdCAodGhpczogYW55LCByZWNvcmRzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBmdWxsVHJlZURhdGEsIHRhYmxlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyZWNvcmRzKSkge1xyXG4gICAgICAgICAgcmVjb3JkcyA9IFtyZWNvcmRzXVxyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbmV3UmVjb3JkcyA9IHJlY29yZHMubWFwKChyZWNvcmQ6IGFueSkgPT4gdGhpcy5kZWZpbmVGaWVsZChPYmplY3QuYXNzaWduKHtcclxuICAgICAgICAgIF9YX0VYUEFORDogZmFsc2UsXHJcbiAgICAgICAgICBfWF9JTlNFUlQ6IHRydWUsXHJcbiAgICAgICAgICBfWF9MRVZFTDogMFxyXG4gICAgICAgIH0sIHJlY29yZCkpKVxyXG4gICAgICAgIGlmICghcm93KSB7XHJcbiAgICAgICAgICBmdWxsVHJlZURhdGEudW5zaGlmdC5hcHBseShmdWxsVHJlZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgICB0YWJsZURhdGEudW5zaGlmdC5hcHBseSh0YWJsZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmIChyb3cgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGZ1bGxUcmVlRGF0YS5wdXNoLmFwcGx5KGZ1bGxUcmVlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICAgICAgdGFibGVEYXRhLnB1c2guYXBwbHkodGFibGVEYXRhLCBuZXdSZWNvcmRzKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IG1hdGNoT2JqID0gWEVVdGlscy5maW5kVHJlZShmdWxsVHJlZURhdGEsIGl0ZW0gPT4gaXRlbSA9PT0gcm93LCB0cmVlT3B0cylcclxuICAgICAgICAgICAgaWYgKCFtYXRjaE9iaiB8fCBtYXRjaE9iai5pbmRleCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodCgndnhlLmVycm9yLnVuYWJsZUluc2VydCcpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCB7IGl0ZW1zLCBpbmRleCwgbm9kZXMgfTogYW55ID0gbWF0Y2hPYmpcclxuICAgICAgICAgICAgbGV0IHJvd0luZGV4ID0gdGFibGVEYXRhLmluZGV4T2Yocm93KVxyXG4gICAgICAgICAgICBpZiAocm93SW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgIHRhYmxlRGF0YS5zcGxpY2UuYXBwbHkodGFibGVEYXRhLCBbcm93SW5kZXgsIDBdLmNvbmNhdChuZXdSZWNvcmRzKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpdGVtcy5zcGxpY2UuYXBwbHkoaXRlbXMsIFtpbmRleCwgMF0uY29uY2F0KG5ld1JlY29yZHMpKVxyXG4gICAgICAgICAgICBuZXdSZWNvcmRzLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgIGl0ZW0uX1hfTEVWRUwgPSBub2Rlcy5sZW5ndGggLSAxXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGFibGVEYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJvdzogbmV3UmVjb3Jkcy5sZW5ndGggPyBuZXdSZWNvcmRzW25ld1JlY29yZHMubGVuZ3RoIC0gMV0gOiBudWxsLFxyXG4gICAgICAgICAgICByb3dzOiBuZXdSZWNvcmRzXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOiOt+WPluW3suWIoOmZpOeahOaVsOaNrlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0UmVtb3ZlUmVjb3JkcyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdFxyXG4gICAgICB9LFxyXG4gICAgICByZW1vdmVTZWxlY3RlZHMgKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZUNoZWNrYm94Um93KClcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWIoOmZpOmAieS4reaVsOaNrlxyXG4gICAgICAgKi9cclxuICAgICAgcmVtb3ZlQ2hlY2tib3hSb3cgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZSh0aGlzLmdldFNlbGVjdFJlY29yZHMoKSkudGhlbigocGFyYW1zOiBhbnkpID0+IHtcclxuICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3Rpb24oKVxyXG4gICAgICAgICAgcmV0dXJuIHBhcmFtc1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbW92ZSAodGhpczogYW55LCByb3dzOiBhbnlbXSkge1xyXG4gICAgICAgIGNvbnN0IHsgcmVtb3ZlTGlzdCwgZnVsbFRyZWVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGxldCByZXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgaWYgKCFyb3dzKSB7XHJcbiAgICAgICAgICByb3dzID0gZnVsbFRyZWVEYXRhXHJcbiAgICAgICAgfSBlbHNlIGlmICghWEVVdGlscy5pc0FycmF5KHJvd3MpKSB7XHJcbiAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJvd3MuZm9yRWFjaCgocm93OiBhbnkpID0+IHtcclxuICAgICAgICAgIGxldCBtYXRjaE9iaiA9IFhFVXRpbHMuZmluZFRyZWUoZnVsbFRyZWVEYXRhLCBpdGVtID0+IGl0ZW0gPT09IHJvdywgdHJlZU9wdHMpXHJcbiAgICAgICAgICBpZiAobWF0Y2hPYmopIHtcclxuICAgICAgICAgICAgY29uc3QgeyBpdGVtLCBpdGVtcywgaW5kZXgsIHBhcmVudCB9OiBhbnkgPSBtYXRjaE9ialxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbnNlcnRCeVJvdyhyb3cpKSB7XHJcbiAgICAgICAgICAgICAgcmVtb3ZlTGlzdC5wdXNoKHJvdylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgbGV0IGlzRXhwYW5kID0gdGhpcy5pc1RyZWVFeHBhbmRCeVJvdyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocGFyZW50KVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpdGVtcy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUV4cGFuZGluZyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29sbGFwc2luZyhpdGVtKVxyXG4gICAgICAgICAgICAgIGl0ZW1zLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgICB0aGlzLnRhYmxlRGF0YS5zcGxpY2UodGhpcy50YWJsZURhdGEuaW5kZXhPZihpdGVtKSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGhpcy50YWJsZURhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHsgcm93OiByZXN0Lmxlbmd0aCA/IHJlc3RbcmVzdC5sZW5ndGggLSAxXSA6IG51bGwsIHJvd3M6IHJlc3QgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDlpITnkIbpu5jorqTlsZXlvIDmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIGhhbmRsZURlZmF1bHRUcmVlRXhwYW5kICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBsZXQgeyB0cmVlQ29uZmlnLCB0cmVlT3B0cywgdGFibGVGdWxsRGF0YSB9ID0gdGhpc1xyXG4gICAgICAgIGlmICh0cmVlQ29uZmlnKSB7XHJcbiAgICAgICAgICBsZXQgeyBjaGlsZHJlbiwgZXhwYW5kQWxsLCBleHBhbmRSb3dLZXlzIH0gPSB0cmVlT3B0c1xyXG4gICAgICAgICAgaWYgKGV4cGFuZEFsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEFsbFRyZWVFeHBhbmQodHJ1ZSlcclxuICAgICAgICAgIH0gZWxzZSBpZiAoZXhwYW5kUm93S2V5cykge1xyXG4gICAgICAgICAgICBsZXQgcm93a2V5ID0gdGhpcy5yb3dJZFxyXG4gICAgICAgICAgICBleHBhbmRSb3dLZXlzLmZvckVhY2goKHJvd2lkOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKHRhYmxlRnVsbERhdGEsIGl0ZW0gPT4gcm93aWQgPT09IFhFVXRpbHMuZ2V0KGl0ZW0sIHJvd2tleSksIHRyZWVPcHRzKVxyXG4gICAgICAgICAgICAgIGxldCByb3dDaGlsZHJlbiA9IG1hdGNoT2JqID8gbWF0Y2hPYmouaXRlbVtjaGlsZHJlbl0gOiAwXHJcbiAgICAgICAgICAgICAgaWYgKHJvd0NoaWxkcmVuICYmIHJvd0NoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRUcmVlRXhwYW5kKG1hdGNoT2JqLml0ZW0sIHRydWUpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWumuS5ieagkeWxnuaAp1xyXG4gICAgICAgKi9cclxuICAgICAgdG9WaXJ0dWFsVHJlZSAodGhpczogYW55LCB0cmVlRGF0YTogYW55W10pIHtcclxuICAgICAgICBsZXQgZnVsbFRyZWVSb3dNYXAgPSB0aGlzLmZ1bGxUcmVlUm93TWFwXHJcbiAgICAgICAgZnVsbFRyZWVSb3dNYXAuY2xlYXIoKVxyXG4gICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodHJlZURhdGEsIChpdGVtLCBpbmRleCwgaXRlbXMsIHBhdGhzLCBwYXJlbnQsIG5vZGVzKSA9PiB7XHJcbiAgICAgICAgICBpdGVtLl9YX0VYUEFORCA9IGZhbHNlXHJcbiAgICAgICAgICBpdGVtLl9YX0lOU0VSVCA9IGZhbHNlXHJcbiAgICAgICAgICBpdGVtLl9YX0xFVkVMID0gbm9kZXMubGVuZ3RoIC0gMVxyXG4gICAgICAgICAgZnVsbFRyZWVSb3dNYXAuc2V0KGl0ZW0sIHsgaXRlbSwgaW5kZXgsIGl0ZW1zLCBwYXRocywgcGFyZW50LCBub2RlcyB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5mdWxsVHJlZURhdGEgPSB0cmVlRGF0YS5zbGljZSgwKVxyXG4gICAgICAgIHRoaXMudGFibGVEYXRhID0gdHJlZURhdGEuc2xpY2UoMClcclxuICAgICAgICByZXR1cm4gdHJlZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxFeHBhbmQgKHRoaXM6IGFueSwgcm93OiBhbnksIGV4cGFuZGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHJvdy5fWF9FWFBBTkQgIT09IGV4cGFuZGVkKSB7XHJcbiAgICAgICAgICBpZiAocm93Ll9YX0VYUEFORCkge1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocm93KVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5oYW5kbGVFeHBhbmRpbmcocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLy8g5bGV5byA6IqC54K5XHJcbiAgICAgIGhhbmRsZUV4cGFuZGluZyAodGhpczogYW55LCByb3c6IGFueSkge1xyXG4gICAgICAgIGlmICh0aGlzLmhhc0NoaWxkcyhyb3cpKSB7XHJcbiAgICAgICAgICBjb25zdCB7IHRhYmxlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICAgIGxldCBjaGlsZFJvd3MgPSByb3dbdHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgICAgICAgICBsZXQgZXhwYW5kTGlzdDogYW55W10gPSBbXVxyXG4gICAgICAgICAgbGV0IHJvd0luZGV4ID0gdGFibGVEYXRhLmluZGV4T2Yocm93KVxyXG4gICAgICAgICAgaWYgKHJvd0luZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mUmeivr+eahOaTjeS9nO+8gScpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKGNoaWxkUm93cywgKGl0ZW0sIGluZGV4LCBvYmosIHBhdGhzLCBwYXJlbnQsIG5vZGVzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghcGFyZW50IHx8IHBhcmVudC5fWF9FWFBBTkQpIHtcclxuICAgICAgICAgICAgICBleHBhbmRMaXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gdHJ1ZVxyXG4gICAgICAgICAgdGFibGVEYXRhLnNwbGljZS5hcHBseSh0YWJsZURhdGEsIFtyb3dJbmRleCArIDEsIDBdLmNvbmNhdChleHBhbmRMaXN0KSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGFibGVEYXRhXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIOaUtui1t+iKgueCuVxyXG4gICAgICBoYW5kbGVDb2xsYXBzaW5nICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgIGNvbnN0IHsgdGFibGVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgICAgbGV0IGNoaWxkUm93cyA9IHJvd1t0cmVlT3B0cy5jaGlsZHJlbl1cclxuICAgICAgICAgIGxldCBub2RlQ2hpbGRMaXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKGNoaWxkUm93cywgaXRlbSA9PiB7XHJcbiAgICAgICAgICAgIG5vZGVDaGlsZExpc3QucHVzaChpdGVtKVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gZmFsc2VcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGFibGVEYXRhLmZpbHRlcigoaXRlbTogYW55KSA9PiBub2RlQ2hpbGRMaXN0LmluZGV4T2YoaXRlbSkgPT09IC0xKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmiYDmnInmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxBbGxFeHBhbmQgKHRoaXM6IGFueSwgZXhwYW5kZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAoZXhwYW5kZWQpIHtcclxuICAgICAgICAgIGNvbnN0IHRhYmxlTGlzdDogYW55W10gPSBbXVxyXG4gICAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0aGlzLmZ1bGxUcmVlRGF0YSwgcm93ID0+IHtcclxuICAgICAgICAgICAgcm93Ll9YX0VYUEFORCA9IGV4cGFuZGVkXHJcbiAgICAgICAgICAgIHRhYmxlTGlzdC5wdXNoKHJvdylcclxuICAgICAgICAgIH0sIHRoaXMudHJlZU9wdHMpXHJcbiAgICAgICAgICB0aGlzLnRhYmxlRGF0YSA9IHRhYmxlTGlzdFxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgICByb3cuX1hfRVhQQU5EID0gZXhwYW5kZWRcclxuICAgICAgICAgIH0sIHRoaXMudHJlZU9wdHMpXHJcbiAgICAgICAgICB0aGlzLnRhYmxlRGF0YSA9IHRoaXMuZnVsbFRyZWVEYXRhLnNsaWNlKDApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBWdWUuY29tcG9uZW50KFZpcnR1YWxUcmVlLm5hbWUsIFZpcnR1YWxUcmVlKVxyXG59XHJcblxyXG4vKipcclxuICog5Z+65LqOIHZ4ZS10YWJsZSDooajmoLznmoTlop7lvLrmj5Lku7bvvIzlrp7njrDnroDljZXnmoTomZrmi5/moJHooajmoLxcclxuICovXHJcbmV4cG9ydCBjb25zdCBWWEVUYWJsZVBsdWdpblZpcnR1YWxUcmVlID0ge1xyXG4gIGluc3RhbGwgKHh0YWJsZTogdHlwZW9mIFZYRVRhYmxlKSB7XHJcbiAgICAvLyDms6jlhoznu4Tku7ZcclxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KHh0YWJsZSlcclxuICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuVlhFVGFibGUpIHtcclxuICB3aW5kb3cuVlhFVGFibGUudXNlKFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUpXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWVcclxuIl19
