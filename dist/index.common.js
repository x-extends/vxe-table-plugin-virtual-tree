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

      /**
       * 删除选中数据
       */
      removeSelecteds: function removeSelecteds() {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbImNvdW50VHJlZUV4cGFuZCIsIiR4VHJlZSIsInByZXZSb3ciLCJyb3dDaGlsZHJlbiIsInRyZWVPcHRzIiwiY2hpbGRyZW4iLCJjb3VudCIsImlzVHJlZUV4cGFuZEJ5Um93IiwiaW5kZXgiLCJsZW5ndGgiLCJnZXRPZmZzZXRTaXplIiwidlNpemUiLCJjYWxjVHJlZUxpbmUiLCIkdGFibGUiLCJtYXRjaE9iaiIsIml0ZW1zIiwiZXhwYW5kU2l6ZSIsInJvd0hlaWdodCIsInJlZ2lzdGVyQ29tcG9uZW50IiwiVnVlIiwiVGFibGUiLCJHcmlkIiwic2V0dXAiLCJ0IiwiR2xvYmFsQ29uZmlnIiwicHJvcEtleXMiLCJPYmplY3QiLCJrZXlzIiwicHJvcHMiLCJmaWx0ZXIiLCJuYW1lIiwiaW5kZXhPZiIsIlZpcnR1YWxUcmVlIiwiZGF0YSIsInJlbW92ZUxpc3QiLCJjb21wdXRlZCIsInNpemUiLCIkcGFyZW50IiwiYXNzaWduIiwiaGFzQ2hpbGQiLCJpbmRlbnQiLCJ0cmVlQ29uZmlnIiwicmVuZGVyQ2xhc3MiLCJ0YWJsZVByb3BzIiwibWF4aW1pemUiLCJvcHRpbWl6YXRpb24iLCJhbmltYXQiLCJsaW5lIiwidGFibGVFeHRlbmRQcm9wcyIsInJlc3QiLCJmb3JFYWNoIiwia2V5Iiwid2F0Y2giLCJjb2x1bW5zIiwibG9hZENvbHVtbiIsImhhbmRsZUNvbHVtbnMiLCJ2YWx1ZSIsImxvYWREYXRhIiwiY3JlYXRlZCIsImZ1bGxUcmVlRGF0YSIsInRhYmxlRGF0YSIsImZ1bGxUcmVlUm93TWFwIiwiTWFwIiwicmVsb2FkRGF0YSIsIm1ldGhvZHMiLCJyZW5kZXJUcmVlTGluZSIsInBhcmFtcyIsImgiLCJyb3ciLCJjb2x1bW4iLCJ0cmVlTm9kZSIsInJvd0xldmVsIiwiX1hfTEVWRUwiLCJnZXQiLCJzdHlsZSIsImhlaWdodCIsImxlZnQiLCJyZW5kZXJUcmVlSWNvbiIsImNlbGxWTm9kZXMiLCJpc0hpZGRlbiIsInRyaWdnZXIiLCJpY29uT3BlbiIsImljb25DbG9zZSIsImlzQWNlaXZlZCIsIm9uIiwiX1hfRVhQQU5EIiwiY2xpY2siLCJ0b2dnbGVUcmVlRXhwYW5zaW9uIiwicGFkZGluZ0xlZnQiLCJpY29uIiwidHJlZU9wZW4iLCJ0cmVlQ2xvc2UiLCJfbG9hZFRyZWVEYXRhIiwiJG5leHRUaWNrIiwidGhlbiIsIiRyZWZzIiwieFRhYmxlIiwidG9WaXJ0dWFsVHJlZSIsImhhbmRsZURlZmF1bHRUcmVlRXhwYW5kIiwic2V0VHJlZUV4cGFuc2lvbiIsInJvd3MiLCJleHBhbmRlZCIsIlhFVXRpbHMiLCJpc0FycmF5IiwidmlydHVhbEV4cGFuZCIsInNldEFsbFRyZWVFeHBhbnNpb24iLCJ2aXJ0dWFsQWxsRXhwYW5kIiwiZ2V0VHJlZUV4cGFuZFJlY29yZHMiLCJoYXNDaGlsZHMiLCJ0cmVlRXhwYW5kUmVjb3JkcyIsImVhY2hUcmVlIiwicHVzaCIsImNsZWFyVHJlZUV4cGFuZCIsIm1hcCIsImNvbmYiLCJzbG90cyIsImNoaWxkTGlzdCIsImdldFJlY29yZHNldCIsImluc2VydFJlY29yZHMiLCJnZXRJbnNlcnRSZWNvcmRzIiwicmVtb3ZlUmVjb3JkcyIsImdldFJlbW92ZVJlY29yZHMiLCJ1cGRhdGVSZWNvcmRzIiwiZ2V0VXBkYXRlUmVjb3JkcyIsImlzSW5zZXJ0QnlSb3ciLCJfWF9JTlNFUlQiLCJpbnNlcnQiLCJyZWNvcmRzIiwiaW5zZXJ0QXQiLCJuZXdSZWNvcmRzIiwicmVjb3JkIiwiZGVmaW5lRmllbGQiLCJ1bnNoaWZ0IiwiYXBwbHkiLCJmaW5kVHJlZSIsIml0ZW0iLCJFcnJvciIsIm5vZGVzIiwicm93SW5kZXgiLCJzcGxpY2UiLCJjb25jYXQiLCJyZW1vdmVTZWxlY3RlZHMiLCJyZW1vdmUiLCJnZXRTZWxlY3RSZWNvcmRzIiwiY2xlYXJTZWxlY3Rpb24iLCJwYXJlbnQiLCJpc0V4cGFuZCIsImhhbmRsZUNvbGxhcHNpbmciLCJoYW5kbGVFeHBhbmRpbmciLCJ0YWJsZUZ1bGxEYXRhIiwiZXhwYW5kQWxsIiwiZXhwYW5kUm93S2V5cyIsInJvd2tleSIsInJvd0lkIiwicm93aWQiLCJ0cmVlRGF0YSIsImNsZWFyIiwicGF0aHMiLCJzZXQiLCJzbGljZSIsImNoaWxkUm93cyIsImV4cGFuZExpc3QiLCJvYmoiLCJub2RlQ2hpbGRMaXN0IiwiY29tcG9uZW50IiwiVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZSIsImluc3RhbGwiLCJ4dGFibGUiLCJ3aW5kb3ciLCJWWEVUYWJsZSIsInVzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7Ozs7QUFHQSxTQUFTQSxlQUFULENBQTBCQyxNQUExQixFQUF1Q0MsT0FBdkMsRUFBbUQ7QUFDakQsTUFBTUMsV0FBVyxHQUFHRCxPQUFPLENBQUNELE1BQU0sQ0FBQ0csUUFBUCxDQUFnQkMsUUFBakIsQ0FBM0I7QUFDQSxNQUFJQyxLQUFLLEdBQUcsQ0FBWjs7QUFDQSxNQUFJTCxNQUFNLENBQUNNLGlCQUFQLENBQXlCTCxPQUF6QixDQUFKLEVBQXVDO0FBQ3JDLFNBQUssSUFBSU0sS0FBSyxHQUFHLENBQWpCLEVBQW9CQSxLQUFLLEdBQUdMLFdBQVcsQ0FBQ00sTUFBeEMsRUFBZ0RELEtBQUssRUFBckQsRUFBeUQ7QUFDdkRGLE1BQUFBLEtBQUssSUFBSU4sZUFBZSxDQUFDQyxNQUFELEVBQVNFLFdBQVcsQ0FBQ0ssS0FBRCxDQUFwQixDQUF4QjtBQUNEO0FBQ0Y7O0FBQ0QsU0FBT0YsS0FBUDtBQUNEOztBQUVELFNBQVNJLGFBQVQsQ0FBd0JULE1BQXhCLEVBQW1DO0FBQ2pDLFVBQVFBLE1BQU0sQ0FBQ1UsS0FBZjtBQUNFLFNBQUssTUFBTDtBQUNFLGFBQU8sQ0FBUDs7QUFDRixTQUFLLE9BQUw7QUFDRSxhQUFPLENBQVA7O0FBQ0YsU0FBSyxRQUFMO0FBQ0UsYUFBTyxDQUFQO0FBTko7O0FBUUEsU0FBTyxDQUFQO0FBQ0Q7O0FBRUQsU0FBU0MsWUFBVCxDQUF1QkMsTUFBdkIsRUFBb0NaLE1BQXBDLEVBQWlEYSxRQUFqRCxFQUE4RDtBQUFBLE1BQ3BE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QyxFQUFzRDtBQUNwREQsRUFBQUEsTUFBTSxDQUFDQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQkwseUJBQXBCO0FBQ0Q7O2VBRWNBLHlCIiwiZmlsZSI6ImluZGV4LmNvbW1vbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBYRVV0aWxzIGZyb20gJ3hlLXV0aWxzL21ldGhvZHMveGUtdXRpbHMnXHJcbmltcG9ydCBWWEVUYWJsZSBmcm9tICd2eGUtdGFibGUvbGliL3Z4ZS10YWJsZSdcclxuXHJcbmZ1bmN0aW9uIGNvdW50VHJlZUV4cGFuZCAoJHhUcmVlOiBhbnksIHByZXZSb3c6IGFueSk6IG51bWJlciB7XHJcbiAgY29uc3Qgcm93Q2hpbGRyZW4gPSBwcmV2Um93WyR4VHJlZS50cmVlT3B0cy5jaGlsZHJlbl1cclxuICBsZXQgY291bnQgPSAxXHJcbiAgaWYgKCR4VHJlZS5pc1RyZWVFeHBhbmRCeVJvdyhwcmV2Um93KSkge1xyXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJvd0NoaWxkcmVuLmxlbmd0aDsgaW5kZXgrKykge1xyXG4gICAgICBjb3VudCArPSBjb3VudFRyZWVFeHBhbmQoJHhUcmVlLCByb3dDaGlsZHJlbltpbmRleF0pXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBjb3VudFxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRPZmZzZXRTaXplICgkeFRyZWU6IGFueSk6IG51bWJlciB7XHJcbiAgc3dpdGNoICgkeFRyZWUudlNpemUpIHtcclxuICAgIGNhc2UgJ21pbmknOlxyXG4gICAgICByZXR1cm4gM1xyXG4gICAgY2FzZSAnc21hbGwnOlxyXG4gICAgICByZXR1cm4gMlxyXG4gICAgY2FzZSAnbWVkaXVtJzpcclxuICAgICAgcmV0dXJuIDFcclxuICB9XHJcbiAgcmV0dXJuIDBcclxufVxyXG5cclxuZnVuY3Rpb24gY2FsY1RyZWVMaW5lICgkdGFibGU6IGFueSwgJHhUcmVlOiBhbnksIG1hdGNoT2JqOiBhbnkpOiBudW1iZXIge1xyXG4gIGNvbnN0IHsgaW5kZXgsIGl0ZW1zIH0gPSBtYXRjaE9ialxyXG4gIGxldCBleHBhbmRTaXplID0gMVxyXG4gIGlmIChpbmRleCkge1xyXG4gICAgZXhwYW5kU2l6ZSA9IGNvdW50VHJlZUV4cGFuZCgkeFRyZWUsIGl0ZW1zW2luZGV4IC0gMV0pXHJcbiAgfVxyXG4gIHJldHVybiAkdGFibGUucm93SGVpZ2h0ICogZXhwYW5kU2l6ZSAtIChpbmRleCA/IDEgOiAoMTIgLSBnZXRPZmZzZXRTaXplKCR4VHJlZSkpKVxyXG59XHJcblxyXG5mdW5jdGlvbiByZWdpc3RlckNvbXBvbmVudCAoeyBWdWUsIFRhYmxlLCBHcmlkLCBzZXR1cCwgdCB9OiB0eXBlb2YgVlhFVGFibGUpIHtcclxuICBjb25zdCBHbG9iYWxDb25maWcgPSBzZXR1cCgpXHJcbiAgY29uc3QgcHJvcEtleXMgPSBPYmplY3Qua2V5cyhUYWJsZS5wcm9wcykuZmlsdGVyKG5hbWUgPT4gWydkYXRhJywgJ3RyZWVDb25maWcnXS5pbmRleE9mKG5hbWUpID09PSAtMSlcclxuXHJcbiAgY29uc3QgVmlydHVhbFRyZWU6IGFueSA9IHtcclxuICAgIG5hbWU6ICdWeGVWaXJ0dWFsVHJlZScsXHJcbiAgICBleHRlbmRzOiBHcmlkLFxyXG4gICAgZGF0YSAoKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVtb3ZlTGlzdDogW11cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNvbXB1dGVkOiB7XHJcbiAgICAgIHZTaXplICh0aGlzOiBhbnkpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNpemUgfHwgdGhpcy4kcGFyZW50LnNpemUgfHwgdGhpcy4kcGFyZW50LnZTaXplXHJcbiAgICAgIH0sXHJcbiAgICAgIHRyZWVPcHRzICh0aGlzOiBhbnkpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHtcclxuICAgICAgICAgIGNoaWxkcmVuOiAnY2hpbGRyZW4nLFxyXG4gICAgICAgICAgaGFzQ2hpbGQ6ICdoYXNDaGlsZCcsXHJcbiAgICAgICAgICBpbmRlbnQ6IDIwXHJcbiAgICAgICAgfSwgR2xvYmFsQ29uZmlnLnRyZWVDb25maWcsIHRoaXMudHJlZUNvbmZpZylcclxuICAgICAgfSxcclxuICAgICAgcmVuZGVyQ2xhc3MgKHRoaXM6IGFueSk6IGFueSB7XHJcbiAgICAgICAgY29uc3QgeyB0YWJsZVByb3BzLCB2U2l6ZSwgbWF4aW1pemUsIHRyZWVDb25maWcsIHRyZWVPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgcmV0dXJuIFsndnhlLWdyaWQgdnhlLXZpcnR1YWwtdHJlZScsIHtcclxuICAgICAgICAgIFtgc2l6ZS0tJHt2U2l6ZX1gXTogdlNpemUsXHJcbiAgICAgICAgICAndC0tYW5pbWF0JzogdGFibGVQcm9wcy5vcHRpbWl6YXRpb24uYW5pbWF0LFxyXG4gICAgICAgICAgJ2hhcy0tdHJlZS1saW5lJzogdHJlZUNvbmZpZyAmJiB0cmVlT3B0cy5saW5lLFxyXG4gICAgICAgICAgJ2lzLS1tYXhpbWl6ZSc6IG1heGltaXplXHJcbiAgICAgICAgfV1cclxuICAgICAgfSxcclxuICAgICAgdGFibGVFeHRlbmRQcm9wcyAodGhpczogYW55KTogYW55IHtcclxuICAgICAgICBsZXQgcmVzdDogYW55ID0ge31cclxuICAgICAgICBwcm9wS2V5cy5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgICByZXN0W2tleV0gPSB0aGlzW2tleV1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiByZXN0XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB3YXRjaDoge1xyXG4gICAgICBjb2x1bW5zICh0aGlzOiBhbnkpOiBhbnkge1xyXG4gICAgICAgIHRoaXMubG9hZENvbHVtbih0aGlzLmhhbmRsZUNvbHVtbnMoKSlcclxuICAgICAgfSxcclxuICAgICAgZGF0YSAodGhpczogYW55LCB2YWx1ZTogYW55W10pOiBhbnkge1xyXG4gICAgICAgIHRoaXMubG9hZERhdGEodmFsdWUpXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjcmVhdGVkICh0aGlzOiBhbnkpOiBhbnkge1xyXG4gICAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXNcclxuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCB7XHJcbiAgICAgICAgZnVsbFRyZWVEYXRhOiBbXSxcclxuICAgICAgICB0YWJsZURhdGE6IFtdLFxyXG4gICAgICAgIGZ1bGxUcmVlUm93TWFwOiBuZXcgTWFwKClcclxuICAgICAgfSlcclxuICAgICAgdGhpcy5oYW5kbGVDb2x1bW5zKClcclxuICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICB0aGlzLnJlbG9hZERhdGEoZGF0YSlcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1ldGhvZHM6IHtcclxuICAgICAgcmVuZGVyVHJlZUxpbmUgKHRoaXM6IGFueSwgcGFyYW1zOiBhbnksIGg6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHsgdHJlZUNvbmZpZywgdHJlZU9wdHMsIGZ1bGxUcmVlUm93TWFwIH0gPSB0aGlzXHJcbiAgICAgICAgY29uc3QgeyAkdGFibGUsIHJvdywgY29sdW1uIH0gPSBwYXJhbXNcclxuICAgICAgICBjb25zdCB7IHRyZWVOb2RlIH0gPSBjb2x1bW5cclxuICAgICAgICBpZiAodHJlZU5vZGUgJiYgdHJlZUNvbmZpZyAmJiB0cmVlT3B0cy5saW5lKSB7XHJcbiAgICAgICAgICBjb25zdCAkeFRyZWUgPSB0aGlzXHJcbiAgICAgICAgICBjb25zdCByb3dMZXZlbCA9IHJvdy5fWF9MRVZFTFxyXG4gICAgICAgICAgY29uc3QgbWF0Y2hPYmogPSBmdWxsVHJlZVJvd01hcC5nZXQocm93KVxyXG4gICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgdHJlZU5vZGUgJiYgdHJlZU9wdHMubGluZSA/IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1saW5lLXdyYXBwZXInXHJcbiAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1saW5lJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogYCR7Y2FsY1RyZWVMaW5lKCR0YWJsZSwgJHhUcmVlLCBtYXRjaE9iail9cHhgLFxyXG4gICAgICAgICAgICAgICAgICBsZWZ0OiBgJHtyb3dMZXZlbCAqICh0cmVlT3B0cy5pbmRlbnQgfHwgMjApICsgKHJvd0xldmVsID8gMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSA6IDApICsgMTZ9cHhgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgXSkgOiBudWxsXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbXVxyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJUcmVlSWNvbiAodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogYW55LCBjZWxsVk5vZGVzOiBhbnkpIHtcclxuICAgICAgICBsZXQgeyBpc0hpZGRlbiB9ID0gcGFyYW1zXHJcbiAgICAgICAgbGV0IHsgcm93IH0gPSBwYXJhbXNcclxuICAgICAgICBsZXQgeyBjaGlsZHJlbiwgaW5kZW50LCB0cmlnZ2VyLCBpY29uT3BlbiwgaWNvbkNsb3NlIH0gPSB0aGlzLnRyZWVPcHRzXHJcbiAgICAgICAgbGV0IHJvd0NoaWxkcmVuID0gcm93W2NoaWxkcmVuXVxyXG4gICAgICAgIGxldCBpc0FjZWl2ZWQgPSBmYWxzZVxyXG4gICAgICAgIGxldCBvbjogYW55ID0ge31cclxuICAgICAgICBpZiAoIWlzSGlkZGVuKSB7XHJcbiAgICAgICAgICBpc0FjZWl2ZWQgPSByb3cuX1hfRVhQQU5EXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdHJpZ2dlciB8fCB0cmlnZ2VyID09PSAnZGVmYXVsdCcpIHtcclxuICAgICAgICAgIG9uLmNsaWNrID0gKCkgPT4gdGhpcy50b2dnbGVUcmVlRXhwYW5zaW9uKHJvdylcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgY2xhc3M6IFsndnhlLWNlbGwtLXRyZWUtbm9kZScsIHtcclxuICAgICAgICAgICAgICAnaXMtLWFjdGl2ZSc6IGlzQWNlaXZlZFxyXG4gICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICBwYWRkaW5nTGVmdDogYCR7cm93Ll9YX0xFVkVMICogaW5kZW50fXB4YFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIHJvd0NoaWxkcmVuICYmIHJvd0NoaWxkcmVuLmxlbmd0aCA/IFtcclxuICAgICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1idG4td3JhcHBlcicsXHJcbiAgICAgICAgICAgICAgICBvblxyXG4gICAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICAgIGgoJ2knLCB7XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzOiBbJ3Z4ZS10cmVlLS1ub2RlLWJ0bicsIGlzQWNlaXZlZCA/IChpY29uT3BlbiB8fCBHbG9iYWxDb25maWcuaWNvbi50cmVlT3BlbikgOiAoaWNvbkNsb3NlIHx8IEdsb2JhbENvbmZpZy5pY29uLnRyZWVDbG9zZSldXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgIF0gOiBudWxsLFxyXG4gICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgY2xhc3M6ICd2eGUtdHJlZS1jZWxsJ1xyXG4gICAgICAgICAgICB9LCBjZWxsVk5vZGVzKVxyXG4gICAgICAgICAgXSlcclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIF9sb2FkVHJlZURhdGEgKHRoaXM6IGFueSwgZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJG5leHRUaWNrKCkudGhlbigoKSA9PiB0aGlzLiRyZWZzLnhUYWJsZS5sb2FkRGF0YShkYXRhKSlcclxuICAgICAgfSxcclxuICAgICAgbG9hZERhdGEgKGRhdGE6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGhpcy50b1ZpcnR1YWxUcmVlKGRhdGEpKVxyXG4gICAgICB9LFxyXG4gICAgICByZWxvYWREYXRhICh0aGlzOiBhbnksIGRhdGE6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLiRuZXh0VGljaygpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLiRyZWZzLnhUYWJsZS5yZWxvYWREYXRhKHRoaXMudG9WaXJ0dWFsVHJlZShkYXRhKSkpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmhhbmRsZURlZmF1bHRUcmVlRXhwYW5kKCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIGlzVHJlZUV4cGFuZEJ5Um93IChyb3c6IGFueSkge1xyXG4gICAgICAgIHJldHVybiAhIXJvdy5fWF9FWFBBTkRcclxuICAgICAgfSxcclxuICAgICAgc2V0VHJlZUV4cGFuc2lvbiAodGhpczogYW55LCByb3dzOiBhbnksIGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICBpZiAocm93cykge1xyXG4gICAgICAgICAgaWYgKCFYRVV0aWxzLmlzQXJyYXkocm93cykpIHtcclxuICAgICAgICAgICAgcm93cyA9IFtyb3dzXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcm93cy5mb3JFYWNoKChyb3c6IGFueSkgPT4gdGhpcy52aXJ0dWFsRXhwYW5kKHJvdywgISFleHBhbmRlZCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGhpcy50YWJsZURhdGEpXHJcbiAgICAgIH0sXHJcbiAgICAgIHNldEFsbFRyZWVFeHBhbnNpb24gKGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFRyZWVEYXRhKHRoaXMudmlydHVhbEFsbEV4cGFuZChleHBhbmRlZCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHRvZ2dsZVRyZWVFeHBhbnNpb24gKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhcm93Ll9YX0VYUEFORCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldFRyZWVFeHBhbmRSZWNvcmRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBoYXNDaGlsZHMgPSB0aGlzLmhhc0NoaWxkc1xyXG4gICAgICAgIGNvbnN0IHRyZWVFeHBhbmRSZWNvcmRzOiBhbnlbXSA9IFtdXHJcbiAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0aGlzLmZ1bGxUcmVlRGF0YSwgcm93ID0+IHtcclxuICAgICAgICAgIGlmIChyb3cuX1hfRVhQQU5EICYmIGhhc0NoaWxkcyhyb3cpKSB7XHJcbiAgICAgICAgICAgIHRyZWVFeHBhbmRSZWNvcmRzLnB1c2gocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMudHJlZU9wdHMpXHJcbiAgICAgICAgcmV0dXJuIHRyZWVFeHBhbmRSZWNvcmRzXHJcbiAgICAgIH0sXHJcbiAgICAgIGNsZWFyVHJlZUV4cGFuZCAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWxsVHJlZUV4cGFuc2lvbihmYWxzZSlcclxuICAgICAgfSxcclxuICAgICAgaGFuZGxlQ29sdW1ucyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1ucy5tYXAoKGNvbmY6IGFueSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGNvbmYudHJlZU5vZGUpIHtcclxuICAgICAgICAgICAgbGV0IHNsb3RzID0gY29uZi5zbG90cyB8fCB7fVxyXG4gICAgICAgICAgICBzbG90cy5pY29uID0gdGhpcy5yZW5kZXJUcmVlSWNvblxyXG4gICAgICAgICAgICBzbG90cy5saW5lID0gdGhpcy5yZW5kZXJUcmVlTGluZVxyXG4gICAgICAgICAgICBjb25mLnNsb3RzID0gc2xvdHNcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBjb25mXHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgaGFzQ2hpbGRzICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgY2hpbGRMaXN0ID0gcm93W3RoaXMudHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgICAgICAgcmV0dXJuIGNoaWxkTGlzdCAmJiBjaGlsZExpc3QubGVuZ3RoXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDojrflj5booajmoLzmlbDmja7pm4bvvIzljIXlkKvmlrDlop7jgIHliKDpmaTjgIHkv67mlLlcclxuICAgICAgICovXHJcbiAgICAgIGdldFJlY29yZHNldCAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGluc2VydFJlY29yZHM6IHRoaXMuZ2V0SW5zZXJ0UmVjb3JkcygpLFxyXG4gICAgICAgICAgcmVtb3ZlUmVjb3JkczogdGhpcy5nZXRSZW1vdmVSZWNvcmRzKCksXHJcbiAgICAgICAgICB1cGRhdGVSZWNvcmRzOiB0aGlzLmdldFVwZGF0ZVJlY29yZHMoKVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgaXNJbnNlcnRCeVJvdyAocm93OiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gISFyb3cuX1hfSU5TRVJUXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldEluc2VydFJlY29yZHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGluc2VydFJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgaWYgKHJvdy5fWF9JTlNFUlQpIHtcclxuICAgICAgICAgICAgaW5zZXJ0UmVjb3Jkcy5wdXNoKHJvdylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzLnRyZWVPcHRzKVxyXG4gICAgICAgIHJldHVybiBpbnNlcnRSZWNvcmRzXHJcbiAgICAgIH0sXHJcbiAgICAgIGluc2VydCAodGhpczogYW55LCByZWNvcmRzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbnNlcnRBdChyZWNvcmRzKVxyXG4gICAgICB9LFxyXG4gICAgICBpbnNlcnRBdCAodGhpczogYW55LCByZWNvcmRzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBmdWxsVHJlZURhdGEsIHRhYmxlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyZWNvcmRzKSkge1xyXG4gICAgICAgICAgcmVjb3JkcyA9IFtyZWNvcmRzXVxyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbmV3UmVjb3JkcyA9IHJlY29yZHMubWFwKChyZWNvcmQ6IGFueSkgPT4gdGhpcy5kZWZpbmVGaWVsZChPYmplY3QuYXNzaWduKHtcclxuICAgICAgICAgIF9YX0VYUEFORDogZmFsc2UsXHJcbiAgICAgICAgICBfWF9JTlNFUlQ6IHRydWUsXHJcbiAgICAgICAgICBfWF9MRVZFTDogMFxyXG4gICAgICAgIH0sIHJlY29yZCkpKVxyXG4gICAgICAgIGlmICghcm93KSB7XHJcbiAgICAgICAgICBmdWxsVHJlZURhdGEudW5zaGlmdC5hcHBseShmdWxsVHJlZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgICB0YWJsZURhdGEudW5zaGlmdC5hcHBseSh0YWJsZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmIChyb3cgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGZ1bGxUcmVlRGF0YS5wdXNoLmFwcGx5KGZ1bGxUcmVlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICAgICAgdGFibGVEYXRhLnB1c2guYXBwbHkodGFibGVEYXRhLCBuZXdSZWNvcmRzKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IG1hdGNoT2JqID0gWEVVdGlscy5maW5kVHJlZShmdWxsVHJlZURhdGEsIGl0ZW0gPT4gaXRlbSA9PT0gcm93LCB0cmVlT3B0cylcclxuICAgICAgICAgICAgaWYgKCFtYXRjaE9iaiB8fCBtYXRjaE9iai5pbmRleCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodCgndnhlLmVycm9yLnVuYWJsZUluc2VydCcpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCB7IGl0ZW1zLCBpbmRleCwgbm9kZXMgfTogYW55ID0gbWF0Y2hPYmpcclxuICAgICAgICAgICAgbGV0IHJvd0luZGV4ID0gdGFibGVEYXRhLmluZGV4T2Yocm93KVxyXG4gICAgICAgICAgICBpZiAocm93SW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgIHRhYmxlRGF0YS5zcGxpY2UuYXBwbHkodGFibGVEYXRhLCBbcm93SW5kZXgsIDBdLmNvbmNhdChuZXdSZWNvcmRzKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpdGVtcy5zcGxpY2UuYXBwbHkoaXRlbXMsIFtpbmRleCwgMF0uY29uY2F0KG5ld1JlY29yZHMpKVxyXG4gICAgICAgICAgICBuZXdSZWNvcmRzLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgIGl0ZW0uX1hfTEVWRUwgPSBub2Rlcy5sZW5ndGggLSAxXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGFibGVEYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJvdzogbmV3UmVjb3Jkcy5sZW5ndGggPyBuZXdSZWNvcmRzW25ld1JlY29yZHMubGVuZ3RoIC0gMV0gOiBudWxsLFxyXG4gICAgICAgICAgICByb3dzOiBuZXdSZWNvcmRzXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOiOt+WPluW3suWIoOmZpOeahOaVsOaNrlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0UmVtb3ZlUmVjb3JkcyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdFxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog5Yig6Zmk6YCJ5Lit5pWw5o2uXHJcbiAgICAgICAqL1xyXG4gICAgICByZW1vdmVTZWxlY3RlZHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZSh0aGlzLmdldFNlbGVjdFJlY29yZHMoKSkudGhlbigocGFyYW1zOiBhbnkpID0+IHtcclxuICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3Rpb24oKVxyXG4gICAgICAgICAgcmV0dXJuIHBhcmFtc1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbW92ZSAodGhpczogYW55LCByb3dzOiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7IHJlbW92ZUxpc3QsIGZ1bGxUcmVlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICBsZXQgcmVzdDogYW55W10gPSBbXVxyXG4gICAgICAgIGlmICghcm93cykge1xyXG4gICAgICAgICAgcm93cyA9IGZ1bGxUcmVlRGF0YVxyXG4gICAgICAgIH0gZWxzZSBpZiAoIVhFVXRpbHMuaXNBcnJheShyb3dzKSkge1xyXG4gICAgICAgICAgcm93cyA9IFtyb3dzXVxyXG4gICAgICAgIH1cclxuICAgICAgICByb3dzLmZvckVhY2goKHJvdzogYW55KSA9PiB7XHJcbiAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKGZ1bGxUcmVlRGF0YSwgaXRlbSA9PiBpdGVtID09PSByb3csIHRyZWVPcHRzKVxyXG4gICAgICAgICAgaWYgKG1hdGNoT2JqKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgaXRlbSwgaXRlbXMsIGluZGV4LCBwYXJlbnQgfTogYW55ID0gbWF0Y2hPYmpcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzSW5zZXJ0QnlSb3cocm93KSkge1xyXG4gICAgICAgICAgICAgIHJlbW92ZUxpc3QucHVzaChyb3cpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgIGxldCBpc0V4cGFuZCA9IHRoaXMuaXNUcmVlRXhwYW5kQnlSb3cocGFyZW50KVxyXG4gICAgICAgICAgICAgIGlmIChpc0V4cGFuZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVDb2xsYXBzaW5nKHBhcmVudClcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaXRlbXMuc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgICAgICAgICAgIGlmIChpc0V4cGFuZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVFeHBhbmRpbmcocGFyZW50KVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcoaXRlbSlcclxuICAgICAgICAgICAgICBpdGVtcy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgICAgdGhpcy50YWJsZURhdGEuc3BsaWNlKHRoaXMudGFibGVEYXRhLmluZGV4T2YoaXRlbSksIDEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdC5wdXNoKGl0ZW0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFRyZWVEYXRhKHRoaXMudGFibGVEYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHJldHVybiB7IHJvdzogcmVzdC5sZW5ndGggPyByZXN0W3Jlc3QubGVuZ3RoIC0gMV0gOiBudWxsLCByb3dzOiByZXN0IH1cclxuICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog5aSE55CG6buY6K6k5bGV5byA5qCR6IqC54K5XHJcbiAgICAgICAqL1xyXG4gICAgICBoYW5kbGVEZWZhdWx0VHJlZUV4cGFuZCAodGhpczogYW55KSB7XHJcbiAgICAgICAgbGV0IHsgdHJlZUNvbmZpZywgdHJlZU9wdHMsIHRhYmxlRnVsbERhdGEgfSA9IHRoaXNcclxuICAgICAgICBpZiAodHJlZUNvbmZpZykge1xyXG4gICAgICAgICAgbGV0IHsgY2hpbGRyZW4sIGV4cGFuZEFsbCwgZXhwYW5kUm93S2V5cyB9ID0gdHJlZU9wdHNcclxuICAgICAgICAgIGlmIChleHBhbmRBbGwpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRBbGxUcmVlRXhwYW5zaW9uKHRydWUpXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGV4cGFuZFJvd0tleXMpIHtcclxuICAgICAgICAgICAgbGV0IHJvd2tleSA9IHRoaXMucm93SWRcclxuICAgICAgICAgICAgZXhwYW5kUm93S2V5cy5mb3JFYWNoKChyb3dpZDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgbGV0IG1hdGNoT2JqID0gWEVVdGlscy5maW5kVHJlZSh0YWJsZUZ1bGxEYXRhLCBpdGVtID0+IHJvd2lkID09PSBYRVV0aWxzLmdldChpdGVtLCByb3drZXkpLCB0cmVlT3B0cylcclxuICAgICAgICAgICAgICBsZXQgcm93Q2hpbGRyZW4gPSBtYXRjaE9iaiA/IG1hdGNoT2JqLml0ZW1bY2hpbGRyZW5dIDogMFxyXG4gICAgICAgICAgICAgIGlmIChyb3dDaGlsZHJlbiAmJiByb3dDaGlsZHJlbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0VHJlZUV4cGFuc2lvbihtYXRjaE9iai5pdGVtLCB0cnVlKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDlrprkuYnmoJHlsZ7mgKdcclxuICAgICAgICovXHJcbiAgICAgIHRvVmlydHVhbFRyZWUgKHRoaXM6IGFueSwgdHJlZURhdGE6IGFueVtdKSB7XHJcbiAgICAgICAgbGV0IGZ1bGxUcmVlUm93TWFwID0gdGhpcy5mdWxsVHJlZVJvd01hcFxyXG4gICAgICAgIGZ1bGxUcmVlUm93TWFwLmNsZWFyKClcclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRyZWVEYXRhLCAoaXRlbSwgaW5kZXgsIGl0ZW1zLCBwYXRocywgcGFyZW50LCBub2RlcykgPT4ge1xyXG4gICAgICAgICAgaXRlbS5fWF9FWFBBTkQgPSBmYWxzZVxyXG4gICAgICAgICAgaXRlbS5fWF9JTlNFUlQgPSBmYWxzZVxyXG4gICAgICAgICAgaXRlbS5fWF9MRVZFTCA9IG5vZGVzLmxlbmd0aCAtIDFcclxuICAgICAgICAgIGZ1bGxUcmVlUm93TWFwLnNldChpdGVtLCB7IGl0ZW0sIGluZGV4LCBpdGVtcywgcGF0aHMsIHBhcmVudCwgbm9kZXMgfSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuZnVsbFRyZWVEYXRhID0gdHJlZURhdGEuc2xpY2UoMClcclxuICAgICAgICB0aGlzLnRhYmxlRGF0YSA9IHRyZWVEYXRhLnNsaWNlKDApXHJcbiAgICAgICAgcmV0dXJuIHRyZWVEYXRhXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDlsZXlvIAv5pS26LW35qCR6IqC54K5XHJcbiAgICAgICAqL1xyXG4gICAgICB2aXJ0dWFsRXhwYW5kICh0aGlzOiBhbnksIHJvdzogYW55LCBleHBhbmRlZDogYW55KSB7XHJcbiAgICAgICAgaWYgKHJvdy5fWF9FWFBBTkQgIT09IGV4cGFuZGVkKSB7XHJcbiAgICAgICAgICBpZiAocm93Ll9YX0VYUEFORCkge1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocm93KVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5oYW5kbGVFeHBhbmRpbmcocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLy8g5bGV5byA6IqC54K5XHJcbiAgICAgIGhhbmRsZUV4cGFuZGluZyAodGhpczogYW55LCByb3c6IGFueSkge1xyXG4gICAgICAgIGlmICh0aGlzLmhhc0NoaWxkcyhyb3cpKSB7XHJcbiAgICAgICAgICBjb25zdCB7IHRhYmxlRGF0YSwgdHJlZU9wdHMgfSA9IHRoaXNcclxuICAgICAgICAgIGxldCBjaGlsZFJvd3MgPSByb3dbdHJlZU9wdHMuY2hpbGRyZW5dXHJcbiAgICAgICAgICBsZXQgZXhwYW5kTGlzdDogYW55W10gPSBbXVxyXG4gICAgICAgICAgbGV0IHJvd0luZGV4ID0gdGFibGVEYXRhLmluZGV4T2Yocm93KVxyXG4gICAgICAgICAgaWYgKHJvd0luZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mUmeivr+eahOaTjeS9nO+8gScpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKGNoaWxkUm93cywgKGl0ZW0sIGluZGV4LCBvYmosIHBhdGhzLCBwYXJlbnQsIG5vZGVzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghcGFyZW50IHx8IHBhcmVudC5fWF9FWFBBTkQpIHtcclxuICAgICAgICAgICAgICBleHBhbmRMaXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gdHJ1ZVxyXG4gICAgICAgICAgdGFibGVEYXRhLnNwbGljZS5hcHBseSh0YWJsZURhdGEsIFtyb3dJbmRleCArIDEsIDBdLmNvbmNhdChleHBhbmRMaXN0KSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGFibGVEYXRhXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIOaUtui1t+iKgueCuVxyXG4gICAgICBoYW5kbGVDb2xsYXBzaW5nICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgIGNvbnN0IHsgdGFibGVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgICAgbGV0IGNoaWxkUm93cyA9IHJvd1t0cmVlT3B0cy5jaGlsZHJlbl1cclxuICAgICAgICAgIGxldCBub2RlQ2hpbGRMaXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKGNoaWxkUm93cywgaXRlbSA9PiB7XHJcbiAgICAgICAgICAgIG5vZGVDaGlsZExpc3QucHVzaChpdGVtKVxyXG4gICAgICAgICAgfSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gZmFsc2VcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGFibGVEYXRhLmZpbHRlcigoaXRlbTogYW55KSA9PiBub2RlQ2hpbGRMaXN0LmluZGV4T2YoaXRlbSkgPT09IC0xKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmiYDmnInmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxBbGxFeHBhbmQgKHRoaXM6IGFueSwgZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICB0aGlzLnZpcnR1YWxFeHBhbmQocm93LCBleHBhbmRlZClcclxuICAgICAgICB9LCB0aGlzLnRyZWVPcHRzKVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBWdWUuY29tcG9uZW50KFZpcnR1YWxUcmVlLm5hbWUsIFZpcnR1YWxUcmVlKVxyXG59XHJcblxyXG4vKipcclxuICog5Z+65LqOIHZ4ZS10YWJsZSDooajmoLznmoTlop7lvLrmj5Lku7bvvIzlrp7njrDnroDljZXnmoTomZrmi5/moJHooajmoLxcclxuICovXHJcbmV4cG9ydCBjb25zdCBWWEVUYWJsZVBsdWdpblZpcnR1YWxUcmVlID0ge1xyXG4gIGluc3RhbGwgKHh0YWJsZTogdHlwZW9mIFZYRVRhYmxlKSB7XHJcbiAgICAvLyDms6jlhoznu4Tku7ZcclxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KHh0YWJsZSlcclxuICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuVlhFVGFibGUpIHtcclxuICB3aW5kb3cuVlhFVGFibGUudXNlKFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUpXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWVcclxuIl19
