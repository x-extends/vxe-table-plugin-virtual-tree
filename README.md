# vxe-table-plugin-virtual-tree

[![gitee star](https://gitee.com/xuliangzhan_admin/vxe-table-plugin-virtual-tree/badge/star.svg?theme=dark)](https://gitee.com/xuliangzhan_admin/vxe-table-plugin-virtual-tree/stargazers)
[![npm version](https://img.shields.io/npm/v/vxe-table-plugin-virtual-tree.svg?style=flat-square)](https://www.npmjs.com/package/vxe-table-plugin-virtual-tree)
[![npm downloads](https://img.shields.io/npm/dm/vxe-table-plugin-virtual-tree.svg?style=flat-square)](http://npm-stat.com/charts.html?package=vxe-table-plugin-virtual-tree)
[![npm license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

基于 [vxe-table](https://www.npmjs.com/package/vxe-table) 的表格插件，实现简单的虚拟树表格（属于内测阶段，谨慎使用）

## Installing

```shell
npm install xe-utils vxe-table vxe-table-plugin-virtual-tree
```

```javascript
// ...
import VXETablePluginVirtualTree from 'vxe-table-plugin-virtual-tree'
import 'vxe-table-plugin-virtual-tree/dist/style.css'
// ...

VXETable.use(VXETablePluginVirtualTree)
```

## Compatibility

* 注意事项
  * 虚拟树的实现机制是污染式的，会污染数据源（给数据源自动增加额外的属性，用于编译成高性能的虚拟渲染所需要的参数）
  * 虚拟树的操作同样也是污染式的，通过 insert 或 remove 相关方法也会改变数据源

* 不支持的参数
  * table.keep-source
  * table.tree-config.line
  * table.tree-config.reserve
  * table.expand-config
  * table.span-method
  * table.footer-span-method
  * column.type = expand

## Demo

```html
<vxe-virtual-tree
  show-overflow
  row-key
  row-id="id"
  :data="tableData"
  :tree-config="{children: 'children'}"
  :columns="tableColumn">
</vxe-virtual-tree>
```

```javascript
export default {
  data () {
    return {
      tableColumn: [
        { field: 'name', title: 'Name', treeNode: true },
        { field: 'size', title: 'Size' },
        { field: 'type', title: 'Type' },
        { field: 'date', title: 'Date' }
      ],
      tableData: [
        { id:'101', name:'文档1', size: 12, type: 'xlsx', date: '2019-12-12' },
        {
          id:'102',
          name:'文件夹',
          size: 12,
          type: '',
          date: '2019-12-12',
          children: [
            { id:'103', name:'文档3', size: 12, type: 'avi', date: '2019-12-12' },
          ]
        }
      ]
    }
  }
}
```

## License

[MIT](LICENSE) © 2019-present, Xu Liangzhan
