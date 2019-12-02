"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.VXETablePluginVirtualTree = void 0;

var _xeUtils = _interopRequireDefault(require("xe-utils/methods/xe-utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function countTreeExpand($xTree, prevRow) {
  var rowChildren = prevRow[$xTree.treeConfig.children];
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
      renderClass: function renderClass() {
        var _ref2;

        var tableProps = this.tableProps,
            vSize = this.vSize,
            maximize = this.maximize,
            treeConfig = this.treeConfig;
        return ['vxe-grid vxe-virtual-tree', (_ref2 = {}, _defineProperty(_ref2, "size--".concat(vSize), vSize), _defineProperty(_ref2, 't--animat', tableProps.optimization.animat), _defineProperty(_ref2, 'has--tree-line', treeConfig && treeConfig.line), _defineProperty(_ref2, 'is--maximize', maximize), _ref2)];
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
            fullTreeRowMap = this.fullTreeRowMap;
        var $table = params.$table,
            row = params.row,
            column = params.column;
        var treeNode = column.treeNode;

        if (treeNode && treeConfig && treeConfig.line) {
          var $xTree = this;
          var rowLevel = row._X_LEVEL;
          var matchObj = fullTreeRowMap.get(row);
          return [treeNode && treeConfig && treeConfig.line ? h('div', {
            "class": 'vxe-tree--line-wrapper'
          }, [h('div', {
            "class": 'vxe-tree--line',
            style: {
              height: "".concat(calcTreeLine($table, $xTree, matchObj), "px"),
              left: "".concat(rowLevel * (treeConfig.indent || 20) + (rowLevel ? 2 - getOffsetSize($xTree) : 0) + 16, "px")
            }
          })]) : null];
        }

        return [];
      },
      renderTreeIcon: function renderTreeIcon(params, h) {
        var _this2 = this;

        var isHidden = params.isHidden;
        var row = params.row;
        var _this$treeConfig = this.treeConfig,
            children = _this$treeConfig.children,
            indent = _this$treeConfig.indent,
            trigger = _this$treeConfig.trigger,
            iconOpen = _this$treeConfig.iconOpen,
            iconClose = _this$treeConfig.iconClose;
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

        return [h('span', {
          "class": 'vxe-tree--indent',
          style: {
            width: "".concat(row._X_LEVEL * (indent || 20), "px")
          }
        }), h('span', {
          "class": ['vxe-tree-wrapper', {
            'is--active': isAceived
          }],
          on: on
        }, rowChildren && rowChildren.length ? [h('span', {
          "class": 'vxe-tree--btn-wrapper'
        }, [h('i', {
          "class": ['vxe-tree--node-btn', isAceived ? iconOpen || GlobalConfig.icon.treeOpen : iconClose || GlobalConfig.icon.treeClose]
        })])] : [])];
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
        }, this.treeConfig);

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
        var childList = row[this.treeConfig.children];
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
        }, this.treeConfig);

        return insertRecords;
      },
      insert: function insert(records) {
        return this.insertAt(records);
      },
      insertAt: function insertAt(records, row) {
        var _this7 = this;

        var fullTreeData = this.fullTreeData,
            tableData = this.tableData,
            treeConfig = this.treeConfig;

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
            }, treeConfig);

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
            treeConfig = this.treeConfig;
        var rest = [];

        if (!rows) {
          rows = fullTreeData;
        } else if (!_xeUtils["default"].isArray(rows)) {
          rows = [rows];
        }

        rows.forEach(function (row) {
          var matchObj = _xeUtils["default"].findTree(fullTreeData, function (item) {
            return item === row;
          }, treeConfig);

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
            tableFullData = this.tableFullData;

        if (treeConfig) {
          var expandAll = treeConfig.expandAll,
              expandRowKeys = treeConfig.expandRowKeys;
          var children = treeConfig.children;

          if (expandAll) {
            this.setAllTreeExpansion(true);
          } else if (expandRowKeys) {
            var rowkey = this.rowId;
            expandRowKeys.forEach(function (rowid) {
              var matchObj = _xeUtils["default"].findTree(tableFullData, function (item) {
                return rowid === _xeUtils["default"].get(item, rowkey);
              }, treeConfig);

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
              treeConfig = this.treeConfig;
          var childRows = row[treeConfig.children];
          var expandList = [];
          var rowIndex = tableData.indexOf(row);

          if (rowIndex === -1) {
            throw new Error('错误的操作！');
          }

          _xeUtils["default"].eachTree(childRows, function (item, index, obj, paths, parent, nodes) {
            if (!parent || parent._X_EXPAND) {
              expandList.push(item);
            }
          }, treeConfig);

          row._X_EXPAND = true;
          tableData.splice.apply(tableData, [rowIndex + 1, 0].concat(expandList));
        }

        return this.tableData;
      },
      // 收起节点
      handleCollapsing: function handleCollapsing(row) {
        if (this.hasChilds(row)) {
          var tableData = this.tableData,
              treeConfig = this.treeConfig;
          var childRows = row[treeConfig.children];
          var nodeChildList = [];

          _xeUtils["default"].eachTree(childRows, function (item) {
            nodeChildList.push(item);
          }, treeConfig);

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
        }, this.treeConfig);

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbImNvdW50VHJlZUV4cGFuZCIsIiR4VHJlZSIsInByZXZSb3ciLCJyb3dDaGlsZHJlbiIsInRyZWVDb25maWciLCJjaGlsZHJlbiIsImNvdW50IiwiaXNUcmVlRXhwYW5kQnlSb3ciLCJpbmRleCIsImxlbmd0aCIsImdldE9mZnNldFNpemUiLCJ2U2l6ZSIsImNhbGNUcmVlTGluZSIsIiR0YWJsZSIsIm1hdGNoT2JqIiwiaXRlbXMiLCJleHBhbmRTaXplIiwicm93SGVpZ2h0IiwicmVnaXN0ZXJDb21wb25lbnQiLCJWdWUiLCJUYWJsZSIsIkdyaWQiLCJzZXR1cCIsInQiLCJHbG9iYWxDb25maWciLCJwcm9wS2V5cyIsIk9iamVjdCIsImtleXMiLCJwcm9wcyIsImZpbHRlciIsIm5hbWUiLCJpbmRleE9mIiwiVmlydHVhbFRyZWUiLCJkYXRhIiwicmVtb3ZlTGlzdCIsImNvbXB1dGVkIiwic2l6ZSIsIiRwYXJlbnQiLCJyZW5kZXJDbGFzcyIsInRhYmxlUHJvcHMiLCJtYXhpbWl6ZSIsIm9wdGltaXphdGlvbiIsImFuaW1hdCIsImxpbmUiLCJ0YWJsZUV4dGVuZFByb3BzIiwicmVzdCIsImZvckVhY2giLCJrZXkiLCJ3YXRjaCIsImNvbHVtbnMiLCJsb2FkQ29sdW1uIiwiaGFuZGxlQ29sdW1ucyIsInZhbHVlIiwibG9hZERhdGEiLCJjcmVhdGVkIiwiYXNzaWduIiwiZnVsbFRyZWVEYXRhIiwidGFibGVEYXRhIiwiZnVsbFRyZWVSb3dNYXAiLCJNYXAiLCJyZWxvYWREYXRhIiwibWV0aG9kcyIsInJlbmRlclRyZWVMaW5lIiwicGFyYW1zIiwiaCIsInJvdyIsImNvbHVtbiIsInRyZWVOb2RlIiwicm93TGV2ZWwiLCJfWF9MRVZFTCIsImdldCIsInN0eWxlIiwiaGVpZ2h0IiwibGVmdCIsImluZGVudCIsInJlbmRlclRyZWVJY29uIiwiaXNIaWRkZW4iLCJ0cmlnZ2VyIiwiaWNvbk9wZW4iLCJpY29uQ2xvc2UiLCJpc0FjZWl2ZWQiLCJvbiIsIl9YX0VYUEFORCIsImNsaWNrIiwidG9nZ2xlVHJlZUV4cGFuc2lvbiIsIndpZHRoIiwiaWNvbiIsInRyZWVPcGVuIiwidHJlZUNsb3NlIiwiX2xvYWRUcmVlRGF0YSIsIiRuZXh0VGljayIsInRoZW4iLCIkcmVmcyIsInhUYWJsZSIsInRvVmlydHVhbFRyZWUiLCJoYW5kbGVEZWZhdWx0VHJlZUV4cGFuZCIsInNldFRyZWVFeHBhbnNpb24iLCJyb3dzIiwiZXhwYW5kZWQiLCJYRVV0aWxzIiwiaXNBcnJheSIsInZpcnR1YWxFeHBhbmQiLCJzZXRBbGxUcmVlRXhwYW5zaW9uIiwidmlydHVhbEFsbEV4cGFuZCIsImdldFRyZWVFeHBhbmRSZWNvcmRzIiwiaGFzQ2hpbGRzIiwidHJlZUV4cGFuZFJlY29yZHMiLCJlYWNoVHJlZSIsInB1c2giLCJjbGVhclRyZWVFeHBhbmQiLCJtYXAiLCJjb25mIiwic2xvdHMiLCJjaGlsZExpc3QiLCJnZXRSZWNvcmRzZXQiLCJpbnNlcnRSZWNvcmRzIiwiZ2V0SW5zZXJ0UmVjb3JkcyIsInJlbW92ZVJlY29yZHMiLCJnZXRSZW1vdmVSZWNvcmRzIiwidXBkYXRlUmVjb3JkcyIsImdldFVwZGF0ZVJlY29yZHMiLCJpc0luc2VydEJ5Um93IiwiX1hfSU5TRVJUIiwiaW5zZXJ0IiwicmVjb3JkcyIsImluc2VydEF0IiwibmV3UmVjb3JkcyIsInJlY29yZCIsImRlZmluZUZpZWxkIiwidW5zaGlmdCIsImFwcGx5IiwiZmluZFRyZWUiLCJpdGVtIiwiRXJyb3IiLCJub2RlcyIsInJvd0luZGV4Iiwic3BsaWNlIiwiY29uY2F0IiwicmVtb3ZlU2VsZWN0ZWRzIiwicmVtb3ZlIiwiZ2V0U2VsZWN0UmVjb3JkcyIsImNsZWFyU2VsZWN0aW9uIiwicGFyZW50IiwiaXNFeHBhbmQiLCJoYW5kbGVDb2xsYXBzaW5nIiwiaGFuZGxlRXhwYW5kaW5nIiwidGFibGVGdWxsRGF0YSIsImV4cGFuZEFsbCIsImV4cGFuZFJvd0tleXMiLCJyb3drZXkiLCJyb3dJZCIsInJvd2lkIiwidHJlZURhdGEiLCJjbGVhciIsInBhdGhzIiwic2V0Iiwic2xpY2UiLCJjaGlsZFJvd3MiLCJleHBhbmRMaXN0Iiwib2JqIiwibm9kZUNoaWxkTGlzdCIsImNvbXBvbmVudCIsIlZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUiLCJpbnN0YWxsIiwieHRhYmxlIiwid2luZG93IiwiVlhFVGFibGUiLCJ1c2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7Ozs7O0FBR0EsU0FBU0EsZUFBVCxDQUF5QkMsTUFBekIsRUFBc0NDLE9BQXRDLEVBQWtEO0FBQ2hELE1BQU1DLFdBQVcsR0FBR0QsT0FBTyxDQUFDRCxNQUFNLENBQUNHLFVBQVAsQ0FBa0JDLFFBQW5CLENBQTNCO0FBQ0EsTUFBSUMsS0FBSyxHQUFHLENBQVo7O0FBQ0EsTUFBSUwsTUFBTSxDQUFDTSxpQkFBUCxDQUF5QkwsT0FBekIsQ0FBSixFQUF1QztBQUNyQyxTQUFLLElBQUlNLEtBQUssR0FBRyxDQUFqQixFQUFvQkEsS0FBSyxHQUFHTCxXQUFXLENBQUNNLE1BQXhDLEVBQWdERCxLQUFLLEVBQXJELEVBQXlEO0FBQ3ZERixNQUFBQSxLQUFLLElBQUlOLGVBQWUsQ0FBQ0MsTUFBRCxFQUFTRSxXQUFXLENBQUNLLEtBQUQsQ0FBcEIsQ0FBeEI7QUFDRDtBQUNGOztBQUNELFNBQU9GLEtBQVA7QUFDRDs7QUFFRCxTQUFTSSxhQUFULENBQXVCVCxNQUF2QixFQUFrQztBQUNoQyxVQUFRQSxNQUFNLENBQUNVLEtBQWY7QUFDRSxTQUFLLE1BQUw7QUFDRSxhQUFPLENBQVA7O0FBQ0YsU0FBSyxPQUFMO0FBQ0UsYUFBTyxDQUFQOztBQUNGLFNBQUssUUFBTDtBQUNFLGFBQU8sQ0FBUDtBQU5KOztBQVFBLFNBQU8sQ0FBUDtBQUNEOztBQUVELFNBQVNDLFlBQVQsQ0FBc0JDLE1BQXRCLEVBQW1DWixNQUFuQyxFQUFnRGEsUUFBaEQsRUFBNkQ7QUFBQSxNQUNuRE4sS0FEbUQsR0FDbENNLFFBRGtDLENBQ25ETixLQURtRDtBQUFBLE1B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UDs7O0FBR0E4QyxNQUFBQSxnQkFsVU8sNEJBa1VxQkwsUUFsVXJCLEVBa1VrQztBQUFBOztBQUN2Q0MsNEJBQVFRLFFBQVIsQ0FBaUIsS0FBS25ELFlBQXRCLEVBQW9DLFVBQUFTLEdBQUcsRUFBRztBQUN4QyxVQUFBLE9BQUksQ0FBQ29DLGFBQUwsQ0FBbUJwQyxHQUFuQixFQUF3QmlDLFFBQXhCO0FBQ0QsU0FGRCxFQUVHLEtBQUs5RixVQUZSOztBQUdBLGVBQU8sS0FBS3FELFNBQVo7QUFDRDtBQXZVTTtBQWpEYyxHQUF6QjtBQTRYQXRDLEVBQUFBLEdBQUcsQ0FBQzhJLFNBQUosQ0FBY2pJLFdBQVcsQ0FBQ0YsSUFBMUIsRUFBZ0NFLFdBQWhDO0FBQ0Q7QUFFRDs7Ozs7QUFHTyxJQUFNa0kseUJBQXlCLEdBQUc7QUFDdkNDLEVBQUFBLE9BRHVDLG1CQUMvQkMsTUFEK0IsRUFDUjtBQUM3QjtBQUNBbEosSUFBQUEsaUJBQWlCLENBQUNrSixNQUFELENBQWpCO0FBQ0Q7QUFKc0MsQ0FBbEM7OztBQU9QLElBQUksT0FBT0MsTUFBUCxLQUFrQixXQUFsQixJQUFpQ0EsTUFBTSxDQUFDQyxRQUE1QyxFQUFzRDtBQUNwREQsRUFBQUEsTUFBTSxDQUFDQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQkwseUJBQXBCO0FBQ0Q7O2VBRWNBLHlCIiwiZmlsZSI6ImluZGV4LmNvbW1vbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBYRVV0aWxzIGZyb20gJ3hlLXV0aWxzL21ldGhvZHMveGUtdXRpbHMnXHJcbmltcG9ydCBWWEVUYWJsZSBmcm9tICd2eGUtdGFibGUvbGliL3Z4ZS10YWJsZSdcclxuXHJcbmZ1bmN0aW9uIGNvdW50VHJlZUV4cGFuZCgkeFRyZWU6IGFueSwgcHJldlJvdzogYW55KTogbnVtYmVyIHtcclxuICBjb25zdCByb3dDaGlsZHJlbiA9IHByZXZSb3dbJHhUcmVlLnRyZWVDb25maWcuY2hpbGRyZW5dXHJcbiAgbGV0IGNvdW50ID0gMVxyXG4gIGlmICgkeFRyZWUuaXNUcmVlRXhwYW5kQnlSb3cocHJldlJvdykpIHtcclxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByb3dDaGlsZHJlbi5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgICAgY291bnQgKz0gY291bnRUcmVlRXhwYW5kKCR4VHJlZSwgcm93Q2hpbGRyZW5baW5kZXhdKVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gY291bnRcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0T2Zmc2V0U2l6ZSgkeFRyZWU6IGFueSk6IG51bWJlciB7XHJcbiAgc3dpdGNoICgkeFRyZWUudlNpemUpIHtcclxuICAgIGNhc2UgJ21pbmknOlxyXG4gICAgICByZXR1cm4gM1xyXG4gICAgY2FzZSAnc21hbGwnOlxyXG4gICAgICByZXR1cm4gMlxyXG4gICAgY2FzZSAnbWVkaXVtJzpcclxuICAgICAgcmV0dXJuIDFcclxuICB9XHJcbiAgcmV0dXJuIDBcclxufVxyXG5cclxuZnVuY3Rpb24gY2FsY1RyZWVMaW5lKCR0YWJsZTogYW55LCAkeFRyZWU6IGFueSwgbWF0Y2hPYmo6IGFueSk6IG51bWJlciB7XHJcbiAgY29uc3QgeyBpbmRleCwgaXRlbXMgfSA9IG1hdGNoT2JqXHJcbiAgbGV0IGV4cGFuZFNpemUgPSAxXHJcbiAgaWYgKGluZGV4KSB7XHJcbiAgICBleHBhbmRTaXplID0gY291bnRUcmVlRXhwYW5kKCR4VHJlZSwgaXRlbXNbaW5kZXggLSAxXSlcclxuICB9XHJcbiAgcmV0dXJuICR0YWJsZS5yb3dIZWlnaHQgKiBleHBhbmRTaXplIC0gKGluZGV4ID8gMSA6ICgxMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSkpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50KHsgVnVlLCBUYWJsZSwgR3JpZCwgc2V0dXAsIHQgfTogdHlwZW9mIFZYRVRhYmxlKSB7XHJcblxyXG4gIGNvbnN0IEdsb2JhbENvbmZpZyA9IHNldHVwKClcclxuICBjb25zdCBwcm9wS2V5cyA9IE9iamVjdC5rZXlzKFRhYmxlLnByb3BzKS5maWx0ZXIobmFtZSA9PiBbJ2RhdGEnLCAndHJlZUNvbmZpZyddLmluZGV4T2YobmFtZSkgPT09IC0xKVxyXG5cclxuICBjb25zdCBWaXJ0dWFsVHJlZTogYW55ID0ge1xyXG4gICAgbmFtZTogJ1Z4ZVZpcnR1YWxUcmVlJyxcclxuICAgIGV4dGVuZHM6IEdyaWQsXHJcbiAgICBkYXRhKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlbW92ZUxpc3Q6IFtdXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjb21wdXRlZDoge1xyXG4gICAgICB2U2l6ZSh0aGlzOiBhbnkpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNpemUgfHwgdGhpcy4kcGFyZW50LnNpemUgfHwgdGhpcy4kcGFyZW50LnZTaXplXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbmRlckNsYXNzKHRoaXM6IGFueSk6IGFueSB7XHJcbiAgICAgICAgY29uc3QgeyB0YWJsZVByb3BzLCB2U2l6ZSwgbWF4aW1pemUsIHRyZWVDb25maWcgfSA9IHRoaXNcclxuICAgICAgICByZXR1cm4gWyd2eGUtZ3JpZCB2eGUtdmlydHVhbC10cmVlJywge1xyXG4gICAgICAgICAgW2BzaXplLS0ke3ZTaXplfWBdOiB2U2l6ZSxcclxuICAgICAgICAgICd0LS1hbmltYXQnOiB0YWJsZVByb3BzLm9wdGltaXphdGlvbi5hbmltYXQsXHJcbiAgICAgICAgICAnaGFzLS10cmVlLWxpbmUnOiB0cmVlQ29uZmlnICYmIHRyZWVDb25maWcubGluZSxcclxuICAgICAgICAgICdpcy0tbWF4aW1pemUnOiBtYXhpbWl6ZVxyXG4gICAgICAgIH1dXHJcbiAgICAgIH0sXHJcbiAgICAgIHRhYmxlRXh0ZW5kUHJvcHModGhpczogYW55KTogYW55IHtcclxuICAgICAgICBsZXQgcmVzdDogYW55ID0ge31cclxuICAgICAgICBwcm9wS2V5cy5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgICByZXN0W2tleV0gPSB0aGlzW2tleV1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiByZXN0XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB3YXRjaDoge1xyXG4gICAgICBjb2x1bW5zKHRoaXM6IGFueSk6IGFueSB7XHJcbiAgICAgICAgdGhpcy5sb2FkQ29sdW1uKHRoaXMuaGFuZGxlQ29sdW1ucygpKVxyXG4gICAgICB9LFxyXG4gICAgICBkYXRhKHRoaXM6IGFueSwgdmFsdWU6IGFueVtdKTogYW55IHtcclxuICAgICAgICB0aGlzLmxvYWREYXRhKHZhbHVlKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY3JlYXRlZCh0aGlzOiBhbnkpOiBhbnkge1xyXG4gICAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXNcclxuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCB7XHJcbiAgICAgICAgZnVsbFRyZWVEYXRhOiBbXSxcclxuICAgICAgICB0YWJsZURhdGE6IFtdLFxyXG4gICAgICAgIGZ1bGxUcmVlUm93TWFwOiBuZXcgTWFwKClcclxuICAgICAgfSlcclxuICAgICAgdGhpcy5oYW5kbGVDb2x1bW5zKClcclxuICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICB0aGlzLnJlbG9hZERhdGEoZGF0YSlcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1ldGhvZHM6IHtcclxuICAgICAgcmVuZGVyVHJlZUxpbmUodGhpczogYW55LCBwYXJhbXM6IGFueSwgaDogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyB0cmVlQ29uZmlnLCBmdWxsVHJlZVJvd01hcCB9ID0gdGhpc1xyXG4gICAgICAgIGNvbnN0IHsgJHRhYmxlLCByb3csIGNvbHVtbiB9ID0gcGFyYW1zXHJcbiAgICAgICAgY29uc3QgeyB0cmVlTm9kZSB9ID0gY29sdW1uXHJcbiAgICAgICAgaWYgKHRyZWVOb2RlICYmIHRyZWVDb25maWcgJiYgdHJlZUNvbmZpZy5saW5lKSB7XHJcbiAgICAgICAgICBjb25zdCAkeFRyZWUgPSB0aGlzXHJcbiAgICAgICAgICBjb25zdCByb3dMZXZlbCA9IHJvdy5fWF9MRVZFTFxyXG4gICAgICAgICAgY29uc3QgbWF0Y2hPYmogPSBmdWxsVHJlZVJvd01hcC5nZXQocm93KVxyXG4gICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgdHJlZU5vZGUgJiYgdHJlZUNvbmZpZyAmJiB0cmVlQ29uZmlnLmxpbmUgPyBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgY2xhc3M6ICd2eGUtdHJlZS0tbGluZS13cmFwcGVyJ1xyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgY2xhc3M6ICd2eGUtdHJlZS0tbGluZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6IGAke2NhbGNUcmVlTGluZSgkdGFibGUsICR4VHJlZSwgbWF0Y2hPYmopfXB4YCxcclxuICAgICAgICAgICAgICAgICAgbGVmdDogYCR7cm93TGV2ZWwgKiAodHJlZUNvbmZpZy5pbmRlbnQgfHwgMjApICsgKHJvd0xldmVsID8gMiAtIGdldE9mZnNldFNpemUoJHhUcmVlKSA6IDApICsgMTZ9cHhgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgXSkgOiBudWxsXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbXVxyXG4gICAgICB9LFxyXG4gICAgICByZW5kZXJUcmVlSWNvbih0aGlzOiBhbnksIHBhcmFtczogYW55LCBoOiBhbnkpIHtcclxuICAgICAgICBsZXQgeyBpc0hpZGRlbiB9ID0gcGFyYW1zXHJcbiAgICAgICAgbGV0IHsgcm93IH0gPSBwYXJhbXNcclxuICAgICAgICBsZXQgeyBjaGlsZHJlbiwgaW5kZW50LCB0cmlnZ2VyLCBpY29uT3BlbiwgaWNvbkNsb3NlIH0gPSB0aGlzLnRyZWVDb25maWdcclxuICAgICAgICBsZXQgcm93Q2hpbGRyZW4gPSByb3dbY2hpbGRyZW5dXHJcbiAgICAgICAgbGV0IGlzQWNlaXZlZCA9IGZhbHNlXHJcbiAgICAgICAgbGV0IG9uOiBhbnkgPSB7fVxyXG4gICAgICAgIGlmICghaXNIaWRkZW4pIHtcclxuICAgICAgICAgIGlzQWNlaXZlZCA9IHJvdy5fWF9FWFBBTkRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0cmlnZ2VyIHx8IHRyaWdnZXIgPT09ICdkZWZhdWx0Jykge1xyXG4gICAgICAgICAgb24uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZVRyZWVFeHBhbnNpb24ocm93KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgaCgnc3BhbicsIHtcclxuICAgICAgICAgICAgY2xhc3M6ICd2eGUtdHJlZS0taW5kZW50JyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICB3aWR0aDogYCR7cm93Ll9YX0xFVkVMICogKGluZGVudCB8fCAyMCl9cHhgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgaCgnc3BhbicsIHtcclxuICAgICAgICAgICAgY2xhc3M6IFsndnhlLXRyZWUtd3JhcHBlcicsIHtcclxuICAgICAgICAgICAgICAnaXMtLWFjdGl2ZSc6IGlzQWNlaXZlZFxyXG4gICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgb25cclxuICAgICAgICAgIH0sIHJvd0NoaWxkcmVuICYmIHJvd0NoaWxkcmVuLmxlbmd0aCA/IFtcclxuICAgICAgICAgICAgaCgnc3BhbicsIHtcclxuICAgICAgICAgICAgICBjbGFzczogJ3Z4ZS10cmVlLS1idG4td3JhcHBlcidcclxuICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgIGgoJ2knLCB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogWyd2eGUtdHJlZS0tbm9kZS1idG4nLCBpc0FjZWl2ZWQgPyAoaWNvbk9wZW4gfHwgR2xvYmFsQ29uZmlnLmljb24udHJlZU9wZW4pIDogKGljb25DbG9zZSB8fCBHbG9iYWxDb25maWcuaWNvbi50cmVlQ2xvc2UpXVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICBdIDogW10pXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICBfbG9hZFRyZWVEYXRhKHRoaXM6IGFueSwgZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJG5leHRUaWNrKCkudGhlbigoKSA9PiB0aGlzLiRyZWZzLnhUYWJsZS5sb2FkRGF0YShkYXRhKSlcclxuICAgICAgfSxcclxuICAgICAgbG9hZERhdGEoZGF0YTogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRvVmlydHVhbFRyZWUoZGF0YSkpXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbG9hZERhdGEodGhpczogYW55LCBkYXRhOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4kbmV4dFRpY2soKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy4kcmVmcy54VGFibGUucmVsb2FkRGF0YSh0aGlzLnRvVmlydHVhbFRyZWUoZGF0YSkpKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5oYW5kbGVEZWZhdWx0VHJlZUV4cGFuZCgpKVxyXG4gICAgICB9LFxyXG4gICAgICBpc1RyZWVFeHBhbmRCeVJvdyhyb3c6IGFueSkge1xyXG4gICAgICAgIHJldHVybiAhIXJvdy5fWF9FWFBBTkRcclxuICAgICAgfSxcclxuICAgICAgc2V0VHJlZUV4cGFuc2lvbih0aGlzOiBhbnksIHJvd3M6IGFueSwgZXhwYW5kZWQ6IGFueSkge1xyXG4gICAgICAgIGlmIChyb3dzKSB7XHJcbiAgICAgICAgICBpZiAoIVhFVXRpbHMuaXNBcnJheShyb3dzKSkge1xyXG4gICAgICAgICAgICByb3dzID0gW3Jvd3NdXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByb3dzLmZvckVhY2goKHJvdzogYW55KSA9PiB0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhIWV4cGFuZGVkKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnRhYmxlRGF0YSlcclxuICAgICAgfSxcclxuICAgICAgc2V0QWxsVHJlZUV4cGFuc2lvbihleHBhbmRlZDogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnZpcnR1YWxBbGxFeHBhbmQoZXhwYW5kZWQpKVxyXG4gICAgICB9LFxyXG4gICAgICB0b2dnbGVUcmVlRXhwYW5zaW9uKHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRUcmVlRGF0YSh0aGlzLnZpcnR1YWxFeHBhbmQocm93LCAhcm93Ll9YX0VYUEFORCkpXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldFRyZWVFeHBhbmRSZWNvcmRzKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGhhc0NoaWxkcyA9IHRoaXMuaGFzQ2hpbGRzXHJcbiAgICAgICAgY29uc3QgdHJlZUV4cGFuZFJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgaWYgKHJvdy5fWF9FWFBBTkQgJiYgaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgICAgdHJlZUV4cGFuZFJlY29yZHMucHVzaChyb3cpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcy50cmVlQ29uZmlnKVxyXG4gICAgICAgIHJldHVybiB0cmVlRXhwYW5kUmVjb3Jkc1xyXG4gICAgICB9LFxyXG4gICAgICBjbGVhclRyZWVFeHBhbmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWxsVHJlZUV4cGFuc2lvbihmYWxzZSlcclxuICAgICAgfSxcclxuICAgICAgaGFuZGxlQ29sdW1ucyh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5zLm1hcCgoY29uZjogYW55KSA9PiB7XHJcbiAgICAgICAgICBpZiAoY29uZi50cmVlTm9kZSkge1xyXG4gICAgICAgICAgICBsZXQgc2xvdHMgPSBjb25mLnNsb3RzIHx8IHt9XHJcbiAgICAgICAgICAgIHNsb3RzLmljb24gPSB0aGlzLnJlbmRlclRyZWVJY29uXHJcbiAgICAgICAgICAgIHNsb3RzLmxpbmUgPSB0aGlzLnJlbmRlclRyZWVMaW5lXHJcbiAgICAgICAgICAgIGNvbmYuc2xvdHMgPSBzbG90c1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGNvbmZcclxuICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICBoYXNDaGlsZHModGhpczogYW55LCByb3c6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGNoaWxkTGlzdCA9IHJvd1t0aGlzLnRyZWVDb25maWcuY2hpbGRyZW5dXHJcbiAgICAgICAgcmV0dXJuIGNoaWxkTGlzdCAmJiBjaGlsZExpc3QubGVuZ3RoXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDojrflj5booajmoLzmlbDmja7pm4bvvIzljIXlkKvmlrDlop7jgIHliKDpmaTjgIHkv67mlLlcclxuICAgICAgICovXHJcbiAgICAgIGdldFJlY29yZHNldCh0aGlzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaW5zZXJ0UmVjb3JkczogdGhpcy5nZXRJbnNlcnRSZWNvcmRzKCksXHJcbiAgICAgICAgICByZW1vdmVSZWNvcmRzOiB0aGlzLmdldFJlbW92ZVJlY29yZHMoKSxcclxuICAgICAgICAgIHVwZGF0ZVJlY29yZHM6IHRoaXMuZ2V0VXBkYXRlUmVjb3JkcygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBpc0luc2VydEJ5Um93KHJvdzogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuICEhcm93Ll9YX0lOU0VSVFxyXG4gICAgICB9LFxyXG4gICAgICBnZXRJbnNlcnRSZWNvcmRzKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGluc2VydFJlY29yZHM6IGFueVtdID0gW11cclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRoaXMuZnVsbFRyZWVEYXRhLCByb3cgPT4ge1xyXG4gICAgICAgICAgaWYgKHJvdy5fWF9JTlNFUlQpIHtcclxuICAgICAgICAgICAgaW5zZXJ0UmVjb3Jkcy5wdXNoKHJvdylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzLnRyZWVDb25maWcpXHJcbiAgICAgICAgcmV0dXJuIGluc2VydFJlY29yZHNcclxuICAgICAgfSxcclxuICAgICAgaW5zZXJ0KHRoaXM6IGFueSwgcmVjb3JkczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5zZXJ0QXQocmVjb3JkcylcclxuICAgICAgfSxcclxuICAgICAgaW5zZXJ0QXQodGhpczogYW55LCByZWNvcmRzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyBmdWxsVHJlZURhdGEsIHRhYmxlRGF0YSwgdHJlZUNvbmZpZyB9ID0gdGhpc1xyXG4gICAgICAgIGlmICghWEVVdGlscy5pc0FycmF5KHJlY29yZHMpKSB7XHJcbiAgICAgICAgICByZWNvcmRzID0gW3JlY29yZHNdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBuZXdSZWNvcmRzID0gcmVjb3Jkcy5tYXAoKHJlY29yZDogYW55KSA9PiB0aGlzLmRlZmluZUZpZWxkKE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICAgICAgX1hfRVhQQU5EOiBmYWxzZSxcclxuICAgICAgICAgIF9YX0lOU0VSVDogdHJ1ZSxcclxuICAgICAgICAgIF9YX0xFVkVMOiAwXHJcbiAgICAgICAgfSwgcmVjb3JkKSkpXHJcbiAgICAgICAgaWYgKCFyb3cpIHtcclxuICAgICAgICAgIGZ1bGxUcmVlRGF0YS51bnNoaWZ0LmFwcGx5KGZ1bGxUcmVlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICAgIHRhYmxlRGF0YS51bnNoaWZ0LmFwcGx5KHRhYmxlRGF0YSwgbmV3UmVjb3JkcylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHJvdyA9PT0gLTEpIHtcclxuICAgICAgICAgICAgZnVsbFRyZWVEYXRhLnB1c2guYXBwbHkoZnVsbFRyZWVEYXRhLCBuZXdSZWNvcmRzKVxyXG4gICAgICAgICAgICB0YWJsZURhdGEucHVzaC5hcHBseSh0YWJsZURhdGEsIG5ld1JlY29yZHMpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKGZ1bGxUcmVlRGF0YSwgaXRlbSA9PiBpdGVtID09PSByb3csIHRyZWVDb25maWcpXHJcbiAgICAgICAgICAgIGlmICghbWF0Y2hPYmogfHwgbWF0Y2hPYmouaW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHQoJ3Z4ZS5lcnJvci51bmFibGVJbnNlcnQnKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgeyBpdGVtcywgaW5kZXgsIG5vZGVzIH06IGFueSA9IG1hdGNoT2JqXHJcbiAgICAgICAgICAgIGxldCByb3dJbmRleCA9IHRhYmxlRGF0YS5pbmRleE9mKHJvdylcclxuICAgICAgICAgICAgaWYgKHJvd0luZGV4ID4gLTEpIHtcclxuICAgICAgICAgICAgICB0YWJsZURhdGEuc3BsaWNlLmFwcGx5KHRhYmxlRGF0YSwgW3Jvd0luZGV4LCAwXS5jb25jYXQobmV3UmVjb3JkcykpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaXRlbXMuc3BsaWNlLmFwcGx5KGl0ZW1zLCBbaW5kZXgsIDBdLmNvbmNhdChuZXdSZWNvcmRzKSlcclxuICAgICAgICAgICAgbmV3UmVjb3Jkcy5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICBpdGVtLl9YX0xFVkVMID0gbm9kZXMubGVuZ3RoIC0gMVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFRyZWVEYXRhKHRhYmxlRGF0YSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByb3c6IG5ld1JlY29yZHMubGVuZ3RoID8gbmV3UmVjb3Jkc1tuZXdSZWNvcmRzLmxlbmd0aCAtIDFdIDogbnVsbCxcclxuICAgICAgICAgICAgcm93czogbmV3UmVjb3Jkc1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDojrflj5blt7LliKDpmaTnmoTmlbDmja5cclxuICAgICAgICovXHJcbiAgICAgIGdldFJlbW92ZVJlY29yZHModGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdFxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog5Yig6Zmk6YCJ5Lit5pWw5o2uXHJcbiAgICAgICAqL1xyXG4gICAgICByZW1vdmVTZWxlY3RlZHModGhpczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlKHRoaXMuZ2V0U2VsZWN0UmVjb3JkcygpKS50aGVuKChwYXJhbXM6IGFueSkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jbGVhclNlbGVjdGlvbigpXHJcbiAgICAgICAgICByZXR1cm4gcGFyYW1zXHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgcmVtb3ZlKHRoaXM6IGFueSwgcm93czogYW55KSB7XHJcbiAgICAgICAgY29uc3QgeyByZW1vdmVMaXN0LCBmdWxsVHJlZURhdGEsIHRyZWVDb25maWcgfSA9IHRoaXNcclxuICAgICAgICBsZXQgcmVzdDogYW55W10gPSBbXVxyXG4gICAgICAgIGlmICghcm93cykge1xyXG4gICAgICAgICAgcm93cyA9IGZ1bGxUcmVlRGF0YVxyXG4gICAgICAgIH0gZWxzZSBpZiAoIVhFVXRpbHMuaXNBcnJheShyb3dzKSkge1xyXG4gICAgICAgICAgcm93cyA9IFtyb3dzXVxyXG4gICAgICAgIH1cclxuICAgICAgICByb3dzLmZvckVhY2goKHJvdzogYW55KSA9PiB7XHJcbiAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKGZ1bGxUcmVlRGF0YSwgaXRlbSA9PiBpdGVtID09PSByb3csIHRyZWVDb25maWcpXHJcbiAgICAgICAgICBpZiAobWF0Y2hPYmopIHtcclxuICAgICAgICAgICAgY29uc3QgeyBpdGVtLCBpdGVtcywgaW5kZXgsIHBhcmVudCB9OiBhbnkgPSBtYXRjaE9ialxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbnNlcnRCeVJvdyhyb3cpKSB7XHJcbiAgICAgICAgICAgICAgcmVtb3ZlTGlzdC5wdXNoKHJvdylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgbGV0IGlzRXhwYW5kID0gdGhpcy5pc1RyZWVFeHBhbmRCeVJvdyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUNvbGxhcHNpbmcocGFyZW50KVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpdGVtcy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgICAgaWYgKGlzRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUV4cGFuZGluZyhwYXJlbnQpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29sbGFwc2luZyhpdGVtKVxyXG4gICAgICAgICAgICAgIGl0ZW1zLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgICB0aGlzLnRhYmxlRGF0YS5zcGxpY2UodGhpcy50YWJsZURhdGEuaW5kZXhPZihpdGVtKSwgMSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkVHJlZURhdGEodGhpcy50YWJsZURhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHsgcm93OiByZXN0Lmxlbmd0aCA/IHJlc3RbcmVzdC5sZW5ndGggLSAxXSA6IG51bGwsIHJvd3M6IHJlc3QgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDlpITnkIbpu5jorqTlsZXlvIDmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIGhhbmRsZURlZmF1bHRUcmVlRXhwYW5kKHRoaXM6IGFueSkge1xyXG4gICAgICAgIGxldCB7IHRyZWVDb25maWcsIHRhYmxlRnVsbERhdGEgfSA9IHRoaXNcclxuICAgICAgICBpZiAodHJlZUNvbmZpZykge1xyXG4gICAgICAgICAgbGV0IHsgZXhwYW5kQWxsLCBleHBhbmRSb3dLZXlzIH0gPSB0cmVlQ29uZmlnXHJcbiAgICAgICAgICBsZXQgeyBjaGlsZHJlbiB9ID0gdHJlZUNvbmZpZ1xyXG4gICAgICAgICAgaWYgKGV4cGFuZEFsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEFsbFRyZWVFeHBhbnNpb24odHJ1ZSlcclxuICAgICAgICAgIH0gZWxzZSBpZiAoZXhwYW5kUm93S2V5cykge1xyXG4gICAgICAgICAgICBsZXQgcm93a2V5ID0gdGhpcy5yb3dJZFxyXG4gICAgICAgICAgICBleHBhbmRSb3dLZXlzLmZvckVhY2goKHJvd2lkOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgbWF0Y2hPYmogPSBYRVV0aWxzLmZpbmRUcmVlKHRhYmxlRnVsbERhdGEsIGl0ZW0gPT4gcm93aWQgPT09IFhFVXRpbHMuZ2V0KGl0ZW0sIHJvd2tleSksIHRyZWVDb25maWcpXHJcbiAgICAgICAgICAgICAgbGV0IHJvd0NoaWxkcmVuID0gbWF0Y2hPYmogPyBtYXRjaE9iai5pdGVtW2NoaWxkcmVuXSA6IDBcclxuICAgICAgICAgICAgICBpZiAocm93Q2hpbGRyZW4gJiYgcm93Q2hpbGRyZW4ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldFRyZWVFeHBhbnNpb24obWF0Y2hPYmouaXRlbSwgdHJ1ZSlcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICog5a6a5LmJ5qCR5bGe5oCnXHJcbiAgICAgICAqL1xyXG4gICAgICB0b1ZpcnR1YWxUcmVlKHRoaXM6IGFueSwgdHJlZURhdGE6IGFueVtdKSB7XHJcbiAgICAgICAgbGV0IGZ1bGxUcmVlUm93TWFwID0gdGhpcy5mdWxsVHJlZVJvd01hcFxyXG4gICAgICAgIGZ1bGxUcmVlUm93TWFwLmNsZWFyKClcclxuICAgICAgICBYRVV0aWxzLmVhY2hUcmVlKHRyZWVEYXRhLCAoaXRlbSwgaW5kZXgsIGl0ZW1zLCBwYXRocywgcGFyZW50LCBub2RlcykgPT4ge1xyXG4gICAgICAgICAgaXRlbS5fWF9FWFBBTkQgPSBmYWxzZVxyXG4gICAgICAgICAgaXRlbS5fWF9JTlNFUlQgPSBmYWxzZVxyXG4gICAgICAgICAgaXRlbS5fWF9MRVZFTCA9IG5vZGVzLmxlbmd0aCAtIDFcclxuICAgICAgICAgIGZ1bGxUcmVlUm93TWFwLnNldChpdGVtLCB7IGl0ZW0sIGluZGV4LCBpdGVtcywgcGF0aHMsIHBhcmVudCwgbm9kZXMgfSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuZnVsbFRyZWVEYXRhID0gdHJlZURhdGEuc2xpY2UoMClcclxuICAgICAgICB0aGlzLnRhYmxlRGF0YSA9IHRyZWVEYXRhLnNsaWNlKDApXHJcbiAgICAgICAgcmV0dXJuIHRyZWVEYXRhXHJcbiAgICAgIH0sXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDlsZXlvIAv5pS26LW35qCR6IqC54K5XHJcbiAgICAgICAqL1xyXG4gICAgICB2aXJ0dWFsRXhwYW5kKHRoaXM6IGFueSwgcm93OiBhbnksIGV4cGFuZGVkOiBhbnkpIHtcclxuICAgICAgICBpZiAocm93Ll9YX0VYUEFORCAhPT0gZXhwYW5kZWQpIHtcclxuICAgICAgICAgIGlmIChyb3cuX1hfRVhQQU5EKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29sbGFwc2luZyhyb3cpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUV4cGFuZGluZyhyb3cpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9LFxyXG4gICAgICAvLyDlsZXlvIDoioLngrlcclxuICAgICAgaGFuZGxlRXhwYW5kaW5nKHRoaXM6IGFueSwgcm93OiBhbnkpIHtcclxuICAgICAgICBpZiAodGhpcy5oYXNDaGlsZHMocm93KSkge1xyXG4gICAgICAgICAgY29uc3QgeyB0YWJsZURhdGEsIHRyZWVDb25maWcgfSA9IHRoaXNcclxuICAgICAgICAgIGxldCBjaGlsZFJvd3MgPSByb3dbdHJlZUNvbmZpZy5jaGlsZHJlbl1cclxuICAgICAgICAgIGxldCBleHBhbmRMaXN0OiBhbnlbXSA9IFtdXHJcbiAgICAgICAgICBsZXQgcm93SW5kZXggPSB0YWJsZURhdGEuaW5kZXhPZihyb3cpXHJcbiAgICAgICAgICBpZiAocm93SW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6ZSZ6K+v55qE5pON5L2c77yBJylcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFhFVXRpbHMuZWFjaFRyZWUoY2hpbGRSb3dzLCAoaXRlbSwgaW5kZXgsIG9iaiwgcGF0aHMsIHBhcmVudCwgbm9kZXMpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFwYXJlbnQgfHwgcGFyZW50Ll9YX0VYUEFORCkge1xyXG4gICAgICAgICAgICAgIGV4cGFuZExpc3QucHVzaChpdGVtKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCB0cmVlQ29uZmlnKVxyXG4gICAgICAgICAgcm93Ll9YX0VYUEFORCA9IHRydWVcclxuICAgICAgICAgIHRhYmxlRGF0YS5zcGxpY2UuYXBwbHkodGFibGVEYXRhLCBbcm93SW5kZXggKyAxLCAwXS5jb25jYXQoZXhwYW5kTGlzdCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnRhYmxlRGF0YVxyXG4gICAgICB9LFxyXG4gICAgICAvLyDmlLbotbfoioLngrlcclxuICAgICAgaGFuZGxlQ29sbGFwc2luZyh0aGlzOiBhbnksIHJvdzogYW55KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzQ2hpbGRzKHJvdykpIHtcclxuICAgICAgICAgIGNvbnN0IHsgdGFibGVEYXRhLCB0cmVlQ29uZmlnIH0gPSB0aGlzXHJcbiAgICAgICAgICBsZXQgY2hpbGRSb3dzID0gcm93W3RyZWVDb25maWcuY2hpbGRyZW5dXHJcbiAgICAgICAgICBsZXQgbm9kZUNoaWxkTGlzdDogYW55W10gPSBbXVxyXG4gICAgICAgICAgWEVVdGlscy5lYWNoVHJlZShjaGlsZFJvd3MsIGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICBub2RlQ2hpbGRMaXN0LnB1c2goaXRlbSlcclxuICAgICAgICAgIH0sIHRyZWVDb25maWcpXHJcbiAgICAgICAgICByb3cuX1hfRVhQQU5EID0gZmFsc2VcclxuICAgICAgICAgIHRoaXMudGFibGVEYXRhID0gdGFibGVEYXRhLmZpbHRlcigoaXRlbTogYW55KSA9PiBub2RlQ2hpbGRMaXN0LmluZGV4T2YoaXRlbSkgPT09IC0xKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIOWxleW8gC/mlLbotbfmiYDmnInmoJHoioLngrlcclxuICAgICAgICovXHJcbiAgICAgIHZpcnR1YWxBbGxFeHBhbmQodGhpczogYW55LCBleHBhbmRlZDogYW55KSB7XHJcbiAgICAgICAgWEVVdGlscy5lYWNoVHJlZSh0aGlzLmZ1bGxUcmVlRGF0YSwgcm93ID0+IHtcclxuICAgICAgICAgIHRoaXMudmlydHVhbEV4cGFuZChyb3csIGV4cGFuZGVkKVxyXG4gICAgICAgIH0sIHRoaXMudHJlZUNvbmZpZylcclxuICAgICAgICByZXR1cm4gdGhpcy50YWJsZURhdGFcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgVnVlLmNvbXBvbmVudChWaXJ0dWFsVHJlZS5uYW1lLCBWaXJ0dWFsVHJlZSlcclxufVxyXG5cclxuLyoqXHJcbiAqIOWfuuS6jiB2eGUtdGFibGUg6KGo5qC855qE5aKe5by65o+S5Lu277yM5a6e546w566A5Y2V55qE6Jma5ouf5qCR6KGo5qC8XHJcbiAqL1xyXG5leHBvcnQgY29uc3QgVlhFVGFibGVQbHVnaW5WaXJ0dWFsVHJlZSA9IHtcclxuICBpbnN0YWxsKHh0YWJsZTogdHlwZW9mIFZYRVRhYmxlKSB7XHJcbiAgICAvLyDms6jlhoznu4Tku7ZcclxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KHh0YWJsZSlcclxuICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuVlhFVGFibGUpIHtcclxuICB3aW5kb3cuVlhFVGFibGUudXNlKFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWUpXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFZYRVRhYmxlUGx1Z2luVmlydHVhbFRyZWVcclxuIl19
