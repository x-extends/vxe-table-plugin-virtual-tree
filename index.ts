import XEUtils from 'xe-utils/methods/xe-utils'
import VXETable from 'vxe-table/lib/vxe-table'

function countTreeExpand($xTree: any, prevRow: any): number {
  const rowChildren = prevRow[$xTree.treeConfig.children]
  let count = 1
  if ($xTree.isTreeExpandByRow(prevRow)) {
    for (let index = 0; index < rowChildren.length; index++) {
      count += countTreeExpand($xTree, rowChildren[index])
    }
  }
  return count
}

function getOffsetSize($xTree: any): number {
  switch ($xTree.vSize) {
    case 'mini':
      return 3
    case 'small':
      return 2
    case 'medium':
      return 1
  }
  return 0
}

function calcTreeLine($table: any, $xTree: any, matchObj: any): number {
  const { index, items } = matchObj
  let expandSize = 1
  if (index) {
    expandSize = countTreeExpand($xTree, items[index - 1])
  }
  return $table.rowHeight * expandSize - (index ? 1 : (12 - getOffsetSize($xTree)))
}

function registerComponent({ Vue, Table, Grid, setup, t }: typeof VXETable) {

  const GlobalConfig = setup()
  const propKeys = Object.keys(Table.props).filter(name => ['data', 'treeConfig'].indexOf(name) === -1)

  const VirtualTree: any = {
    name: 'VxeVirtualTree',
    extends: Grid,
    data() {
      return {
        removeList: []
      }
    },
    computed: {
      vSize(this: any): any {
        return this.size || this.$parent.size || this.$parent.vSize
      },
      renderClass(this: any): any {
        const { tableProps, vSize, maximize, treeConfig } = this
        return ['vxe-grid vxe-virtual-tree', {
          [`size--${vSize}`]: vSize,
          't--animat': tableProps.optimization.animat,
          'has--tree-line': treeConfig && treeConfig.line,
          'is--maximize': maximize
        }]
      },
      tableExtendProps(this: any): any {
        let rest: any = {}
        propKeys.forEach(key => {
          rest[key] = this[key]
        })
        return rest
      }
    },
    watch: {
      columns(this: any): any {
        this.loadColumn(this.handleColumns())
      },
      data(this: any, value: any[]): any {
        this.loadData(value)
      }
    },
    created(this: any): any {
      const { data } = this
      Object.assign(this, {
        fullTreeData: [],
        tableData: [],
        fullTreeRowMap: new Map()
      })
      this.handleColumns()
      if (data) {
        this.reloadData(data)
      }
    },
    methods: {
      renderTreeLine(this: any, params: any, h: any) {
        const { treeConfig, fullTreeRowMap } = this
        const { $table, row, column } = params
        const { treeNode } = column
        if (treeNode && treeConfig && treeConfig.line) {
          const $xTree = this
          const rowLevel = row._X_LEVEL
          const matchObj = fullTreeRowMap.get(row)
          return [
            treeNode && treeConfig && treeConfig.line ? h('div', {
              class: 'vxe-tree--line-wrapper'
            }, [
              h('div', {
                class: 'vxe-tree--line',
                style: {
                  height: `${calcTreeLine($table, $xTree, matchObj)}px`,
                  left: `${rowLevel * (treeConfig.indent || 20) + (rowLevel ? 2 - getOffsetSize($xTree) : 0) + 16}px`
                }
              })
            ]) : null
          ]
        }
        return []
      },
      renderTreeIcon(this: any, params: any, h: any) {
        let { isHidden } = params
        let { row } = params
        let { children, indent, trigger, iconOpen, iconClose } = this.treeConfig
        let rowChildren = row[children]
        let isAceived = false
        let on: any = {}
        if (!isHidden) {
          isAceived = row._X_EXPAND
        }
        if (!trigger || trigger === 'default') {
          on.click = () => this.toggleTreeExpansion(row)
        }
        return [
          h('span', {
            class: 'vxe-tree--indent',
            style: {
              width: `${row._X_LEVEL * (indent || 20)}px`
            }
          }),
          h('span', {
            class: ['vxe-tree-wrapper', {
              'is--active': isAceived
            }],
            on
          }, rowChildren && rowChildren.length ? [
            h('span', {
              class: 'vxe-tree--btn-wrapper'
            }, [
              h('i', {
                class: ['vxe-tree--node-btn', isAceived ? (iconOpen || GlobalConfig.icon.treeOpen) : (iconClose || GlobalConfig.icon.treeClose)]
              })
            ])
          ] : [])
        ]
      },
      _loadTreeData(this: any, data: any) {
        return this.$nextTick().then(() => this.$refs.xTable.loadData(data))
      },
      loadData(data: any) {
        return this._loadTreeData(this.toVirtualTree(data))
      },
      reloadData(this: any, data: any) {
        return this.$nextTick()
          .then(() => this.$refs.xTable.reloadData(this.toVirtualTree(data)))
          .then(() => this.handleDefaultTreeExpand())
      },
      isTreeExpandByRow(row: any) {
        return !!row._X_EXPAND
      },
      setTreeExpansion(this: any, rows: any, expanded: any) {
        if (rows) {
          if (!XEUtils.isArray(rows)) {
            rows = [rows]
          }
          rows.forEach((row: any) => this.virtualExpand(row, !!expanded))
        }
        return this._loadTreeData(this.tableData)
      },
      setAllTreeExpansion(expanded: any) {
        return this._loadTreeData(this.virtualAllExpand(expanded))
      },
      toggleTreeExpansion(row: any) {
        return this._loadTreeData(this.virtualExpand(row, !row._X_EXPAND))
      },
      getTreeExpandRecords(this: any) {
        const hasChilds = this.hasChilds
        const treeExpandRecords: any[] = []
        XEUtils.eachTree(this.fullTreeData, row => {
          if (row._X_EXPAND && hasChilds(row)) {
            treeExpandRecords.push(row)
          }
        }, this.treeConfig)
        return treeExpandRecords
      },
      clearTreeExpand() {
        return this.setAllTreeExpansion(false)
      },
      handleColumns(this: any) {
        return this.columns.map((conf: any) => {
          if (conf.treeNode) {
            let slots = conf.slots || {}
            slots.icon = this.renderTreeIcon
            slots.line = this.renderTreeLine
            conf.slots = slots
          }
          return conf
        })
      },
      hasChilds(this: any, row: any) {
        const childList = row[this.treeConfig.children]
        return childList && childList.length
      },
      /**
       * 获取表格数据集，包含新增、删除、修改
       */
      getRecordset(this: any) {
        return {
          insertRecords: this.getInsertRecords(),
          removeRecords: this.getRemoveRecords(),
          updateRecords: this.getUpdateRecords()
        }
      },
      isInsertByRow(row: any) {
        return !!row._X_INSERT
      },
      getInsertRecords(this: any) {
        const insertRecords: any[] = []
        XEUtils.eachTree(this.fullTreeData, row => {
          if (row._X_INSERT) {
            insertRecords.push(row)
          }
        }, this.treeConfig)
        return insertRecords
      },
      insert(this: any, records: any) {
        return this.insertAt(records)
      },
      insertAt(this: any, records: any, row: any) {
        const { fullTreeData, tableData, treeConfig } = this
        if (!XEUtils.isArray(records)) {
          records = [records]
        }
        let newRecords = records.map((record: any) => this.defineField(Object.assign({
          _X_EXPAND: false,
          _X_INSERT: true,
          _X_LEVEL: 0
        }, record)))
        if (!row) {
          fullTreeData.unshift.apply(fullTreeData, newRecords)
          tableData.unshift.apply(tableData, newRecords)
        } else {
          if (row === -1) {
            fullTreeData.push.apply(fullTreeData, newRecords)
            tableData.push.apply(tableData, newRecords)
          } else {
            let matchObj = XEUtils.findTree(fullTreeData, item => item === row, treeConfig)
            if (!matchObj || matchObj.index === -1) {
              throw new Error(t('vxe.error.unableInsert'))
            }
            let { items, index, nodes }: any = matchObj
            let rowIndex = tableData.indexOf(row)
            if (rowIndex > -1) {
              tableData.splice.apply(tableData, [rowIndex, 0].concat(newRecords))
            }
            items.splice.apply(items, [index, 0].concat(newRecords))
            newRecords.forEach((item: any) => {
              item._X_LEVEL = nodes.length - 1
            })
          }
        }
        return this._loadTreeData(tableData).then(() => {
          return {
            row: newRecords.length ? newRecords[newRecords.length - 1] : null,
            rows: newRecords
          }
        })
      },
      /**
       * 获取已删除的数据
       */
      getRemoveRecords(this: any) {
        return this.removeList
      },
      /**
       * 删除选中数据
       */
      removeSelecteds(this: any) {
        return this.remove(this.getSelectRecords()).then((params: any) => {
          this.clearSelection()
          return params
        })
      },
      remove(this: any, rows: any) {
        const { removeList, fullTreeData, treeConfig } = this
        let rest: any[] = []
        if (!rows) {
          rows = fullTreeData
        } else if (!XEUtils.isArray(rows)) {
          rows = [rows]
        }
        rows.forEach((row: any) => {
          let matchObj = XEUtils.findTree(fullTreeData, item => item === row, treeConfig)
          if (matchObj) {
            const { item, items, index, parent }: any = matchObj
            if (!this.isInsertByRow(row)) {
              removeList.push(row)
            }
            if (parent) {
              let isExpand = this.isTreeExpandByRow(parent)
              if (isExpand) {
                this.handleCollapsing(parent)
              }
              items.splice(index, 1)
              if (isExpand) {
                this.handleExpanding(parent)
              }
            } else {
              this.handleCollapsing(item)
              items.splice(index, 1)
              this.tableData.splice(this.tableData.indexOf(item), 1)
            }
            rest.push(item)
          }
        })
        return this._loadTreeData(this.tableData).then(() => {
          return { row: rest.length ? rest[rest.length - 1] : null, rows: rest }
        })
      },
      /**
       * 处理默认展开树节点
       */
      handleDefaultTreeExpand(this: any) {
        let { treeConfig, tableFullData } = this
        if (treeConfig) {
          let { expandAll, expandRowKeys } = treeConfig
          let { children } = treeConfig
          if (expandAll) {
            this.setAllTreeExpansion(true)
          } else if (expandRowKeys) {
            let rowkey = this.rowId
            expandRowKeys.forEach((rowid: any) => {
              let matchObj = XEUtils.findTree(tableFullData, item => rowid === XEUtils.get(item, rowkey), treeConfig)
              let rowChildren = matchObj ? matchObj.item[children] : 0
              if (rowChildren && rowChildren.length) {
                this.setTreeExpansion(matchObj.item, true)
              }
            })
          }
        }
      },
      /**
       * 定义树属性
       */
      toVirtualTree(this: any, treeData: any[]) {
        let fullTreeRowMap = this.fullTreeRowMap
        fullTreeRowMap.clear()
        XEUtils.eachTree(treeData, (item, index, items, paths, parent, nodes) => {
          item._X_EXPAND = false
          item._X_INSERT = false
          item._X_LEVEL = nodes.length - 1
          fullTreeRowMap.set(item, { item, index, items, paths, parent, nodes })
        })
        this.fullTreeData = treeData.slice(0)
        this.tableData = treeData.slice(0)
        return treeData
      },
      /**
       * 展开/收起树节点
       */
      virtualExpand(this: any, row: any, expanded: any) {
        if (row._X_EXPAND !== expanded) {
          if (row._X_EXPAND) {
            this.handleCollapsing(row)
          } else {
            this.handleExpanding(row)
          }
        }
        return this.tableData
      },
      // 展开节点
      handleExpanding(this: any, row: any) {
        if (this.hasChilds(row)) {
          const { tableData, treeConfig } = this
          let childRows = row[treeConfig.children]
          let expandList: any[] = []
          let rowIndex = tableData.indexOf(row)
          if (rowIndex === -1) {
            throw new Error('错误的操作！')
          }
          XEUtils.eachTree(childRows, (item, index, obj, paths, parent, nodes) => {
            if (!parent || parent._X_EXPAND) {
              expandList.push(item)
            }
          }, treeConfig)
          row._X_EXPAND = true
          tableData.splice.apply(tableData, [rowIndex + 1, 0].concat(expandList))
        }
        return this.tableData
      },
      // 收起节点
      handleCollapsing(this: any, row: any) {
        if (this.hasChilds(row)) {
          const { tableData, treeConfig } = this
          let childRows = row[treeConfig.children]
          let nodeChildList: any[] = []
          XEUtils.eachTree(childRows, item => {
            nodeChildList.push(item)
          }, treeConfig)
          row._X_EXPAND = false
          this.tableData = tableData.filter((item: any) => nodeChildList.indexOf(item) === -1)
        }
        return this.tableData
      },
      /**
       * 展开/收起所有树节点
       */
      virtualAllExpand(this: any, expanded: any) {
        XEUtils.eachTree(this.fullTreeData, row => {
          this.virtualExpand(row, expanded)
        }, this.treeConfig)
        return this.tableData
      }
    }
  }

  Vue.component(VirtualTree.name, VirtualTree)
}

/**
 * 基于 vxe-table 表格的增强插件，实现简单的虚拟树表格
 */
export const VXETablePluginVirtualTree = {
  install(xtable: typeof VXETable) {
    // 注册组件
    registerComponent(xtable)
  }
}

if (typeof window !== 'undefined' && window.VXETable) {
  window.VXETable.use(VXETablePluginVirtualTree)
}

export default VXETablePluginVirtualTree
