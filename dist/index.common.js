"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.VXETablePluginVirtualTree = void 0;

var _xeUtils = _interopRequireDefault(require("xe-utils/methods/xe-utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

        var tableProps = this.tableProps,
            vSize = this.vSize,
            maximize = this.maximize,
            treeConfig = this.treeConfig,
            treeOpts = this.treeOpts;
        return ['vxe-grid vxe-virtual-tree', (_ref2 = {}, _defineProperty(_ref2, "size--".concat(vSize), vSize), _defineProperty(_ref2, 't--animat', tableProps.optimization.animat), _defineProperty(_ref2, 'has--tree-line', treeConfig && treeOpts.line), _defineProperty(_ref2, 'is--maximize', maximize), _ref2)];
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
            return _this2.toggleTreeExpansion(row);
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
          "class": ['vxe-tree--node-btn', isAceived ? iconOpen || GlobalConfig.icon.treeOpen : iconClose || GlobalConfig.icon.treeClose]
        })])] : null, h('div', {
          "class": 'vxe-tree-cell'
        }, cellVNodes)])];
      },
      _loadTreeData: function _loadTreeData(data) {
        var _this3 = this;

        return this.$nextTick().then(function () {
          return _this3.$refs.xTable.loadData(data);
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
        return this._loadTreeData(this.virtualAllExpand(expanded));
      },
      toggleTreeExpansion: function toggleTreeExpansion(row) {
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
        return this.setAllTreeExpansion(false);
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
            this.setAllTreeExpansion(true);
          } else if (expandRowKeys) {
            var rowkey = this.rowId;
            expandRowKeys.forEach(function (rowid) {
              var matchObj = _xeUtils["default"].findTree(tableFullData, function (item) {
                return rowid === _xeUtils["default"].get(item, rowkey);
              }, treeOpts);

              var rowChildren = matchObj ? matchObj.item[children] : 0;

              if (rowChildren && rowChildren.length) {
                _this10.setTreeExpansion(matchObj.item, true);
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
        var _this11 = this;

        _xeUtils["default"].eachTree(this.fullTreeData, function (row) {
          _this11.virtualExpand(row, expanded);
        }, this.treeOpts);

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbImNvdW50VHJlZUV4cGFuZCIsIiR4VHJlZSIsInByZXZSb3ciLCJyb3dDaGlsZHJlbiIsInRyZWVPcHRzIiwiY2hpbGRyZW4iLCJjb3VudCIsImlzVHJlZUV4cGFuZEJ5Um93IiwiaW5kZXgiLCJsZW5ndGgiLCJnZXRPZmZzZXRTaXplIiwidlNpemUiLCJjYWxjVHJlZUxpbmUiLCIkdGFibGUiLCJtYXRjaE9iaiIsIml0ZW1zIiwiZXhwYW5kU2l6ZSIsInJvd0hlaWdodCIsInJlZ2lzdGVyQ29tcG9uZW50IiwiVnVlIiwiVGFibGUiLCJHcmlkIiwic2V0dXAiLCJ0IiwiR2xvYmFsQ29uZmlnIiwicHJvcEtleXMiLCJPYmplY3QiLCJrZXlzIiwicHJvcHMiLCJmaWx0ZXIiLCJuYW1lIiwiaW5kZXhPZiIsIlZpcnR1YWxUcmVlIiwiZGF0YSIsInJlbW92ZUxpc3QiLCJjb21wdXRlZCIsInNpemUiLCIkcGFyZW50IiwiYXNzaWduIiwiaGFzQ2hpbGQiLCJpbmRlbnQiLCJ0cmVlQ29uZmlnIiwicmVuZGVyQ2xhc3MiLCJ0YWJsZVByb3BzIiwibWF4aW1pemUiLCJvcHRpbWl6YXRpb24iLCJhbmltYXQiLCJsaW5lIiwidGFibGVFeHRlbmRQcm9wcyIsInJlc3QiLCJmb3JFYWNoIiwia2V5Iiwid2F0Y2giLCJjb2x1bW5zIiwibG9hZENvbHVtbiIsImhhbmRsZUNvbHVtbnMiLCJ2YWx1ZSIsImxvYWREYXRhIiwiY3JlYXRlZCIsImZ1bGxUcmVlRGF0YSIsInRhYmxlRGF0YSIsImZ1bGxUcmVlUm93TWFwIiwiTWFwIiwicmVsb2FkRGF0YSIsIm1ldGhvZHMiLCJyZW5kZXJUcmVlTGluZSIsInBhcmFtcyIsImgiLCJyb3ciLCJjb2x1bW4iLCJ0cmVlTm9kZSIsInJvd0xldmVsIiwiX1hfTEVWRUwiLCJnZXQiLCJzdHlsZSIsImhlaWdodCIsImxlZnQiLCJyZW5kZXJUcmVlSWNvbiIsImNlbGxWTm9kZXMiLCJpc0hpZGRlbiIsInRyaWdnZXIiLCJpY29uT3BlbiIsImljb25DbG9zZSIsImlzQWNlaXZlZCIsIm9uIiwiX1hfRVhQQU5EIiwiY2xpY2siLCJ0b2dnbGVUcmVlRXhwYW5zaW9uIiwicGFkZGluZ0xlZnQiLCJpY29uIiwidHJlZU9wZW4iLCJ0cmVlQ2xvc2UiLCJfbG9hZFRyZWVEYXRhIiwiJG5leHRUaWNrIiwidGhlbiIsIiRyZWZzIiwieFRhYmxlIiwidG9WaXJ0dWFsVHJlZSIsImhhbmRsZURlZmF1bHRUcmVlRXhwYW5kIiwic2V0VHJlZUV4cGFuc2lvbiIsInJvd3MiLCJleHBhbmRlZCIsIlhFVXRpbHMiLCJpc0FycmF5IiwidmlydHVhbEV4cGFuZCIsInNldEFsbFRyZWVFeHBhbnNpb24iLCJ2aXJ0dWFsQWxsRXhwYW5kIiwiZ2V0VHJlZUV4cGFuZFJlY29yZHMiLCJoYXNDaGlsZHMiLCJ0cmVlRXhwYW5kUmVjb3JkcyIsImVhY2hUcmVlIiwicHVzaCIsImNsZWFyVHJlZUV4cGFuZCIsIm1hcCIsImNvbmYiLCJzbG90cyIsImNoaWxkTGlzdCIsImdldFJlY29yZHNldCIsImluc2VydFJlY29yZHMiLCJnZXRJbnNlcnRSZWNvcmRzIiwicmVtb3ZlUmVjb3JkcyIsImdldFJlbW92ZVJlY29yZHMiLCJ1cGRhdGVSZWNvcmRzIiwiZ2V0VXBkYXRlUmVjb3JkcyIsImlzSW5zZXJ0QnlSb3ciLCJfWF9JTlNFUlQiLCJpbnNlcnQiLCJyZWNvcmRzIiwiaW5zZXJ0QXQiLCJuZXdSZWNvcmRzIiwicmVjb3JkIiwiZGVmaW5lRmllbGQiLCJ1bnNoaWZ0IiwiYXBwbHkiLCJmaW5kVHJlZSIsIml0ZW0iLCJFcnJvciIsIm5vZGVzIiwicm93SW5kZXgiLCJzcGxpY2UiLCJjb25jYXQiLCJyZW1vdmVTZWxlY3RlZHMiLCJyZW1vdmVDaGVja2JveFJvdyIsInJlbW92ZSIsImdldFNlbGVjdFJlY29yZHMiLCJjbGVhclNlbGVjdGlvbiIsInBhcmVudCIsImlzRXhwYW5kIiwiaGFuZGxlQ29sbGFwc2luZyIsImhhbmRsZUV4cGFuZGluZyIsInRhYmxlRnVsbERhdGEiLCJleHBhbmRBbGwiLCJleHBhbmRSb3dLZXlzIiwicm93a2V5Iiwicm93SWQiLCJyb3dpZCIsInRyZWVEYXRhIiwiY2xlYXIiLCJwYXRocyIsInNldCIsInNsaWNlIiwiY2hpbGRSb3dzIiwiZXhwYW5kTGlzdCIsIm9iaiIsIm5vZGVDaGlsZExpc3QiLCJjb21wb25lbnQiLCJWWEVUYWJsZVBsdWdpblZpcnR1YWxUcmVlIiwiaW5zdGFsbCIsInh0YWJsZSIsIndpbmRvdyIsIlZYRVRhYmxlIiwidXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7OztBQUdBLFNBQVNBLGVBQVQsQ0FBMEJDLE1BQTFCLEVBQXVDQyxPQUF2QyxFQUFtRDtBQUNqRCxNQUFNQyxXQUFXLEdBQUdELE9BQU8sQ0FBQ0QsTUFBTSxDQUFDRyxRQUFQLENBQWdCQyxRQUFqQixDQUEzQjtBQUNBLE1BQUlDLEtBQUssR0FBRyxDQUFaOztBQUNBLE1BQUlMLE1BQU0sQ0FBQ00saUJBQVAsQ0FBeUJMLE9BQXpCLENBQUosRUFBdUM7QUFDckMsU0FBSyxJQUFJTSxLQUFLLEdBQUcsQ0FBakIsRUFBb0JBLEtBQUssR0FBR0wsV0FBVyxDQUFDTSxNQUF4QyxFQUFnREQsS0FBSyxFQUFyRCxFQUF5RDtBQUN2REYsTUFBQUEsS0FBSyxJQUFJTixlQUFlLENBQUNDLE1BQUQsRUFBU0UsV0FBVyxDQUFDSyxLQUFELENBQXBCLENBQXhCO0FBQ0Q7QUFDRjs7QUFDRCxTQUFPRixLQUFQO0FBQ0Q7O0FBRUQsU0FBU0ksYUFBVCxDQUF3QlQsTUFBeEIsRUFBbUM7QUFDakMsVUFBUUEsTUFBTSxDQUFDVSxLQUFmO0FBQ0UsU0FBSyxNQUFMO0FBQ0UsYUFBTyxDQUFQOztBQUNGLFNBQUssT0FBTDtBQUNFLGFBQU8sQ0FBUDs7QUFDRixTQUFLLFFBQUw7QUFDRSxhQUFPLENBQVA7QUFOSjs7QUFRQSxTQUFPLENBQVA7QUFDRDs7QUFFRCxTQUFTQyxZQUFULENBQXVCQyxNQUF2QixFQUFvQ1osTUFBcEMsRUFBaURhLFFB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LE1BQUQsQ0FBakI7QUFDRDtBQUpzQyxDQUFsQzs7O0FBT1AsSUFBSSxPQUFPQyxNQUFQLEtBQWtCLFdBQWxCLElBQWlDQSxNQUFNLENBQUNDLFFBQTVDLEVBQXNEO0FBQ3BERCxFQUFBQSxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JDLEdBQWhCLENBQW9CTCx5QkFBcEI7QUFDRDs7ZUFFY0EseUIiLCJmaWxlIjoiaW5kZXguY29tbW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFhFVXRpbHMgZnJvbSAneGUtdXRpbHMvbWV0aG9kcy94ZS11dGlscydcclxuaW1wb3J0IFZYRVRhYmxlIGZyb20gJ3Z4ZS10YWJsZS9saWIvdnhlLXRhYmxlJ1xyXG5cclxuZnVuY3Rpb24gY291bnRUcmVlRXhwYW5kICgkeFRyZWU6IGFueSwgcHJldlJvdzogYW55KTogbnVtYmVyIHtcclxuICBjb25zdCByb3dDaGlsZHJlbiA9IHByZXZSb3dbJHhUcmVlLnRyZWVPcHRzLmNoaWxkcmVuXVxyXG4gIGxldCBjb3VudCA9IDFcclxuICBpZiAoJHhUcmVlLmlzVHJlZUV4cGFuZEJ5Um93KHByZXZSb3cpKSB7XHJcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcm93Q2hpbGRyZW4ubGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgIGNvdW50ICs9IGNvdW50VHJlZUV4cGFuZCgkeFRyZWUsIHJvd0NoaWxkcmVuW2luZGV4XSlcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGNvdW50XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE9mZnNldFNpemUgKCR4VHJlZTogYW55KTogbnVtYmVyIHtcclxuICBzd2l0Y2ggKCR4VHJlZS52U2l6ZSkge1xyXG4gICAgY2FzZSAnbWluaSc6XHJcbiAgICAgIHJldHVybiAzXHJcbiAgICBjYXNlICdzbWFsbCc6XHJcbiAgICAgIHJldHVybiAyXHJcbiAgICBjYXNlICdtZWRpdW0nOlxyXG4gICAgICByZXR1cm4gMVxyXG4gIH1cclxuICByZXR1cm4gMFxyXG59XHJcblxyXG5mdW5jdGlvbiBjYWxjVHJlZUxpbmUgKCR0YWJsZTogYW55LCAkeFRyZWU6IGFueSwgbWF0Y2hPYmo6IGFueSk6IG51bWJlciB7XHJcbiAgY29uc3QgeyBpbmRleCwgaXRlbXMgfSA9IG1hdGNoT2JqXHJcbiAgbGV0IGV4cGFuZFNpemUgPSAxXHJcbiAgaWYgKGluZGV4KSB7XHJcbiAgICBleHBhbmRTaXplID0gY291bnRUcmVlRXhwYW5kKCR4VHJlZSwgaXRlbXNbaW5kZXggLSAxXSlcclxuICB9XHJcbiAgcmV0dXJuICR0YWJsZS5yb3dIZWlnaHQgKiBleHBhbmRTaXplIC0gKGluZGV4ID8gMSA6ICgxMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSkpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50ICh7IFZ1ZSwgVGFibGUsIEdyaWQsIHNldHVwLCB0IH06IHR5cGVvZiBWWEVUYWJsZSkge1xyXG4gIGNvbnN0IEdsb2JhbENvbmZpZyA9IHNldHVwKClcclxuICBjb25zdCBwcm9wS2V5cyA9IE9iamVjdC5rZXlzKFRhYmxlLnByb3BzKS5maWx0ZXIobmFtZSA9PiBbJ2RhdGEnLCAndHJlZUNvbmZpZyddLmluZGV4T2YobmFtZSkgPT09IC0xKVxyXG5cclxuICBjb25zdCBWaXJ0dWFsVHJlZTogYW55ID0ge1xyXG4gICAgbmFtZTogJ1Z4ZVZpcnR1YWxUcmVlJyxcclxuICAgIGV4dGVuZHM6IEdyaWQsXHJcbiAgICBkYXRhICgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZW1vdmVMaXN0OiBbXVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY29tcHV0ZWQ6IHtcclxuICAgICAgdlNpemUgKHRoaXM6IGFueSk6IGFueSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZSB8fCB0aGlzLiRwYXJlbnQuc2l6ZSB8fCB0aGlzLiRwYXJlbnQudlNpemVcclxuICAgICAgfSxcclxuICAgICAgdHJlZU9wdHMgKHRoaXM6IGFueSk6IGFueSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICAgICAgY2hpbGRyZW46ICdjaGlsZHJlbicsXHJcbiAgICAgICAgICBoYXNDaGlsZDogJ2hhc0NoaWxkJyxcclxuICAgICAgICAgIGluZGVudDogMjBcclxuICAgICAgICB9LCBHbG9iYWxDb25maWcudHJlZUNvbmZpZywgdGhpcy50cmVlQ29uZmlnKVxyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJDbGFzcyAodGhpczogYW55KTogYW55IHtcclxuICAgICAgICBjb25zdCB7IHRhYmxlUHJvcHMsIHZTaXplLCBtYXhpbWl6ZSwgdHJlZUNvbmZpZywgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICByZXR1cm4gWyd2eGUtZ3JpZCB2eGUtdmlydHVhbC10cmVlJywge1xyXG4gICAgICAgICAgW2BzaXplLS0ke3ZTaXplfWBdOiB2U2l6ZSxcclxuICAgICAgICAgICd0LS1hbmltYXQnOiB0YWJsZVByb3BzLm9wdGltaXphdGlvbi5hbmltYXQsXHJcbiAgICAgICAgICAnaGFzLS10cmVlLWxpbmUnOiB0cmVlQ29uZmlnICYmIHRyZWVPcHRzLmxpbmUsXHJcbiAgICAgICAgICAnaXMtLW1heGltaXplJzogbWF4aW1pemVcclxuICAgICAgICB9XVxyXG4gICAgICB9LFxyXG4gICAgICB0YWJsZUV4dGVuZFByb3BzICh0aGlzOiBhbnkpOiBhbnkge1xyXG4gICAgICAgIGxldCByZXN0OiBhbnkgPSB7fVxyXG4gICAgICAgIHByb3BLZXlzLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgIHJlc3Rba2V5XSA9IHRoaXNba2V5XVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIHJlc3RcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHdhdGNoOiB7XHJcbiAgICAgIGNvbHVtbnMgKHRoaXM6IGFueSk6IGFueSB7XHJcbiAgICAgICAgdGhpcy5sb2FkQ29sdW1uKHRoaXMuaGFuZGxlQ29sdW1ucygpKVxyXG4gICAgICB9LFxyXG4gICAgICBkYXRhICh0aGlzOiBhbnksIHZhbHVlOiBhbnlbXSk6IGFueSB7XHJcbiAgICAgICAgdGhpcy5sb2FkRGF0YSh2YWx1ZSlcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNyZWF0ZWQgKHRoaXM6IGFueSk6IGFueSB7XHJcbiAgICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpc1xyXG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHtcclxuICAgICAgICBmdWxsVHJlZURhdGE6IFtdLFxyXG4gICAgICAgIHRhYmxlRGF0YTogW10sXHJcbiAgICAgICAgZnVsbFRyZWVSb3dNYXA6IG5ldyBNYXAoKVxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLmhhbmRsZUNvbHVtbnMoKVxyXG4gICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIHRoaXMucmVsb2FkRGF0YShkYXRhKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbWV0aG9kczoge1xyXG4gICAgICByZW5kZXJUcmVlTGluZSAodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyB0cmVlQ29uZmlnLCB0cmVlT3B0cywgZnVsbFRyZWVSb3dNYXAgfSA9IHRoaXNcclxuICAgICAgICBjb25zdCB7ICR0YWJsZSwgcm93LCBjb2x1bW4gfSA9IHBhcmFtc1xyXG4gICAgICAgIGNvbnN0IHsgdHJlZU5vZGUgfSA9IGNvbHVtblxyXG4gICAgICAgIGlmICh0cmVlTm9kZSAmJiB0cmVlQ29uZmlnICYmIHRyZWVPcHRzLmxpbmUpIHtcclxuICAgICAgICAgIGNvbnN0ICR4VHJlZSA9IHRoaXNcclxuICAgICAgICAgIGNvbnN0IHJvd0xldmVsID0gcm93Ll9YX0xFVkVMXHJcbiAgICAgICAgICBjb25zdCBtYXRjaE9iaiA9IGZ1bGxUcmVlUm93TWFwLmdldChyb3cpXHJcbiAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB0cmVlTm9kZSAmJiB0cmVlT3B0cy5saW5lID8gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtLWxpbmUtd3JhcHBlcidcclxuICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtLWxpbmUnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBgJHtjYWxjVHJlZUxpbmUoJHRhYmxlLCAkeFRyZWUsIG1hdGNoT2JqKX1weGAsXHJcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IGAke3Jvd0xldmVsICogKHRyZWVPcHRzLmluZGVudCB8fCAyMCkgKyAocm93TGV2ZWwgPyAyIC0gZ2V0T2Zmc2V0U2l6ZSgkeFRyZWUpIDogMCkgKyAxNn1weGBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBdKSA6IG51bGxcclxuICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFtdXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbmRlclRyZWVJY29uICh0aGlzOiBhbnksIHBhcmFtczogYW55LCBoOiBhbnksIGNlbGxWTm9kZXM6IGFueSkge1xyXG4gICAgICAgIGxldCB7IGlzSGlkZGVuIH0gPSBwYXJhbXNcclxuICAgICAgICBsZXQgeyByb3cgfSA9IHBhcmFtc1xyXG4gICAgICAgIGxldCB7IGNoaWxkcmVuLCBpbmRlbnQsIHRyaWdnZXIsIGljb25PcGVuLCBpY29uQ2xvc2UgfSA9IHRoaXMudHJlZU9wdHNcclxuICAgICAgICBsZXQgcm93Q2hpbGRyZW4gPSByb3dbY2hpbGRyZW5dXHJcbiAgICAgICAgbGV0IGlzQWNlaXZlZCA9IGZhbHNlXHJcbiAgICAgICAgbGV0IG9uOiBhbnkgPSB7fVxyXG4gICAgICAgIGlmICghaXNIaWRkZW4pIHtcclxuICAgICAgICAgIGlzQWNlaXZlZCA9IHJvdy5fWF9FWFBBTkRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0cmlnZ2VyIHx8IHRyaWdnZXIgPT09ICdkZWZhdWx0Jykge1xyXG4gICAgICAgICAgb24uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZVRyZWVFeHBhbnNpb24ocm93KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICBjbGFzczogWyd2eGUtY2VsbC0tdHJlZS1ub2RlJywge1xyXG4gICAgICAgICAgICAgICdpcy0tYWN0aXZlJzogaXNBY2VpdmVkXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgIHBhZGRpbmdMZWZ0OiBgJHtyb3cuX1hfTEVWRUwgKiBpbmRlbnR9cHhgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgcm93Q2hpbGRyZW4gJiYgcm93Q2hpbGRyZW4ubGVuZ3RoID8gW1xyXG4gICAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgIGNsYXNzOiAndnhlLXRyZWUtLWJ0bi13cmFwcGVyJyxcclxuICAgICAgICAgICAgICAgIG9uXHJcbiAgICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgaCgnaScsIHtcclxuICAgICAgICAgICAgICAgICAgY2xhc3M6IFsndnhlLXRyZWUtLW5vZGUtYnRuJywgaXNBY2VpdmVkID8gKGljb25PcGVuIHx8IEdsb2JhbENvbmZpZy5pY29uLnRyZWVPcGVuKSA6IChpY29uQ2xvc2UgfHwgR2xvYmFsQ29uZmlnLmljb24udHJlZUNsb3NlKV1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgXSA6IG51bGwsXHJcbiAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLWNlbGwnXHJcbiAgICAgICAgICAgIH0sIGNlbGxWTm9kZXMpXHJcbiAgICAgICAgICBdKVxyXG4gICAgICAgIF1cclxuICAgICAgfSxcclxuICAgICAgX2xvYWRUcmVlRGF0YSAodGhpczogYW55LCBkYXRhOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4kbmV4dFRpY2soKS50aGVuKCgpID0+IHRoaXMuJHJlZnMueFRhYmxlLmxvYWREYXRhKGRhdGEpKVxyXG4gICAgICB9LFxyXG4gICAgICBsb2FkRGF0YSAoZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRvVmlydHVhbFRyZWUoZGF0YSkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbG9hZERhdGEgKHRoaXM6IGFueSwgZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJG5leHRUaWNrKClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuJHJlZnMueFRhYmxlLnJlbG9hZERhdGEodGhpcy50b1ZpcnR1YWxUcmVlKGRhdGEpKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQoKSlcclxuICAgICAgfSxcclxuICAgICAgaXNUcmVlRXhwYW5kQnlSb3cgKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuICEhcm93Ll9YX0VYUEFORFxyXG4gICAgICB9LFxyXG4gICAgICBzZXRUcmVlRXhwYW5zaW9uICh0aGlzOiBhbnksIHJvd3M6IGFueSwgZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIGlmIChyb3dzKSB7XHJcbiAgICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyb3dzKSkge1xyXG4gICAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByb3dzLmZvckVhY2goKHJvdzogYW55KSA9PiB0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhIWV4cGFuZGVkKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRhYmxlRGF0YSlcclxuICAgICAgfSxcclxuICAgICAgc2V0QWxsVHJlZUV4cGFuc2lvbiAoZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGhpcy52aXJ0dWFsQWxsRXhwYW5kKGV4cGFuZGVkKSlcclxuICAgICAgfSxcclxuICAgICAgdG9nZ2xlVHJlZUV4cGFuc2lvbiAocm93OiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFRyZWVEYXRhKHRoaXMudmlydHVhbEV4cGFuZChyb3csICFyb3cuX1hfRVhQQU5EKSlcclxuICAgICAgfSxcclxuICAgICAgZ2V0VHJlZUV4cGFuZFJlY29yZHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGhhc0NoaWxkcyA9IHRoaXMuaGFzQ2hpbGRzXHJcbiAgICAgICAgY29uc3QgdHJlZUV4cGFuZFJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgaWYgKHJvdy5fWF9FWFBBTkQgJiYgaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgICAgdHJlZUV4cGFuZFJlY29yZHMucHVzaChyb3cpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcy50cmVlT3B0cylcclxuICAgICAgICByZXR1cm4gdHJlZUV4cGFuZFJlY29yZHNcclxuICAgICAgfSxcclxuICAgICAgY2xlYXJUcmVlRXhwYW5kICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXRBbGxUcmVlRXhwYW5zaW9uKGZhbHNlKVxyXG4gICAgICB9LFxyXG4gICAgICBoYW5kbGVDb2x1bW5zICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5zLm1hcCgoY29uZjogYW55KSA9PiB7XHJcbiAgICAgICAgICBpZiAoY29uZi50cmVlTm9kZSkge1xyXG4gICAgICAgICAgICBsZXQgc2xvdHMgPSBjb25mLnNsb3RzIHx8IHt9XHJcbiAgICAgICAgICAgIHNsb3RzLmljb24gPSB0aGlzLnJlbmRlclRyZWVJY29uXHJcbiAgICAgICAgICAgIHNsb3RzLmxpbmUgPSB0aGlzLnJlbmRlclRyZWVMaW5lXHJcbiAgICAgICAgICAgIGNvbmYuc2xvdHMgPSBzbG90c1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGNvbmZcclxuICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICBoYXNDaGlsZHMgKHRoaXM6IGFueSwgcm93OiBhbnkpIHtcclxuICAgICAgICBjb25zdCBjaGlsZExpc3QgPSByb3dbdGhpcy50cmVlT3B0cy5jaGlsZHJlbl1cclxuICAgICAgICByZXR1cm4gY2hpbGRMaXN0ICYmIGNoaWxkTGlzdC5sZW5ndGhcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOiOt+WPluihqOagvOaVsOaNrumbhu+8jOWMheWQq+aWsOWinuOAgeWIoOmZpOOAgeS/ruaUuVxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0UmVjb3Jkc2V0ICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaW5zZXJ0UmVjb3JkczogdGhpcy5nZXRJbnNlcnRSZWNvcmRzKCksXHJcbiAgICAgICAgICByZW1vdmVSZWNvcmRzOiB0aGlzLmdldFJlbW92ZVJlY29yZHMoKSxcclxuICAgICAgICAgIHVwZGF0ZVJlY29yZHM6IHRoaXMuZ2V0VXBkYXRlUmVjb3JkcygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBpc0luc2VydEJ5Um93IChyb3c6IGFueSkge1xyXG4gICAgICAgIHJldHVybiAhIXJvdy5fWF9JTlNFUlRcclxuICAgICAgfSxcclxuICAgICAgZ2V0SW5zZXJ0UmVjb3JkcyAodGhpczogYW55KSB7XHJcbiAgICAgICAgY29uc3QgaW5zZXJ0UmVjb3JkczogYW55W10gPSBbXVxyXG4gICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICBpZiAocm93Ll9YX0lOU0VSVCkge1xyXG4gICAgICAgICAgICBpbnNlcnRSZWNvcmRzLnB1c2gocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMudHJlZU9wdHMpXHJcbiAgICAgICAgcmV0dXJuIGluc2VydFJlY29yZHNcclxuICAgICAgfSxcclxuICAgICAgaW5zZXJ0ICh0aGlzOiBhbnksIHJlY29yZHM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmluc2VydEF0KHJlY29yZHMpXHJcbiAgICAgIH0sXHJcbiAgICAgIGluc2VydEF0ICh0aGlzOiBhbnksIHJlY29yZHM6IGFueSwgcm93OiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7IGZ1bGxUcmVlRGF0YSwgdGFibGVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGlmICghWEVVdGlscy5pc0FycmF5KHJlY29yZHMpKSB7XHJcbiAgICAgICAgICByZWNvcmRzID0gW3JlY29yZHNdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBuZXdSZWNvcmRzID0gcmVjb3Jkcy5tYXAoKHJlY29yZDogYW55KSA9PiB0aGlzLmRlZmluZUZpZWxkKE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICAgICAgX1hfRVhQQU5EOiBmYWxzZSxcclxuICAgICAgICAgIF9YX0lOU0VSVDogdHJ1ZSxcclxuICAgICAgICAgIF9YX0xFVkVMOiAwXHJcbiAgICAgICAgfSwgcmVjb3JkKSkpXHJcbiAgICAgICAgaWYgKCFyb3cpIHtcclxuICAgICAgICAgIGZ1bGxUcmVlRGF0YS51bnNoaWZ0LmFwcGx5KGZ1bGxUcmVlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICAgIHRhYmxlRGF0YS51bnNoaWZ0LmFwcGx5KHRhYmxlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHJvdyA9PT0gLTEpIHtcclxuICAgICAgICAgICAgZnVsbFRyZWVEYXRhLnB1c2guYXBwbHkoZnVsbFRyZWVEYXRhLCBuZXdSZWNvcmRzKVxyXG4gICAgICAgICAgICB0YWJsZURhdGEucHVzaC5hcHBseSh0YWJsZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKGZ1bGxUcmVlRGF0YSwgaXRlbSA9PiBpdGVtID09PSByb3csIHRyZWVPcHRzKVxyXG4gICAgICAgICAgICBpZiAoIW1hdGNoT2JqIHx8IG1hdGNoT2JqLmluZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcih0KCd2eGUuZXJyb3IudW5hYmxlSW5zZXJ0JykpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IHsgaXRlbXMsIGluZGV4LCBub2RlcyB9OiBhbnkgPSBtYXRjaE9ialxyXG4gICAgICAgICAgICBsZXQgcm93SW5kZXggPSB0YWJsZURhdGEuaW5kZXhPZihyb3cpXHJcbiAgICAgICAgICAgIGlmIChyb3dJbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgdGFibGVEYXRhLnNwbGljZS5hcHBseSh0YWJsZURhdGEsIFtyb3dJbmRleCwgMF0uY29uY2F0KG5ld1JlY29yZHMpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGl0ZW1zLnNwbGljZS5hcHBseShpdGVtcywgW2luZGV4LCAwXS5jb25jYXQobmV3UmVjb3JkcykpXHJcbiAgICAgICAgICAgIG5ld1JlY29yZHMuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgaXRlbS5fWF9MRVZFTCA9IG5vZGVzLmxlbmd0aCAtIDFcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0YWJsZURhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcm93OiBuZXdSZWNvcmRzLmxlbmd0aCA/IG5ld1JlY29yZHNbbmV3UmVjb3Jkcy5sZW5ndGggLSAxXSA6IG51bGwsXHJcbiAgICAgICAgICAgIHJvd3M6IG5ld1JlY29yZHNcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog6I635Y+W5bey5Yig6Zmk55qE5pWw5o2uXHJcbiAgICAgICAqL1xyXG4gICAgICBnZXRSZW1vdmVSZWNvcmRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmVMaXN0XHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbW92ZVNlbGVjdGVkcyAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlQ2hlY2tib3hSb3coKVxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog5Yig6Zmk6YCJ5Lit5pWw5o2uXHJcbiAgICAgICAqL1xyXG4gICAgICByZW1vdmVDaGVja2JveFJvdyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlKHRoaXMuZ2V0U2VsZWN0UmVjb3JkcygpKS50aGVuKChwYXJhbXM6IGFueSkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jbGVhclNlbGVjdGlvbigpXHJcbiAgICAgICAgICByZXR1cm4gcGFyYW1zXHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgcmVtb3ZlICh0aGlzOiBhbnksIHJvd3M6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHsgcmVtb3ZlTGlzdCwgZnVsbFRyZWVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGxldCByZXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgaWYgKCFyb3dzKSB7XHJcbiAgICAgICAgICByb3dzID0gZnVsbFRyZWVEYXRhXHJcbiAgICAgICAgfSBlbHNlIGlmICghWEVVdGlscy5pc0FycmF5KHJvd3MpKSB7XHJcbiAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJvd3MuZm9yRWFjaCgocm93OiBhbnkpID0+IHtcclxuICAgICAgICAgIGxldCBtYXRjaE9iaiA9IFhFVXRpbHMuZmluZFRyZWUoZnVsbFRyZWVEYXRhLCBpdGVtID0+IGl0ZW0gPT09IHJvdywgdHJlZU9wdHMpXHJcbiAgICAgICAgICBpZiAobWF0Y2hPYmopIHtcclxuICAgICAgICAgICAgY29uc3QgeyBpdGVtLCBpdGVtcywgaW5kZXgsIHBhcmVudCB9OiBhbnkgPSBtYXRjaE9ialxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbnNlcnRCeVJvdyhyb3cpKSB7XHJcbiAgICAgICAgICAgICAgcmVtb3ZlTGlzdC5wdXNoKHJvdylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgbGV0IGlzRXhwYW5kID0gdGhpcy5pc1RyZWVFeHBhbmRCeVJvdyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocGFyZW50KVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpdGVtcy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUV4cGFuZGluZyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29sbGFwc2luZyhpdGVtKVxyXG4gICAgICAgICAgICAgIGl0ZW1zLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgICB0aGlzLnRhYmxlRGF0YS5zcGxpY2UodGhpcy50YWJsZURhdGEuaW5kZXhPZihpdGVtKSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGhpcy50YWJsZURhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHsgcm93OiByZXN0Lmxlbmd0aCA/IHJlc3RbcmVzdC5sZW5ndGggLSAxXSA6IG51bGwsIHJvd3M6IHJlc3QgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDlpITnkIbpu5jorqTlsZXlvIDmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIGhhbmRsZURlZmF1bHRUcmVlRXhwYW5kICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBsZXQgeyB0cmVlQ29uZmlnLCB0cmVlT3B0cywgdGFibGVGdWxsRGF0YSB9ID0gdGhpc1xyXG4gICAgICAgIGlmICh0cmVlQ29uZmlnKSB7XHJcbiAgICAgICAgICBsZXQgeyBjaGlsZHJlbiwgZXhwYW5kQWxsLCBleHBhbmRSb3dLZXlzIH0gPSB0cmVlT3B0c1xyXG4gICAgICAgICAgaWYgKGV4cGFuZEFsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEFsbFRyZWVFeHBhbnNpb24odHJ1ZSlcclxuICAgICAgICAgIH0gZWxzZSBpZiAoZXhwYW5kUm93S2V5cykge1xyXG4gICAgICAgICAgICBsZXQgcm93a2V5ID0gdGhpcy5yb3dJZFxyXG4gICAgICAgICAgICBleHBhbmRSb3dLZXlzLmZvckVhY2goKHJvd2lkOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKHRhYmxlRnVsbERhdGEsIGl0ZW0gPT4gcm93aWQgPT09IFhFVXRpbHMuZ2V0KGl0ZW0sIHJvd2tleSksIHRyZWVPcHRzKVxyXG4gICAgICAgICAgICAgIGxldCByb3dDaGlsZHJlbiA9IG1hdGNoT2JqID8gbWF0Y2hPYmouaXRlbVtjaGlsZHJlbl0gOiAwXHJcbiAgICAgICAgICAgICAgaWYgKHJvd0NoaWxkcmVuICYmIHJvd0NoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRUcmVlRXhwYW5zaW9uKG1hdGNoT2JqLml0ZW0sIHRydWUpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWumuS5ieagkeWxnuaAp1xyXG4gICAgICAgKi9cclxuICAgICAgdG9WaXJ0dWFsVHJlZSAodGhpczogYW55LCB0cmVlRGF0YTogYW55W10pIHtcclxuICAgICAgICBsZXQgZnVsbFRyZWVSb3dNYXAgPSB0aGlzLmZ1bGxUcmVlUm93TWFwXHJcbiAgICAgICAgZnVsbFRyZWVSb3dNYXAuY2xlYXIoKVxyXG4gICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodHJlZURhdGEsIChpdGVtLCBpbmRleCwgaXRlbXMsIHBhdGhzLCBwYXJlbnQsIG5vZGVzKSA9PiB7XHJcbiAgICAgICAgICBpdGVtLl9YX0VYUEFORCA9IGZhbHNlXHJcbiAgICAgICAgICBpdGVtLl9YX0lOU0VSVCA9IGZhbHNlXHJcbiAgICAgICAgICBpdGVtLl9YX0xFVkVMID0gbm9kZXMubGVuZ3RoIC0gMVxyXG4gICAgICAgICAgZnVsbFRyZWVSb3dNYXAuc2V0KGl0ZW0sIHsgaXRlbSwgaW5kZXgsIGl0ZW1zLCBwYXRocywgcGFyZW50LCBub2RlcyB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5mdWxsVHJlZURhdGEgPSB0cmVlRGF0YS5zbGljZSgwKVxyXG4gICAgICAgIHRoaXMudGFibGVEYXRhID0gdHJlZURhdGEuc2xpY2UoMClcclxuICAgICAgICByZXR1cm4gdHJlZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxFeHBhbmQgKHRoaXM6IGFueSwgcm93OiBhbnksIGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICBpZiAocm93Ll9YX0VYUEFORCAhPT0gZXhwYW5kZWQpIHtcclxuICAgICAgICAgIGlmIChyb3cuX1hfRVhQQU5EKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29sbGFwc2luZyhyb3cpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUV4cGFuZGluZyhyb3cpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9LFxyXG4gICAgICAvLyDlsZXlvIDoioLngrlcclxuICAgICAgaGFuZGxlRXhwYW5kaW5nICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgIGNvbnN0IHsgdGFibGVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgICAgbGV0IGNoaWxkUm93cyA9IHJvd1t0cmVlT3B0cy5jaGlsZHJlbl1cclxuICAgICAgICAgIGxldCBleHBhbmRMaXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgICBsZXQgcm93SW5kZXggPSB0YWJsZURhdGEuaW5kZXhPZihyb3cpXHJcbiAgICAgICAgICBpZiAocm93SW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6ZSZ6K+v55qE5pON5L2c77yBJylcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUoY2hpbGRSb3dzLCAoaXRlbSwgaW5kZXgsIG9iaiwgcGF0aHMsIHBhcmVudCwgbm9kZXMpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFwYXJlbnQgfHwgcGFyZW50Ll9YX0VYUEFORCkge1xyXG4gICAgICAgICAgICAgIGV4cGFuZExpc3QucHVzaChpdGVtKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCB0cmVlT3B0cylcclxuICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSB0cnVlXHJcbiAgICAgICAgICB0YWJsZURhdGEuc3BsaWNlLmFwcGx5KHRhYmxlRGF0YSwgW3Jvd0luZGV4ICsgMSwgMF0uY29uY2F0KGV4cGFuZExpc3QpKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLy8g5pS26LW36IqC54K5XHJcbiAgICAgIGhhbmRsZUNvbGxhcHNpbmcgKHRoaXM6IGFueSwgcm93OiBhbnkpIHtcclxuICAgICAgICBpZiAodGhpcy5oYXNDaGlsZHMocm93KSkge1xyXG4gICAgICAgICAgY29uc3QgeyB0YWJsZURhdGEsIHRyZWVPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgICBsZXQgY2hpbGRSb3dzID0gcm93W3RyZWVPcHRzLmNoaWxkcmVuXVxyXG4gICAgICAgICAgbGV0IG5vZGVDaGlsZExpc3Q6IGFueVtdID0gW11cclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUoY2hpbGRSb3dzLCBpdGVtID0+IHtcclxuICAgICAgICAgICAgbm9kZUNoaWxkTGlzdC5wdXNoKGl0ZW0pXHJcbiAgICAgICAgICB9LCB0cmVlT3B0cylcclxuICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSBmYWxzZVxyXG4gICAgICAgICAgdGhpcy50YWJsZURhdGEgPSB0YWJsZURhdGEuZmlsdGVyKChpdGVtOiBhbnkpID0+IG5vZGVDaGlsZExpc3QuaW5kZXhPZihpdGVtKSA9PT0gLTEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog5bGV5byAL+aUtui1t+aJgOacieagkeiKgueCuVxyXG4gICAgICAgKi9cclxuICAgICAgdmlydHVhbEFsbEV4cGFuZCAodGhpczogYW55LCBleHBhbmRlZDogYW55KSB7XHJcbiAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0aGlzLmZ1bGxUcmVlRGF0YSwgcm93ID0+IHtcclxuICAgICAgICAgIHRoaXMudmlydHVhbEV4cGFuZChyb3csIGV4cGFuZGVkKVxyXG4gICAgICAgIH0sIHRoaXMudHJlZU9wdHMpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGFibGVEYXRhXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIFZ1ZS5jb21wb25lbnQoVmlydHVhbFRyZWUubmFtZSwgVmlydHVhbFRyZWUpXHJcbn1cclxuXHJcbi8qKlxyXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOWunueOsOeugOWNleeahOiZmuaLn+agkeihqOagvFxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUgPSB7XHJcbiAgaW5zdGFsbCAoeHRhYmxlOiB0eXBlb2YgVlhFVGFibGUpIHtcclxuICAgIC8vIOazqOWGjOe7hOS7tlxyXG4gICAgcmVnaXN0ZXJDb21wb25lbnQoeHRhYmxlKVxyXG4gIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSkge1xyXG4gIHdpbmRvdy5WWEVUYWJsZS51c2UoVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZSlcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZVxyXG4iXX0=
