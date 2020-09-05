/* eslint-disable no-unused-vars */
import Vue, { CreateElement, VNodeChildren } from 'vue'
import XEUtils from 'xe-utils/ctor'
import {
  VXETable
} from 'vxe-table/lib/vxe-table'
/* eslint-enable no-unused-vars */

function countTreeExpand ($xTree: any, prevRow: any): number {
  const rowChildren = prevRow[$xTree.treeOpts.children]
  let count = 1
  if ($xTree.isTreeExpandByRow(prevRow)) {
    for (let index = 0; index < rowChildren.length; index++) {
      count += countTreeExpand($xTree, rowChildren[index])
    }
  }
  return count
}

function getOffsetSize ($xTree: any): number {
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

function calcTreeLine ($table: any, $xTree: any, matchObj: any): number {
  const { index, items } = matchObj
  let expandSize = 1
  if (index) {
    expandSize = countTreeExpand($xTree, items[index - 1])
  }
  return $table.rowHeight * expandSize - (index ? 1 : (12 - getOffsetSize($xTree)))
}

function hasChilds (_vm: any, row: any) {
  const childList = row[_vm.treeOpts.children]
  return childList && childList.length
}

function renderDefaultForm (h: CreateElement, _vm: any) {
  const { proxyConfig, proxyOpts, formData, formConfig, formOpts } = _vm
  if (formOpts.items && formOpts.items.length) {
    if (!formOpts.inited) {
      formOpts.inited = true
      if (proxyOpts && proxyOpts.beforeItem) {
        formOpts.items.forEach((item: any) => {
          proxyOpts.beforeItem.apply(_vm, [{ $grid: _vm, item }])
        })
      }
    }
    return [
      h('vxe-form', {
        props: Object.assign({}, formOpts, {
          data: proxyConfig && proxyOpts.form ? formData : formConfig.data
        }),
        on: {
          submit: _vm.submitEvent,
          reset: _vm.resetEvent,
          'submit-invalid': _vm.submitInvalidEvent,
          'toggle-collapse': _vm.togglCollapseEvent
        },
        ref: 'form'
      })
    ]
  }
  return []
}

function getToolbarSlots (_vm: any) {
  const { $scopedSlots, toolbarOpts } = _vm
  const toolbarOptSlots = toolbarOpts.slots
  let $buttons
  let $tools
  const slots: any = {}
  if (toolbarOptSlots) {
    $buttons = toolbarOptSlots.buttons
    $tools = toolbarOptSlots.tools
    if ($buttons && $scopedSlots[$buttons]) {
      $buttons = $scopedSlots[$buttons]
    }
    if ($tools && $scopedSlots[$tools]) {
      $tools = $scopedSlots[$tools]
    }
  }
  if ($buttons) {
    slots.buttons = $buttons
  }
  if ($tools) {
    slots.tools = $tools
  }
  return slots
}

function getPagerSlots (_vm: any) {
  const { $scopedSlots, pagerOpts } = _vm
  const pagerOptSlots = pagerOpts.slots
  const slots: any = {}
  let $left
  let $right
  if (pagerOptSlots) {
    $left = pagerOptSlots.left
    $right = pagerOptSlots.right
    if ($left && $scopedSlots[$left]) {
      $left = $scopedSlots[$left]
    }
    if ($right && $scopedSlots[$right]) {
      $right = $scopedSlots[$right]
    }
  }
  if ($left) {
    slots.left = $left
  }
  if ($right) {
    slots.right = $right
  }
  return slots
}

function getTableOns (_vm: any) {
  const { $listeners, proxyConfig, proxyOpts } = _vm
  const ons: any = {}
  XEUtils.each($listeners, (cb, type) => {
    ons[type] = (...args: any[]) => {
      _vm.$emit(type, ...args)
    }
  })
  if (proxyConfig) {
    if (proxyOpts.sort) {
      ons['sort-change'] = _vm.sortChangeEvent
    }
    if (proxyOpts.filter) {
      ons['filter-change'] = _vm.filterChangeEvent
    }
  }
  return ons
}

declare module 'vxe-table/lib/vxe-table' {
  interface VXETableStatic {
    Vue: typeof Vue;
    Grid: any;
    Table: any;
  }
}

function registerComponent (vxetable: typeof VXETable) {
  const { Vue, Table, Grid, setup, t } = vxetable
  const GlobalConfig = setup()
  const propKeys = Object.keys(Table.props).filter(name => ['data', 'treeConfig'].indexOf(name) === -1)

  const VirtualTree: any = {
    name: 'VxeVirtualTree',
    extends: Grid,
    data () {
      return {
        removeList: []
      }
    },
    crested (this: any) {
      if (this.keepSource) {
        console.error('[plugin-virtual-tree] Unsupported parameters.')
      }
    },
    computed: {
      treeOpts (this: any) {
        return Object.assign({}, GlobalConfig.table.treeConfig, this.treeConfig)
      },
      checkboxOpts (this: any) {
        return Object.assign({}, GlobalConfig.table.checkboxConfig, this.checkboxConfig)
      },
      tableExtendProps (this: any) {
        let rest: any = {}
        propKeys.forEach(key => {
          rest[key] = this[key]
        })
        return rest
      }
    },
    watch: {
      columns (this: any, value: any[]) {
        this.handleColumns(value)
      },
      data (this: any, value: any[]) {
        this.loadData(value)
      }
    },
    created (this: any) {
      const { data } = this
      Object.assign(this, {
        fullTreeData: [],
        tableData: [],
        fullTreeRowMap: new Map()
      })
      this.handleColumns(this.columns)
      if (data) {
        this.reloadData(data)
      }
    },
    render (this: any, h: CreateElement) {
      const { $scopedSlots, vSize, isZMax } = this
      const hasForm = !!($scopedSlots.form || this.formConfig)
      const hasToolbar = !!($scopedSlots.toolbar || this.toolbar)
      const hasTop = !!$scopedSlots.top
      const hasBottom = !!$scopedSlots.bottom
      const hasPager = !!($scopedSlots.pager || this.pagerConfig)
      return h('div', {
        class: ['vxe-grid', 'vxe-virtual-tree', {
          [`size--${vSize}`]: vSize,
          't--animat': !!this.animat,
          'is--round': this.round,
          'is--maximize': isZMax,
          'is--loading': this.isCloak || this.loading || this.tableLoading
        }],
        style: this.renderStyle
      }, [
        /**
         * 渲染表单
         */
        hasForm ? h('div', {
          ref: 'formWrapper',
          class: 'vxe-grid--form-wrapper'
        }, $scopedSlots.form
          ? $scopedSlots.form.call(this, { $grid: this }, h)
          : renderDefaultForm(h, this)
        ) : null,
        /**
         * 渲染工具栏
         */
        hasToolbar ? h('div', {
          ref: 'toolbarWrapper',
          class: 'vxe-grid--toolbar-wrapper'
        }, $scopedSlots.toolbar
          ? $scopedSlots.toolbar.call(this, { $grid: this }, h)
          : [
            h('vxe-toolbar', {
              props: this.toolbarOpts,
              ref: 'xToolbar',
              scopedSlots: getToolbarSlots(this)
            })
          ]
        ) : null,
        /**
         * 渲染表格顶部区域
         */
        hasTop ? h('div', {
          ref: 'topWrapper',
          class: 'vxe-grid--top-wrapper'
        }, $scopedSlots.top.call(this, { $grid: this }, h)) : null,
        /**
         * 渲染表格
         */
        h('vxe-table', {
          props: this.tableProps,
          on: getTableOns(this),
          scopedSlots: $scopedSlots,
          ref: 'xTable'
        }, this.$slots.default),
        /**
         * 渲染表格底部区域
         */
        hasBottom ? h('div', {
          ref: 'bottomWrapper',
          class: 'vxe-grid--bottom-wrapper'
        }, $scopedSlots.bottom.call(this, { $grid: this }, h)) : null,
        /**
         * 渲染分页
         */
        hasPager ? h('div', {
          ref: 'pagerWrapper',
          class: 'vxe-grid--pager-wrapper'
        }, $scopedSlots.pager
          ? $scopedSlots.pager.call(this, { $grid: this }, h)
          : [
            h('vxe-pager', {
              props: this.pagerProps,
              on: {
                'page-change': this.pageChangeEvent
              },
              scopedSlots: getPagerSlots(this)
            })
          ]
        ) : null
      ])
    },
    methods: {
      loadColumn (this: any, columns: any[]) {
        return this.$nextTick().then(() => {
          const { $vxe, $scopedSlots } = this
          XEUtils.eachTree(columns, column => {
            if (column.slots) {
              XEUtils.each(column.slots, (func, name, slots) => {
                if (!XEUtils.isFunction(func)) {
                  if ($scopedSlots[func]) {
                    slots[name] = $scopedSlots[func]
                  } else {
                    slots[name] = null
                    console.error($vxe.t('vxe.error.notSlot'), [func])
                  }
                }
              })
            }
          })
          this.$refs.xTable.loadColumn(this.handleColumns(columns))
        })
      },
      renderTreeLine (this: any, params: any, h: CreateElement) {
        const { treeConfig, treeOpts, fullTreeRowMap } = this
        const { $table, row, column } = params
        const { treeNode } = column
        if (treeNode && treeConfig && treeOpts.line) {
          const $xTree = this
          const rowLevel = row._X_LEVEL
          const matchObj = fullTreeRowMap.get(row)
          return [
            treeNode && treeOpts.line ? h('div', {
              class: 'vxe-tree--line-wrapper'
            }, [
              h('div', {
                class: 'vxe-tree--line',
                style: {
                  height: `${calcTreeLine($table, $xTree, matchObj)}px`,
                  left: `${rowLevel * (treeOpts.indent || 20) + (rowLevel ? 2 - getOffsetSize($xTree) : 0) + 16}px`
                }
              })
            ]) : null
          ]
        }
        return []
      },
      renderTreeIcon (this: any, params: any, h: CreateElement, cellVNodes: VNodeChildren) {
        const { treeOpts } = this
        let { isHidden, row } = params
        const { children, hasChild, indent, lazy, trigger, iconLoaded, showIcon, iconOpen, iconClose } = treeOpts
        let rowChilds = row[children]
        let hasLazyChilds = false
        let isAceived = false
        let isLazyLoaded = false
        let on: any = {}
        if (!isHidden) {
          isAceived = row._X_EXPAND
          if (lazy) {
            isLazyLoaded = row._X_LOADING
            hasLazyChilds = row[hasChild]
          }
        }
        if (!trigger || trigger === 'default') {
          on.click = (evnt: Event) => this.triggerTreeExpandEvent(evnt, params)
        }
        return [
          h('div', {
            class: ['vxe-cell--tree-node', {
              'is--active': isAceived
            }],
            style: {
              paddingLeft: `${row._X_LEVEL * indent}px`
            }
          }, [
            showIcon && ((rowChilds && rowChilds.length) || hasLazyChilds) ? [
              h('div', {
                class: 'vxe-tree--btn-wrapper',
                on
              }, [
                h('i', {
                  class: ['vxe-tree--node-btn', isLazyLoaded ? (iconLoaded || GlobalConfig.icon.TABLE_TREE_LOADED) : (isAceived ? (iconOpen || GlobalConfig.icon.TABLE_TREE_OPEN) : (iconClose || GlobalConfig.icon.TABLE_TREE_CLOSE))]
                })
              ])
            ] : null,
            h('div', {
              class: 'vxe-tree-cell'
            }, cellVNodes)
          ])
        ]
      },
      _loadTreeData (this: any, data: any) {
        const selectRow = this.getRadioRecord()
        return this.$nextTick()
          .then(() => this.$refs.xTable.loadData(data))
          .then(() => {
            if (selectRow) {
              this.setRadioRow(selectRow)
            }
          })
      },
      loadData (data: any) {
        return this._loadTreeData(this.toVirtualTree(data))
      },
      reloadData (this: any, data: any) {
        return this.$nextTick()
          .then(() => this.$refs.xTable.reloadData(this.toVirtualTree(data)))
          .then(() => this.handleDefaultTreeExpand())
      },
      isTreeExpandByRow (row: any) {
        return !!row._X_EXPAND
      },
      setTreeExpansion (rows: any, expanded: any) {
        return this.setTreeExpand(rows, expanded)
      },
      handleAsyncTreeExpandChilds (this: any, row: any) {
        const { treeOpts, checkboxOpts } = this
        const { loadMethod, children } = treeOpts
        const { checkStrictly } = checkboxOpts
        return new Promise(resolve => {
          row._X_LOADING = true
          loadMethod({ $table: this, row }).catch(() => []).then((childs: any[]) => {
            row._X_LOADED = true
            row._X_LOADING = false
            if (!XEUtils.isArray(childs)) {
              childs = []
            }
            if (childs) {
              row[children] = childs
              if (childs.length && !row._X_EXPAND) {
                this.virtualExpand(row, true)
              }
              // 如果当前节点已选中，则展开后子节点也被选中
              if (!checkStrictly && this.isCheckedByCheckboxRow(row)) {
                this.setCheckboxRow(childs, true)
              }
            }
            resolve(this.$nextTick().then(this.recalculate))
          })
        })
      },
      setTreeExpand (this: any, rows: any, expanded: any) {
        const { treeOpts, tableFullData, treeNodeColumn } = this
        const { lazy, hasChild, accordion, toggleMethod } = treeOpts
        const result: any[] = []
        if (rows) {
          if (!XEUtils.isArray(rows)) {
            rows = [rows]
          }
          let validRows = toggleMethod ? rows.filter((row: any) => toggleMethod({ expanded, column: treeNodeColumn, row })) : rows
          if (accordion) {
            validRows = validRows.length ? [validRows[validRows.length - 1]] : []
            // 同一级只能展开一个
            const matchObj = XEUtils.findTree(tableFullData, item => item === rows[0], treeOpts)
            if (matchObj) {
              matchObj.items.forEach(row => {
                row._X_EXPAND = false
              })
            }
          }
          validRows.forEach((row: any) => {
            if (!row._X_LOADING) {
              const isLoad = lazy && row[hasChild] && !row._X_LOADED && !row._X_LOADING
              // 是否使用懒加载
              if (isLoad) {
                result.push(this.handleAsyncTreeExpandChilds(row))
              } else {
                if (hasChilds(this, row)) {
                  this.virtualExpand(row, !!expanded)
                }
              }
            }
          })
          return Promise.all(result).then(() => {
            this._loadTreeData(this.tableData)
            return this.recalculate()
          })
        }
        return this.$nextTick()
      },
      setAllTreeExpansion (expanded: any) {
        return this.setAllTreeExpand(expanded)
      },
      setAllTreeExpand (expanded: any) {
        return this._loadTreeData(this.virtualAllExpand(expanded))
      },
      toggleTreeExpansion (row: any) {
        return this.toggleTreeExpand(row)
      },
      triggerTreeExpandEvent (this: any, evnt: Event, params: any) {
        const { treeOpts } = this
        const { row, column } = params
        const { lazy } = treeOpts
        if (!lazy || !row._X_LOADING) {
          const expanded = !this.isTreeExpandByRow(row)
          this.setTreeExpand(row, expanded)
          this.$emit('toggle-tree-expand', { expanded, column, row, $event: evnt })
        }
      },
      toggleTreeExpand (row: any) {
        return this._loadTreeData(this.virtualExpand(row, !row._X_EXPAND))
      },
      getTreeExpandRecords (this: any) {
        const treeExpandRecords: any[] = []
        XEUtils.eachTree(this.fullTreeData, row => {
          if (row._X_EXPAND && hasChilds(this, row)) {
            treeExpandRecords.push(row)
          }
        }, this.treeOpts)
        return treeExpandRecords
      },
      clearTreeExpand () {
        return this.setAllTreeExpand(false)
      },
      handleColumns (this: any, columns: any[]) {
        const { renderTreeIcon, renderTreeLine } = this
        if (columns) {
          const treeNodeColumn = columns.find(conf => conf.treeNode)
          let slots = treeNodeColumn.slots || {}
          slots.icon = renderTreeIcon
          slots.line = renderTreeLine
          treeNodeColumn.slots = slots
          return columns
        }
        return []
      },
      /**
       * 获取表格数据集，包含新增、删除、修改
       */
      getRecordset (this: any) {
        return {
          insertRecords: this.getInsertRecords(),
          removeRecords: this.getRemoveRecords(),
          updateRecords: this.getUpdateRecords()
        }
      },
      isInsertByRow (row: any) {
        return !!row._X_INSERT
      },
      getInsertRecords (this: any) {
        const insertRecords: any[] = []
        XEUtils.eachTree(this.fullTreeData, row => {
          if (row._X_INSERT) {
            insertRecords.push(row)
          }
        }, this.treeOpts)
        return insertRecords
      },
      insert (this: any, records: any) {
        return this.insertAt(records)
      },
      insertAt (this: any, records: any, row: any) {
        const { fullTreeData, tableData, treeOpts } = this
        if (!XEUtils.isArray(records)) {
          records = [records]
        }
        let newRecords = records.map((record: any) => this.defineField(Object.assign({
          _X_LOADING: false,
          _X_LOADED: false,
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
            let matchObj = XEUtils.findTree(fullTreeData, item => item === row, treeOpts)
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
      getRemoveRecords (this: any) {
        return this.removeList
      },
      removeSelecteds () {
        return this.removeCheckboxRow()
      },
      /**
       * 删除选中数据
       */
      removeCheckboxRow (this: any) {
        return this.remove(this.getSelectRecords()).then((params: any) => {
          this.clearSelection()
          return params
        })
      },
      remove (this: any, rows: any[]) {
        const { removeList, fullTreeData, treeOpts } = this
        let rest: any[] = []
        if (!rows) {
          rows = fullTreeData
        } else if (!XEUtils.isArray(rows)) {
          rows = [rows]
        }
        rows.forEach((row: any) => {
          let matchObj = XEUtils.findTree(fullTreeData, item => item === row, treeOpts)
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
      handleDefaultTreeExpand (this: any) {
        let { treeConfig, treeOpts, tableFullData } = this
        if (treeConfig) {
          let { children, expandAll, expandRowKeys } = treeOpts
          if (expandAll) {
            this.setAllTreeExpand(true)
          } else if (expandRowKeys) {
            let rowkey = this.rowId
            expandRowKeys.forEach((rowid: any) => {
              let matchObj = XEUtils.findTree(tableFullData, item => rowid === XEUtils.get(item, rowkey), treeOpts)
              let rowChildren = matchObj ? matchObj.item[children] : 0
              if (rowChildren && rowChildren.length) {
                this.setTreeExpand(matchObj.item, true)
              }
            })
          }
        }
      },
      /**
       * 定义树属性
       */
      toVirtualTree (this: any, treeData: any[]) {
        let fullTreeRowMap = this.fullTreeRowMap
        fullTreeRowMap.clear()
        XEUtils.eachTree(treeData, (item, index, items, paths, parent, nodes) => {
          item._X_LOADING = false
          item._X_LOADED = false
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
      virtualExpand (this: any, row: any, expanded: boolean) {
        const { treeOpts } = this
        const { toggleMethod } = treeOpts
        if (!toggleMethod || toggleMethod({ expanded, row })) {
          if (row._X_EXPAND !== expanded) {
            if (row._X_EXPAND) {
              this.handleCollapsing(row)
            } else {
              this.handleExpanding(row)
            }
          }
        }
        return this.tableData
      },
      // 展开节点
      handleExpanding (this: any, row: any) {
        if (hasChilds(this, row)) {
          const { tableData, treeOpts } = this
          let childRows = row[treeOpts.children]
          let expandList: any[] = []
          let rowIndex = tableData.indexOf(row)
          if (rowIndex === -1) {
            throw new Error('错误的操作！')
          }
          XEUtils.eachTree(childRows, (item, index, obj, paths, parent, nodes) => {
            if (!parent || parent._X_EXPAND) {
              expandList.push(item)
            }
          }, treeOpts)
          row._X_EXPAND = true
          tableData.splice.apply(tableData, [rowIndex + 1, 0].concat(expandList))
        }
        return this.tableData
      },
      // 收起节点
      handleCollapsing (this: any, row: any) {
        if (hasChilds(this, row)) {
          const { tableData, treeOpts } = this
          let childRows = row[treeOpts.children]
          let nodeChildList: any[] = []
          XEUtils.eachTree(childRows, item => {
            nodeChildList.push(item)
          }, treeOpts)
          row._X_EXPAND = false
          this.tableData = tableData.filter((item: any) => nodeChildList.indexOf(item) === -1)
        }
        return this.tableData
      },
      /**
       * 展开/收起所有树节点
       */
      virtualAllExpand (this: any, expanded: boolean) {
        const { treeOpts } = this
        if (expanded) {
          const tableList: any[] = []
          XEUtils.eachTree(this.fullTreeData, row => {
            row._X_EXPAND = expanded
            tableList.push(row)
          }, treeOpts)
          this.tableData = tableList
        } else {
          XEUtils.eachTree(this.fullTreeData, row => {
            row._X_EXPAND = expanded
          }, treeOpts)
          this.tableData = this.fullTreeData.slice(0)
        }
        return this.tableData
      },
      checkboxAllEvent (this: any, params: any) {
        const { checkboxConfig = {}, treeOpts } = this
        const { checkField, halfField, checkStrictly } = checkboxConfig
        const { checked } = params
        if (checkField && !checkStrictly) {
          XEUtils.eachTree(this.fullTreeData, row => {
            row[checkField] = checked
            if (halfField) {
              row[halfField] = false
            }
          }, treeOpts)
        }
        this.$emit('checkbox-all', params)
      },
      checkboxChangeEvent (this: any, params: any) {
        const { checkboxConfig = {}, treeOpts } = this
        const { checkField, halfField, checkStrictly } = checkboxConfig
        const { row, checked } = params
        if (checkField && !checkStrictly) {
          XEUtils.eachTree([row], row => {
            row[checkField] = checked
            if (halfField) {
              row[halfField] = false
            }
          }, treeOpts)
          this.checkParentNodeSelection(row)
        }
        this.$emit('checkbox-change', params)
      },
      checkParentNodeSelection (this: any, row: any) {
        const { checkboxConfig = {}, treeOpts } = this
        const { children } = treeOpts
        const { checkField, halfField, checkStrictly } = checkboxConfig
        const matchObj = XEUtils.findTree(this.fullTreeData, item => item === row, treeOpts)
        if (matchObj && checkField && !checkStrictly) {
          const parentRow = matchObj.parent
          if (parentRow) {
            const isAll = parentRow[children].every((item: any) => item[checkField])
            if (halfField && !isAll) {
              parentRow[halfField] = parentRow[children].some((item: any) => item[checkField] || item[halfField])
            }
            parentRow[checkField] = isAll
            this.checkParentNodeSelection(parentRow)
          } else {
            this.$refs.xTable.checkSelectionStatus()
          }
        }
      },
      getCheckboxRecords (this: any) {
        const { checkboxConfig = {}, treeOpts } = this
        const { checkField } = checkboxConfig
        if (checkField) {
          const records: any[] = []
          XEUtils.eachTree(this.fullTreeData, row => {
            if (row[checkField]) {
              records.push(row)
            }
          }, treeOpts)
          return records
        }
        return this.$refs.xTable.getCheckboxRecords()
      },
      getCheckboxIndeterminateRecords (this: any) {
        const { checkboxConfig = {}, treeOpts } = this
        const { halfField } = checkboxConfig
        if (halfField) {
          const records: any[] = []
          XEUtils.eachTree(this.fullTreeData, row => {
            if (row[halfField]) {
              records.push(row)
            }
          }, treeOpts)
          return records
        }
        return this.$refs.xTable.getCheckboxIndeterminateRecords()
      }
    }
  }

  Vue.component(VirtualTree.name, VirtualTree)
}

/**
 * 基于 vxe-table 表格的增强插件，实现简单的虚拟树表格
 */
export const VXETablePluginVirtualTree = {
  install (vxetable: typeof VXETable) {
    // 注册组件
    registerComponent(vxetable)
  }
}

if (typeof window !== 'undefined' && window.VXETable) {
  window.VXETable.use(VXETablePluginVirtualTree)
}

export default VXETablePluginVirtualTree
