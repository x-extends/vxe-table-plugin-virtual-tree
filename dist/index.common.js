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
          "class": ['vxe-tree--node-btn', isAceived ? iconOpen || GlobalConfig.icon.TABLE_TREE_OPEN : iconClose || GlobalConfig.icon.TABLE_TREE_CLOSE]
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbImNvdW50VHJlZUV4cGFuZCIsIiR4VHJlZSIsInByZXZSb3ciLCJyb3dDaGlsZHJlbiIsInRyZWVPcHRzIiwiY2hpbGRyZW4iLCJjb3VudCIsImlzVHJlZUV4cGFuZEJ5Um93IiwiaW5kZXgiLCJsZW5ndGgiLCJnZXRPZmZzZXRTaXplIiwidlNpemUiLCJjYWxjVHJlZUxpbmUiLCIkdGFibGUiLCJtYXRjaE9iaiIsIml0ZW1zIiwiZXhwYW5kU2l6ZSIsInJvd0hlaWdodCIsInJlZ2lzdGVyQ29tcG9uZW50IiwiVnVlIiwiVGFibGUiLCJHcmlkIiwic2V0dXAiLCJ0IiwiR2xvYmFsQ29uZmlnIiwicHJvcEtleXMiLCJPYmplY3QiLCJrZXlzIiwicHJvcHMiLCJmaWx0ZXIiLCJuYW1lIiwiaW5kZXhPZiIsIlZpcnR1YWxUcmVlIiwiZGF0YSIsInJlbW92ZUxpc3QiLCJjb21wdXRlZCIsInNpemUiLCIkcGFyZW50IiwiYXNzaWduIiwiaGFzQ2hpbGQiLCJpbmRlbnQiLCJ0cmVlQ29uZmlnIiwicmVuZGVyQ2xhc3MiLCJhbmltYXQiLCJsaW5lIiwiaXNNYXhpbWl6ZWQiLCJ0YWJsZUV4dGVuZFByb3BzIiwicmVzdCIsImZvckVhY2giLCJrZXkiLCJ3YXRjaCIsImNvbHVtbnMiLCJsb2FkQ29sdW1uIiwiaGFuZGxlQ29sdW1ucyIsInZhbHVlIiwibG9hZERhdGEiLCJjcmVhdGVkIiwiZnVsbFRyZWVEYXRhIiwidGFibGVEYXRhIiwiZnVsbFRyZWVSb3dNYXAiLCJNYXAiLCJyZWxvYWREYXRhIiwibWV0aG9kcyIsInJlbmRlclRyZWVMaW5lIiwicGFyYW1zIiwiaCIsInJvdyIsImNvbHVtbiIsInRyZWVOb2RlIiwicm93TGV2ZWwiLCJfWF9MRVZFTCIsImdldCIsInN0eWxlIiwiaGVpZ2h0IiwibGVmdCIsInJlbmRlclRyZWVJY29uIiwiY2VsbFZOb2RlcyIsImlzSGlkZGVuIiwidHJpZ2dlciIsImljb25PcGVuIiwiaWNvbkNsb3NlIiwiaXNBY2VpdmVkIiwib24iLCJfWF9FWFBBTkQiLCJjbGljayIsInRvZ2dsZVRyZWVFeHBhbnNpb24iLCJwYWRkaW5nTGVmdCIsImljb24iLCJUQUJMRV9UUkVFX09QRU4iLCJUQUJMRV9UUkVFX0NMT1NFIiwiX2xvYWRUcmVlRGF0YSIsIiRuZXh0VGljayIsInRoZW4iLCIkcmVmcyIsInhUYWJsZSIsInRvVmlydHVhbFRyZWUiLCJoYW5kbGVEZWZhdWx0VHJlZUV4cGFuZCIsInNldFRyZWVFeHBhbnNpb24iLCJyb3dzIiwiZXhwYW5kZWQiLCJYRVV0aWxzIiwiaXNBcnJheSIsInZpcnR1YWxFeHBhbmQiLCJzZXRBbGxUcmVlRXhwYW5zaW9uIiwidmlydHVhbEFsbEV4cGFuZCIsImdldFRyZWVFeHBhbmRSZWNvcmRzIiwiaGFzQ2hpbGRzIiwidHJlZUV4cGFuZFJlY29yZHMiLCJlYWNoVHJlZSIsInB1c2giLCJjbGVhclRyZWVFeHBhbmQiLCJtYXAiLCJjb25mIiwic2xvdHMiLCJjaGlsZExpc3QiLCJnZXRSZWNvcmRzZXQiLCJpbnNlcnRSZWNvcmRzIiwiZ2V0SW5zZXJ0UmVjb3JkcyIsInJlbW92ZVJlY29yZHMiLCJnZXRSZW1vdmVSZWNvcmRzIiwidXBkYXRlUmVjb3JkcyIsImdldFVwZGF0ZVJlY29yZHMiLCJpc0luc2VydEJ5Um93IiwiX1hfSU5TRVJUIiwiaW5zZXJ0IiwicmVjb3JkcyIsImluc2VydEF0IiwibmV3UmVjb3JkcyIsInJlY29yZCIsImRlZmluZUZpZWxkIiwidW5zaGlmdCIsImFwcGx5IiwiZmluZFRyZWUiLCJpdGVtIiwiRXJyb3IiLCJub2RlcyIsInJvd0luZGV4Iiwic3BsaWNlIiwiY29uY2F0IiwicmVtb3ZlU2VsZWN0ZWRzIiwicmVtb3ZlQ2hlY2tib3hSb3ciLCJyZW1vdmUiLCJnZXRTZWxlY3RSZWNvcmRzIiwiY2xlYXJTZWxlY3Rpb24iLCJwYXJlbnQiLCJpc0V4cGFuZCIsImhhbmRsZUNvbGxhcHNpbmciLCJoYW5kbGVFeHBhbmRpbmciLCJ0YWJsZUZ1bGxEYXRhIiwiZXhwYW5kQWxsIiwiZXhwYW5kUm93S2V5cyIsInJvd2tleSIsInJvd0lkIiwicm93aWQiLCJ0cmVlRGF0YSIsImNsZWFyIiwicGF0aHMiLCJzZXQiLCJzbGljZSIsImNoaWxkUm93cyIsImV4cGFuZExpc3QiLCJvYmoiLCJub2RlQ2hpbGRMaXN0IiwidGFibGVMaXN0IiwiY29tcG9uZW50IiwiVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZSIsImluc3RhbGwiLCJ4dGFibGUiLCJ3aW5kb3ciLCJWWEVUYWJsZSIsInVzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs7Ozs7QUFFQTtBQUVBLFNBQVNBLGVBQVQsQ0FBMEJDLE1BQTFCLEVBQXVDQyxPQUF2QyxFQUFtRDtBQUNqRCxNQUFNQyxXQUFXLEdBQUdELE9BQU8sQ0FBQ0QsTUFBTSxDQUFDRyxRQUFQLENBQWdCQyxRQUFqQixDQUEzQjtBQUNBLE1BQUlDLEtBQUssR0FBRyxDQUFaOztBQUNBLE1BQUlMLE1BQU0sQ0FBQ00saUJBQVAsQ0FBeUJMLE9BQXpCLENBQUosRUFBdUM7QUFDckMsU0FBSyxJQUFJTSxLQUFLLEdBQUcsQ0FBakIsRUFBb0JBLEtBQUssR0FBR0wsV0FBVyxDQUFDTSxNQUF4QyxFQUFnREQsS0FBSyxFQUFyRCxFQUF5RDtBQUN2REYsTUFBQUEsS0FBSyxJQUFJTixlQUFlLENBQUNDLE1BQUQsRUFBU0UsV0FBVyxDQUFDSyxLQUFELENBQXBCLENBQXhCO0FBQ0Q7QUFDRjs7QUFDRCxTQUFPRixLQUFQO0FBQ0Q7O0FBRUQsU0FBU0ksYUFBVCxDQUF3QlQsTUFBeEIsRUFBbUM7QUFDakMsVUFBUUEsTUFBTSxDQUFDVSxLQUFmO0FBQ0UsU0FBSyxNQUFMO0FBQ0UsYUFBTyxDQUFQOztBQUNGLFNBQUssT0FBTDtBQUNFLGFBQU8sQ0FBUDs7QUFDRixTQUFLLFFBQUw7QUFDRSxhQUFPLENBQVA7QUFOSjs7QUFRQSxTQUFPLENBQVA7QUFDRDs7QUFFRCxTQUFTQyxZQUFULENBQXVCQyxNQUF2QixFQUFvQ1osTUFBcEMsRUFB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QUFBLEdBQUcsQ0FBQ2lKLFNBQUosQ0FBY3BJLFdBQVcsQ0FBQ0YsSUFBMUIsRUFBZ0NFLFdBQWhDO0FBQ0Q7QUFFRDs7Ozs7QUFHTyxJQUFNcUkseUJBQXlCLEdBQUc7QUFDdkNDLEVBQUFBLE9BRHVDLG1CQUM5QkMsTUFEOEIsRUFDUDtBQUM5QjtBQUNBckosSUFBQUEsaUJBQWlCLENBQUNxSixNQUFELENBQWpCO0FBQ0Q7QUFKc0MsQ0FBbEM7OztBQU9QLElBQUksT0FBT0MsTUFBUCxLQUFrQixXQUFsQixJQUFpQ0EsTUFBTSxDQUFDQyxRQUE1QyxFQUFzRDtBQUNwREQsRUFBQUEsTUFBTSxDQUFDQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQkwseUJBQXBCO0FBQ0Q7O2VBRWNBLHlCIiwiZmlsZSI6ImluZGV4LmNvbW1vbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXHJcbmltcG9ydCB7IENyZWF0ZUVsZW1lbnQsIFZOb2RlQ2hpbGRyZW4gfSBmcm9tICd2dWUnXHJcbmltcG9ydCBYRVV0aWxzIGZyb20gJ3hlLXV0aWxzL21ldGhvZHMveGUtdXRpbHMnXHJcbmltcG9ydCB7IFZYRVRhYmxlIH0gZnJvbSAndnhlLXRhYmxlL2xpYi92eGUtdGFibGUnXHJcbi8qIGVzbGludC1lbmFibGUgbm8tdW51c2VkLXZhcnMgKi9cclxuXHJcbmZ1bmN0aW9uIGNvdW50VHJlZUV4cGFuZCAoJHhUcmVlOiBhbnksIHByZXZSb3c6IGFueSk6IG51bWJlciB7XHJcbiAgY29uc3Qgcm93Q2hpbGRyZW4gPSBwcmV2Um93WyR4VHJlZS50cmVlT3B0cy5jaGlsZHJlbl1cclxuICBsZXQgY291bnQgPSAxXHJcbiAgaWYgKCR4VHJlZS5pc1RyZWVFeHBhbmRCeVJvdyhwcmV2Um93KSkge1xyXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJvd0NoaWxkcmVuLmxlbmd0aDsgaW5kZXgrKykge1xyXG4gICAgICBjb3VudCArPSBjb3VudFRyZWVFeHBhbmQoJHhUcmVlLCByb3dDaGlsZHJlbltpbmRleF0pXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBjb3VudFxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRPZmZzZXRTaXplICgkeFRyZWU6IGFueSk6IG51bWJlciB7XHJcbiAgc3dpdGNoICgkeFRyZWUudlNpemUpIHtcclxuICAgIGNhc2UgJ21pbmknOlxyXG4gICAgICByZXR1cm4gM1xyXG4gICAgY2FzZSAnc21hbGwnOlxyXG4gICAgICByZXR1cm4gMlxyXG4gICAgY2FzZSAnbWVkaXVtJzpcclxuICAgICAgcmV0dXJuIDFcclxuICB9XHJcbiAgcmV0dXJuIDBcclxufVxyXG5cclxuZnVuY3Rpb24gY2FsY1RyZWVMaW5lICgkdGFibGU6IGFueSwgJHhUcmVlOiBhbnksIG1hdGNoT2JqOiBhbnkpOiBudW1iZXIge1xyXG4gIGNvbnN0IHsgaW5kZXgsIGl0ZW1zIH0gPSBtYXRjaE9ialxyXG4gIGxldCBleHBhbmRTaXplID0gMVxyXG4gIGlmIChpbmRleCkge1xyXG4gICAgZXhwYW5kU2l6ZSA9IGNvdW50VHJlZUV4cGFuZCgkeFRyZWUsIGl0ZW1zW2luZGV4IC0gMV0pXHJcbiAgfVxyXG4gIHJldHVybiAkdGFibGUucm93SGVpZ2h0ICogZXhwYW5kU2l6ZSAtIChpbmRleCA/IDEgOiAoMTIgLSBnZXRPZmZzZXRTaXplKCR4VHJlZSkpKVxyXG59XHJcblxyXG5mdW5jdGlvbiByZWdpc3RlckNvbXBvbmVudCAoeyBWdWUsIFRhYmxlLCBHcmlkLCBzZXR1cCwgdCB9OiBhbnkpIHtcclxuICBjb25zdCBHbG9iYWxDb25maWcgPSBzZXR1cCgpXHJcbiAgY29uc3QgcHJvcEtleXMgPSBPYmplY3Qua2V5cyhUYWJsZS5wcm9wcykuZmlsdGVyKG5hbWUgPT4gWydkYXRhJywgJ3RyZWVDb25maWcnXS5pbmRleE9mKG5hbWUpID09PSAtMSlcclxuXHJcbiAgY29uc3QgVmlydHVhbFRyZWU6IGFueSA9IHtcclxuICAgIG5hbWU6ICdWeGVWaXJ0dWFsVHJlZScsXHJcbiAgICBleHRlbmRzOiBHcmlkLFxyXG4gICAgZGF0YSAoKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVtb3ZlTGlzdDogW11cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNvbXB1dGVkOiB7XHJcbiAgICAgIHZTaXplICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zaXplIHx8IHRoaXMuJHBhcmVudC5zaXplIHx8IHRoaXMuJHBhcmVudC52U2l6ZVxyXG4gICAgICB9LFxyXG4gICAgICB0cmVlT3B0cyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICAgICAgY2hpbGRyZW46ICdjaGlsZHJlbicsXHJcbiAgICAgICAgICBoYXNDaGlsZDogJ2hhc0NoaWxkJyxcclxuICAgICAgICAgIGluZGVudDogMjBcclxuICAgICAgICB9LCBHbG9iYWxDb25maWcudHJlZUNvbmZpZywgdGhpcy50cmVlQ29uZmlnKVxyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJDbGFzcyAodGhpczogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyB2U2l6ZSB9ID0gdGhpc1xyXG4gICAgICAgIHJldHVybiBbJ3Z4ZS1ncmlkIHZ4ZS12aXJ0dWFsLXRyZWUnLCB7XHJcbiAgICAgICAgICBbYHNpemUtLSR7dlNpemV9YF06IHZTaXplLFxyXG4gICAgICAgICAgJ3QtLWFuaW1hdCc6IHRoaXMuYW5pbWF0LFxyXG4gICAgICAgICAgJ2hhcy0tdHJlZS1saW5lJzogdGhpcy50cmVlQ29uZmlnICYmIHRoaXMudHJlZU9wdHMubGluZSxcclxuICAgICAgICAgICdpcy0tbWF4aW1pemUnOiB0aGlzLmlzTWF4aW1pemVkKClcclxuICAgICAgICB9XVxyXG4gICAgICB9LFxyXG4gICAgICB0YWJsZUV4dGVuZFByb3BzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICBsZXQgcmVzdDogYW55ID0ge31cclxuICAgICAgICBwcm9wS2V5cy5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgICByZXN0W2tleV0gPSB0aGlzW2tleV1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiByZXN0XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB3YXRjaDoge1xyXG4gICAgICBjb2x1bW5zICh0aGlzOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmxvYWRDb2x1bW4odGhpcy5oYW5kbGVDb2x1bW5zKCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIGRhdGEgKHRoaXM6IGFueSwgdmFsdWU6IGFueVtdKSB7XHJcbiAgICAgICAgdGhpcy5sb2FkRGF0YSh2YWx1ZSlcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNyZWF0ZWQgKHRoaXM6IGFueSkge1xyXG4gICAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXNcclxuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCB7XHJcbiAgICAgICAgZnVsbFRyZWVEYXRhOiBbXSxcclxuICAgICAgICB0YWJsZURhdGE6IFtdLFxyXG4gICAgICAgIGZ1bGxUcmVlUm93TWFwOiBuZXcgTWFwKClcclxuICAgICAgfSlcclxuICAgICAgdGhpcy5oYW5kbGVDb2x1bW5zKClcclxuICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICB0aGlzLnJlbG9hZERhdGEoZGF0YSlcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1ldGhvZHM6IHtcclxuICAgICAgcmVuZGVyVHJlZUxpbmUgKHRoaXM6IGFueSwgcGFyYW1zOiBhbnksIGg6IENyZWF0ZUVsZW1lbnQpIHtcclxuICAgICAgICBjb25zdCB7IHRyZWVDb25maWcsIHRyZWVPcHRzLCBmdWxsVHJlZVJvd01hcCB9ID0gdGhpc1xyXG4gICAgICAgIGNvbnN0IHsgJHRhYmxlLCByb3csIGNvbHVtbiB9ID0gcGFyYW1zXHJcbiAgICAgICAgY29uc3QgeyB0cmVlTm9kZSB9ID0gY29sdW1uXHJcbiAgICAgICAgaWYgKHRyZWVOb2RlICYmIHRyZWVDb25maWcgJiYgdHJlZU9wdHMubGluZSkge1xyXG4gICAgICAgICAgY29uc3QgJHhUcmVlID0gdGhpc1xyXG4gICAgICAgICAgY29uc3Qgcm93TGV2ZWwgPSByb3cuX1hfTEVWRUxcclxuICAgICAgICAgIGNvbnN0IG1hdGNoT2JqID0gZnVsbFRyZWVSb3dNYXAuZ2V0KHJvdylcclxuICAgICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHRyZWVOb2RlICYmIHRyZWVPcHRzLmxpbmUgPyBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgY2xhc3M6ICd2eGUtdHJlZS0tbGluZS13cmFwcGVyJ1xyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgY2xhc3M6ICd2eGUtdHJlZS0tbGluZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6IGAke2NhbGNUcmVlTGluZSgkdGFibGUsICR4VHJlZSwgbWF0Y2hPYmopfXB4YCxcclxuICAgICAgICAgICAgICAgICAgbGVmdDogYCR7cm93TGV2ZWwgKiAodHJlZU9wdHMuaW5kZW50IHx8IDIwKSArIChyb3dMZXZlbCA/IDIgLSBnZXRPZmZzZXRTaXplKCR4VHJlZSkgOiAwKSArIDE2fXB4YFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIF0pIDogbnVsbFxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW11cclxuICAgICAgfSxcclxuICAgICAgcmVuZGVyVHJlZUljb24gKHRoaXM6IGFueSwgcGFyYW1zOiBhbnksIGg6IENyZWF0ZUVsZW1lbnQsIGNlbGxWTm9kZXM6IFZOb2RlQ2hpbGRyZW4pIHtcclxuICAgICAgICBsZXQgeyBpc0hpZGRlbiB9ID0gcGFyYW1zXHJcbiAgICAgICAgbGV0IHsgcm93IH0gPSBwYXJhbXNcclxuICAgICAgICBsZXQgeyBjaGlsZHJlbiwgaW5kZW50LCB0cmlnZ2VyLCBpY29uT3BlbiwgaWNvbkNsb3NlIH0gPSB0aGlzLnRyZWVPcHRzXHJcbiAgICAgICAgbGV0IHJvd0NoaWxkcmVuID0gcm93W2NoaWxkcmVuXVxyXG4gICAgICAgIGxldCBpc0FjZWl2ZWQgPSBmYWxzZVxyXG4gICAgICAgIGxldCBvbjogYW55ID0ge31cclxuICAgICAgICBpZiAoIWlzSGlkZGVuKSB7XHJcbiAgICAgICAgICBpc0FjZWl2ZWQgPSByb3cuX1hfRVhQQU5EXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdHJpZ2dlciB8fCB0cmlnZ2VyID09PSAnZGVmYXVsdCcpIHtcclxuICAgICAgICAgIG9uLmNsaWNrID0gKCkgPT4gdGhpcy50b2dnbGVUcmVlRXhwYW5zaW9uKHJvdylcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgY2xhc3M6IFsndnhlLWNlbGwtLXRyZWUtbm9kZScsIHtcclxuICAgICAgICAgICAgICAnaXMtLWFjdGl2ZSc6IGlzQWNlaXZlZFxyXG4gICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICBwYWRkaW5nTGVmdDogYCR7cm93Ll9YX0xFVkVMICogaW5kZW50fXB4YFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIHJvd0NoaWxkcmVuICYmIHJvd0NoaWxkcmVuLmxlbmd0aCA/IFtcclxuICAgICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1idG4td3JhcHBlcicsXHJcbiAgICAgICAgICAgICAgICBvblxyXG4gICAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICAgIGgoJ2knLCB7XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzOiBbJ3Z4ZS10cmVlLS1ub2RlLWJ0bicsIGlzQWNlaXZlZCA/IChpY29uT3BlbiB8fCBHbG9iYWxDb25maWcuaWNvbi5UQUJMRV9UUkVFX09QRU4pIDogKGljb25DbG9zZSB8fCBHbG9iYWxDb25maWcuaWNvbi5UQUJMRV9UUkVFX0NMT1NFKV1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgXSA6IG51bGwsXHJcbiAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLWNlbGwnXHJcbiAgICAgICAgICAgIH0sIGNlbGxWTm9kZXMpXHJcbiAgICAgICAgICBdKVxyXG4gICAgICAgIF1cclxuICAgICAgfSxcclxuICAgICAgX2xvYWRUcmVlRGF0YSAodGhpczogYW55LCBkYXRhOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4kbmV4dFRpY2soKS50aGVuKCgpID0+IHRoaXMuJHJlZnMueFRhYmxlLmxvYWREYXRhKGRhdGEpKVxyXG4gICAgICB9LFxyXG4gICAgICBsb2FkRGF0YSAoZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRvVmlydHVhbFRyZWUoZGF0YSkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbG9hZERhdGEgKHRoaXM6IGFueSwgZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJG5leHRUaWNrKClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuJHJlZnMueFRhYmxlLnJlbG9hZERhdGEodGhpcy50b1ZpcnR1YWxUcmVlKGRhdGEpKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQoKSlcclxuICAgICAgfSxcclxuICAgICAgaXNUcmVlRXhwYW5kQnlSb3cgKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuICEhcm93Ll9YX0VYUEFORFxyXG4gICAgICB9LFxyXG4gICAgICBzZXRUcmVlRXhwYW5zaW9uICh0aGlzOiBhbnksIHJvd3M6IGFueSwgZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIGlmIChyb3dzKSB7XHJcbiAgICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyb3dzKSkge1xyXG4gICAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByb3dzLmZvckVhY2goKHJvdzogYW55KSA9PiB0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhIWV4cGFuZGVkKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRhYmxlRGF0YSlcclxuICAgICAgfSxcclxuICAgICAgc2V0QWxsVHJlZUV4cGFuc2lvbiAoZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGhpcy52aXJ0dWFsQWxsRXhwYW5kKGV4cGFuZGVkKSlcclxuICAgICAgfSxcclxuICAgICAgdG9nZ2xlVHJlZUV4cGFuc2lvbiAocm93OiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFRyZWVEYXRhKHRoaXMudmlydHVhbEV4cGFuZChyb3csICFyb3cuX1hfRVhQQU5EKSlcclxuICAgICAgfSxcclxuICAgICAgZ2V0VHJlZUV4cGFuZFJlY29yZHMgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGhhc0NoaWxkcyA9IHRoaXMuaGFzQ2hpbGRzXHJcbiAgICAgICAgY29uc3QgdHJlZUV4cGFuZFJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgaWYgKHJvdy5fWF9FWFBBTkQgJiYgaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgICAgdHJlZUV4cGFuZFJlY29yZHMucHVzaChyb3cpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcy50cmVlT3B0cylcclxuICAgICAgICByZXR1cm4gdHJlZUV4cGFuZFJlY29yZHNcclxuICAgICAgfSxcclxuICAgICAgY2xlYXJUcmVlRXhwYW5kICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXRBbGxUcmVlRXhwYW5zaW9uKGZhbHNlKVxyXG4gICAgICB9LFxyXG4gICAgICBoYW5kbGVDb2x1bW5zICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5zLm1hcCgoY29uZjogYW55KSA9PiB7XHJcbiAgICAgICAgICBpZiAoY29uZi50cmVlTm9kZSkge1xyXG4gICAgICAgICAgICBsZXQgc2xvdHMgPSBjb25mLnNsb3RzIHx8IHt9XHJcbiAgICAgICAgICAgIHNsb3RzLmljb24gPSB0aGlzLnJlbmRlclRyZWVJY29uXHJcbiAgICAgICAgICAgIHNsb3RzLmxpbmUgPSB0aGlzLnJlbmRlclRyZWVMaW5lXHJcbiAgICAgICAgICAgIGNvbmYuc2xvdHMgPSBzbG90c1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGNvbmZcclxuICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICBoYXNDaGlsZHMgKHRoaXM6IGFueSwgcm93OiBhbnkpIHtcclxuICAgICAgICBjb25zdCBjaGlsZExpc3QgPSByb3dbdGhpcy50cmVlT3B0cy5jaGlsZHJlbl1cclxuICAgICAgICByZXR1cm4gY2hpbGRMaXN0ICYmIGNoaWxkTGlzdC5sZW5ndGhcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOiOt+WPluihqOagvOaVsOaNrumbhu+8jOWMheWQq+aWsOWinuOAgeWIoOmZpOOAgeS/ruaUuVxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0UmVjb3Jkc2V0ICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaW5zZXJ0UmVjb3JkczogdGhpcy5nZXRJbnNlcnRSZWNvcmRzKCksXHJcbiAgICAgICAgICByZW1vdmVSZWNvcmRzOiB0aGlzLmdldFJlbW92ZVJlY29yZHMoKSxcclxuICAgICAgICAgIHVwZGF0ZVJlY29yZHM6IHRoaXMuZ2V0VXBkYXRlUmVjb3JkcygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBpc0luc2VydEJ5Um93IChyb3c6IGFueSkge1xyXG4gICAgICAgIHJldHVybiAhIXJvdy5fWF9JTlNFUlRcclxuICAgICAgfSxcclxuICAgICAgZ2V0SW5zZXJ0UmVjb3JkcyAodGhpczogYW55KSB7XHJcbiAgICAgICAgY29uc3QgaW5zZXJ0UmVjb3JkczogYW55W10gPSBbXVxyXG4gICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICBpZiAocm93Ll9YX0lOU0VSVCkge1xyXG4gICAgICAgICAgICBpbnNlcnRSZWNvcmRzLnB1c2gocm93KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMudHJlZU9wdHMpXHJcbiAgICAgICAgcmV0dXJuIGluc2VydFJlY29yZHNcclxuICAgICAgfSxcclxuICAgICAgaW5zZXJ0ICh0aGlzOiBhbnksIHJlY29yZHM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmluc2VydEF0KHJlY29yZHMpXHJcbiAgICAgIH0sXHJcbiAgICAgIGluc2VydEF0ICh0aGlzOiBhbnksIHJlY29yZHM6IGFueSwgcm93OiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7IGZ1bGxUcmVlRGF0YSwgdGFibGVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgIGlmICghWEVVdGlscy5pc0FycmF5KHJlY29yZHMpKSB7XHJcbiAgICAgICAgICByZWNvcmRzID0gW3JlY29yZHNdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBuZXdSZWNvcmRzID0gcmVjb3Jkcy5tYXAoKHJlY29yZDogYW55KSA9PiB0aGlzLmRlZmluZUZpZWxkKE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICAgICAgX1hfRVhQQU5EOiBmYWxzZSxcclxuICAgICAgICAgIF9YX0lOU0VSVDogdHJ1ZSxcclxuICAgICAgICAgIF9YX0xFVkVMOiAwXHJcbiAgICAgICAgfSwgcmVjb3JkKSkpXHJcbiAgICAgICAgaWYgKCFyb3cpIHtcclxuICAgICAgICAgIGZ1bGxUcmVlRGF0YS51bnNoaWZ0LmFwcGx5KGZ1bGxUcmVlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICAgIHRhYmxlRGF0YS51bnNoaWZ0LmFwcGx5KHRhYmxlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHJvdyA9PT0gLTEpIHtcclxuICAgICAgICAgICAgZnVsbFRyZWVEYXRhLnB1c2guYXBwbHkoZnVsbFRyZWVEYXRhLCBuZXdSZWNvcmRzKVxyXG4gICAgICAgICAgICB0YWJsZURhdGEucHVzaC5hcHBseSh0YWJsZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKGZ1bGxUcmVlRGF0YSwgaXRlbSA9PiBpdGVtID09PSByb3csIHRyZWVPcHRzKVxyXG4gICAgICAgICAgICBpZiAoIW1hdGNoT2JqIHx8IG1hdGNoT2JqLmluZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcih0KCd2eGUuZXJyb3IudW5hYmxlSW5zZXJ0JykpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IHsgaXRlbXMsIGluZGV4LCBub2RlcyB9OiBhbnkgPSBtYXRjaE9ialxyXG4gICAgICAgICAgICBsZXQgcm93SW5kZXggPSB0YWJsZURhdGEuaW5kZXhPZihyb3cpXHJcbiAgICAgICAgICAgIGlmIChyb3dJbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgdGFibGVEYXRhLnNwbGljZS5hcHBseSh0YWJsZURhdGEsIFtyb3dJbmRleCwgMF0uY29uY2F0KG5ld1JlY29yZHMpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGl0ZW1zLnNwbGljZS5hcHBseShpdGVtcywgW2luZGV4LCAwXS5jb25jYXQobmV3UmVjb3JkcykpXHJcbiAgICAgICAgICAgIG5ld1JlY29yZHMuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgaXRlbS5fWF9MRVZFTCA9IG5vZGVzLmxlbmd0aCAtIDFcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0YWJsZURhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcm93OiBuZXdSZWNvcmRzLmxlbmd0aCA/IG5ld1JlY29yZHNbbmV3UmVjb3Jkcy5sZW5ndGggLSAxXSA6IG51bGwsXHJcbiAgICAgICAgICAgIHJvd3M6IG5ld1JlY29yZHNcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog6I635Y+W5bey5Yig6Zmk55qE5pWw5o2uXHJcbiAgICAgICAqL1xyXG4gICAgICBnZXRSZW1vdmVSZWNvcmRzICh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmVMaXN0XHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbW92ZVNlbGVjdGVkcyAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlQ2hlY2tib3hSb3coKVxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog5Yig6Zmk6YCJ5Lit5pWw5o2uXHJcbiAgICAgICAqL1xyXG4gICAgICByZW1vdmVDaGVja2JveFJvdyAodGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlKHRoaXMuZ2V0U2VsZWN0UmVjb3JkcygpKS50aGVuKChwYXJhbXM6IGFueSkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jbGVhclNlbGVjdGlvbigpXHJcbiAgICAgICAgICByZXR1cm4gcGFyYW1zXHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgcmVtb3ZlICh0aGlzOiBhbnksIHJvd3M6IGFueVtdKSB7XHJcbiAgICAgICAgY29uc3QgeyByZW1vdmVMaXN0LCBmdWxsVHJlZURhdGEsIHRyZWVPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgbGV0IHJlc3Q6IGFueVtdID0gW11cclxuICAgICAgICBpZiAoIXJvd3MpIHtcclxuICAgICAgICAgIHJvd3MgPSBmdWxsVHJlZURhdGFcclxuICAgICAgICB9IGVsc2UgaWYgKCFYRVV0aWxzLmlzQXJyYXkocm93cykpIHtcclxuICAgICAgICAgIHJvd3MgPSBbcm93c11cclxuICAgICAgICB9XHJcbiAgICAgICAgcm93cy5mb3JFYWNoKChyb3c6IGFueSkgPT4ge1xyXG4gICAgICAgICAgbGV0IG1hdGNoT2JqID0gWEVVdGlscy5maW5kVHJlZShmdWxsVHJlZURhdGEsIGl0ZW0gPT4gaXRlbSA9PT0gcm93LCB0cmVlT3B0cylcclxuICAgICAgICAgIGlmIChtYXRjaE9iaikge1xyXG4gICAgICAgICAgICBjb25zdCB7IGl0ZW0sIGl0ZW1zLCBpbmRleCwgcGFyZW50IH06IGFueSA9IG1hdGNoT2JqXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0luc2VydEJ5Um93KHJvdykpIHtcclxuICAgICAgICAgICAgICByZW1vdmVMaXN0LnB1c2gocm93KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICBsZXQgaXNFeHBhbmQgPSB0aGlzLmlzVHJlZUV4cGFuZEJ5Um93KHBhcmVudClcclxuICAgICAgICAgICAgICBpZiAoaXNFeHBhbmQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29sbGFwc2luZyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGl0ZW1zLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgICBpZiAoaXNFeHBhbmQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlRXhwYW5kaW5nKHBhcmVudClcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5oYW5kbGVDb2xsYXBzaW5nKGl0ZW0pXHJcbiAgICAgICAgICAgICAgaXRlbXMuc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgICAgICAgICAgIHRoaXMudGFibGVEYXRhLnNwbGljZSh0aGlzLnRhYmxlRGF0YS5pbmRleE9mKGl0ZW0pLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3QucHVzaChpdGVtKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRhYmxlRGF0YSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4geyByb3c6IHJlc3QubGVuZ3RoID8gcmVzdFtyZXN0Lmxlbmd0aCAtIDFdIDogbnVsbCwgcm93czogcmVzdCB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWkhOeQhum7mOiupOWxleW8gOagkeiKgueCuVxyXG4gICAgICAgKi9cclxuICAgICAgaGFuZGxlRGVmYXVsdFRyZWVFeHBhbmQgKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGxldCB7IHRyZWVDb25maWcsIHRyZWVPcHRzLCB0YWJsZUZ1bGxEYXRhIH0gPSB0aGlzXHJcbiAgICAgICAgaWYgKHRyZWVDb25maWcpIHtcclxuICAgICAgICAgIGxldCB7IGNoaWxkcmVuLCBleHBhbmRBbGwsIGV4cGFuZFJvd0tleXMgfSA9IHRyZWVPcHRzXHJcbiAgICAgICAgICBpZiAoZXhwYW5kQWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QWxsVHJlZUV4cGFuc2lvbih0cnVlKVxyXG4gICAgICAgICAgfSBlbHNlIGlmIChleHBhbmRSb3dLZXlzKSB7XHJcbiAgICAgICAgICAgIGxldCByb3drZXkgPSB0aGlzLnJvd0lkXHJcbiAgICAgICAgICAgIGV4cGFuZFJvd0tleXMuZm9yRWFjaCgocm93aWQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgIGxldCBtYXRjaE9iaiA9IFhFVXRpbHMuZmluZFRyZWUodGFibGVGdWxsRGF0YSwgaXRlbSA9PiByb3dpZCA9PT0gWEVVdGlscy5nZXQoaXRlbSwgcm93a2V5KSwgdHJlZU9wdHMpXHJcbiAgICAgICAgICAgICAgbGV0IHJvd0NoaWxkcmVuID0gbWF0Y2hPYmogPyBtYXRjaE9iai5pdGVtW2NoaWxkcmVuXSA6IDBcclxuICAgICAgICAgICAgICBpZiAocm93Q2hpbGRyZW4gJiYgcm93Q2hpbGRyZW4ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldFRyZWVFeHBhbnNpb24obWF0Y2hPYmouaXRlbSwgdHJ1ZSlcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog5a6a5LmJ5qCR5bGe5oCnXHJcbiAgICAgICAqL1xyXG4gICAgICB0b1ZpcnR1YWxUcmVlICh0aGlzOiBhbnksIHRyZWVEYXRhOiBhbnlbXSkge1xyXG4gICAgICAgIGxldCBmdWxsVHJlZVJvd01hcCA9IHRoaXMuZnVsbFRyZWVSb3dNYXBcclxuICAgICAgICBmdWxsVHJlZVJvd01hcC5jbGVhcigpXHJcbiAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0cmVlRGF0YSwgKGl0ZW0sIGluZGV4LCBpdGVtcywgcGF0aHMsIHBhcmVudCwgbm9kZXMpID0+IHtcclxuICAgICAgICAgIGl0ZW0uX1hfRVhQQU5EID0gZmFsc2VcclxuICAgICAgICAgIGl0ZW0uX1hfSU5TRVJUID0gZmFsc2VcclxuICAgICAgICAgIGl0ZW0uX1hfTEVWRUwgPSBub2Rlcy5sZW5ndGggLSAxXHJcbiAgICAgICAgICBmdWxsVHJlZVJvd01hcC5zZXQoaXRlbSwgeyBpdGVtLCBpbmRleCwgaXRlbXMsIHBhdGhzLCBwYXJlbnQsIG5vZGVzIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLmZ1bGxUcmVlRGF0YSA9IHRyZWVEYXRhLnNsaWNlKDApXHJcbiAgICAgICAgdGhpcy50YWJsZURhdGEgPSB0cmVlRGF0YS5zbGljZSgwKVxyXG4gICAgICAgIHJldHVybiB0cmVlRGF0YVxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog5bGV5byAL+aUtui1t+agkeiKgueCuVxyXG4gICAgICAgKi9cclxuICAgICAgdmlydHVhbEV4cGFuZCAodGhpczogYW55LCByb3c6IGFueSwgZXhwYW5kZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAocm93Ll9YX0VYUEFORCAhPT0gZXhwYW5kZWQpIHtcclxuICAgICAgICAgIGlmIChyb3cuX1hfRVhQQU5EKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29sbGFwc2luZyhyb3cpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUV4cGFuZGluZyhyb3cpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9LFxyXG4gICAgICAvLyDlsZXlvIDoioLngrlcclxuICAgICAgaGFuZGxlRXhwYW5kaW5nICh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgIGNvbnN0IHsgdGFibGVEYXRhLCB0cmVlT3B0cyB9ID0gdGhpc1xyXG4gICAgICAgICAgbGV0IGNoaWxkUm93cyA9IHJvd1t0cmVlT3B0cy5jaGlsZHJlbl1cclxuICAgICAgICAgIGxldCBleHBhbmRMaXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgICBsZXQgcm93SW5kZXggPSB0YWJsZURhdGEuaW5kZXhPZihyb3cpXHJcbiAgICAgICAgICBpZiAocm93SW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6ZSZ6K+v55qE5pON5L2c77yBJylcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUoY2hpbGRSb3dzLCAoaXRlbSwgaW5kZXgsIG9iaiwgcGF0aHMsIHBhcmVudCwgbm9kZXMpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFwYXJlbnQgfHwgcGFyZW50Ll9YX0VYUEFORCkge1xyXG4gICAgICAgICAgICAgIGV4cGFuZExpc3QucHVzaChpdGVtKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCB0cmVlT3B0cylcclxuICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSB0cnVlXHJcbiAgICAgICAgICB0YWJsZURhdGEuc3BsaWNlLmFwcGx5KHRhYmxlRGF0YSwgW3Jvd0luZGV4ICsgMSwgMF0uY29uY2F0KGV4cGFuZExpc3QpKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLy8g5pS26LW36IqC54K5XHJcbiAgICAgIGhhbmRsZUNvbGxhcHNpbmcgKHRoaXM6IGFueSwgcm93OiBhbnkpIHtcclxuICAgICAgICBpZiAodGhpcy5oYXNDaGlsZHMocm93KSkge1xyXG4gICAgICAgICAgY29uc3QgeyB0YWJsZURhdGEsIHRyZWVPcHRzIH0gPSB0aGlzXHJcbiAgICAgICAgICBsZXQgY2hpbGRSb3dzID0gcm93W3RyZWVPcHRzLmNoaWxkcmVuXVxyXG4gICAgICAgICAgbGV0IG5vZGVDaGlsZExpc3Q6IGFueVtdID0gW11cclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUoY2hpbGRSb3dzLCBpdGVtID0+IHtcclxuICAgICAgICAgICAgbm9kZUNoaWxkTGlzdC5wdXNoKGl0ZW0pXHJcbiAgICAgICAgICB9LCB0cmVlT3B0cylcclxuICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSBmYWxzZVxyXG4gICAgICAgICAgdGhpcy50YWJsZURhdGEgPSB0YWJsZURhdGEuZmlsdGVyKChpdGVtOiBhbnkpID0+IG5vZGVDaGlsZExpc3QuaW5kZXhPZihpdGVtKSA9PT0gLTEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog5bGV5byAL+aUtui1t+aJgOacieagkeiKgueCuVxyXG4gICAgICAgKi9cclxuICAgICAgdmlydHVhbEFsbEV4cGFuZCAodGhpczogYW55LCBleHBhbmRlZDogYm9vbGVhbikge1xyXG4gICAgICAgIGlmIChleHBhbmRlZCkge1xyXG4gICAgICAgICAgY29uc3QgdGFibGVMaXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgICByb3cuX1hfRVhQQU5EID0gZXhwYW5kZWRcclxuICAgICAgICAgICAgdGFibGVMaXN0LnB1c2gocm93KVxyXG4gICAgICAgICAgfSwgdGhpcy50cmVlT3B0cylcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGFibGVMaXN0XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUodGhpcy5mdWxsVHJlZURhdGEsIHJvdyA9PiB7XHJcbiAgICAgICAgICAgIHJvdy5fWF9FWFBBTkQgPSBleHBhbmRlZFxyXG4gICAgICAgICAgfSwgdGhpcy50cmVlT3B0cylcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGhpcy5mdWxsVHJlZURhdGEuc2xpY2UoMClcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGFibGVEYXRhXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIFZ1ZS5jb21wb25lbnQoVmlydHVhbFRyZWUubmFtZSwgVmlydHVhbFRyZWUpXHJcbn1cclxuXHJcbi8qKlxyXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOWunueOsOeugOWNleeahOiZmuaLn+agkeihqOagvFxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUgPSB7XHJcbiAgaW5zdGFsbCAoeHRhYmxlOiB0eXBlb2YgVlhFVGFibGUpIHtcclxuICAgIC8vIOazqOWGjOe7hOS7tlxyXG4gICAgcmVnaXN0ZXJDb21wb25lbnQoeHRhYmxlKVxyXG4gIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSkge1xyXG4gIHdpbmRvdy5WWEVUYWJsZS51c2UoVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZSlcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZVxyXG4iXX0=
