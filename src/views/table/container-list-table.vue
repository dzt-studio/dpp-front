<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.jobName"
        placeholder="名称"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter.native="handleFilter"
      />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        查询
      </el-button>
      <el-button
        class="filter-item"
        style="margin-left: 20px;"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >
        新增
      </el-button>
    </div>

    <el-table
      :key="tableKey"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <el-table-column
        label="Id"
        sortable="custom"
        align="center"
        min-width="50px"
      >
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="AppId" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.containerId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="容器名称" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.containerName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="容器描述" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.containerMsg }}</span>
        </template>
      </el-table-column>
      <el-table-column label="容器URL" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.containerUrl }}</span>
        </template>
      </el-table-column>
      <el-table-column label="容器版本" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.containerVersion }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="55px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" @click="editUpdate(row)">
            编辑
          </el-button>
          <el-button v-if="row.status!=='启用'" size="mini" type="danger" @click="containerDel(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="listQuery.pageNum"
      :limit.sync="listQuery.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" style="width: 60%;margin-left: 20%">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="80px"
        style="margin-left:50px;margin-right: 50px;"
      >
        <el-form-item label="appId" prop="containerId">
          <el-input v-model="temp.containerId" placeholder="请输入appId" />
        </el-form-item>
        <el-form-item label="容器名称" prop="containerName">
          <el-input v-model="temp.containerName" placeholder="请输入容器名称" />
        </el-form-item>
        <el-form-item label="容器描述" prop="containerMsg">
          <el-input v-model="temp.containerMsg" placeholder="请输入容器描述" />
        </el-form-item>
        <el-form-item label="容器URL" prop="containerUrl">
          <el-input v-model="temp.containerUrl" placeholder="请输入容器URL" />
        </el-form-item>
        <el-form-item label="容器版本" prop="containerVersion">
          <el-input v-model="temp.containerVersion" placeholder="请输入容器版本" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          确认
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { containerList, addController, delContainer, updateController } from '@/api/container'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        启用: 'success',
        停用: 'info'
      }
      return statusMap[status]
    }
    // typeFilter(type) {
    //   return calendarTypeKeyValue[type]
    // }
  },
  data() {
    const validatePass = (rule, value, callback) => {
      if (!isValidCron(value, { seconds: true })) {
        callback(new Error('cron规则有误，请检查'))
      } else {
        callback()
      }
    }
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listQuery: {
        page: 1,
        limit: 20,
        importance: undefined,
        jobName: undefined,
        status: undefined,
        sort: '+id'
      },
      importanceOptions: ['RUNNING', 'FINISHED', 'FAILED'],
      // calendarTypeOptions,
      // sortOptions: [{ label: 'ID Ascending', key: '+id' }, { label: 'ID Descending', key: '-id' }],
      statusOptions: ['RUNNING', 'FINISHED', 'FAILED'],
      showReviewer: false,
      temp: {
        containerId: '',
        containerName: '',
        containerMsg: '',
        containerUrl: '',
        containerVersion: ''
      },
      scheduleJob: null,
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑容器',
        create: '新增容器'
      },
      dialogCancelVisible: false,
      pvData: [],
      rules: {
        containerId: [{ required: true, message: 'appId不能为空', trigger: 'change' }],
        containerName: [{ required: true, message: '容器名称不能为空', trigger: 'change' }],
        containerUrl: [{ required: true, message: '容器URL不能为空', trigger: 'change' }],
        containerVersion: [{ required: true, message: '容器版本不能为空', trigger: 'change' }],
        containerMsg: [{ required: true, message: '容器描述不能为空', trigger: 'change' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
  },
  mounted() {
  },
  beforeDestroy() {
    clearInterval(this.timer)
  },
  methods: {
    getList() {
      containerList(this.listQuery).then(response => {
        this.list = response.content.content
        this.total = response.content.totalSize
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作Success',
        type: 'success'
      })
      row.status = status
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },
    resetTemp() {
      this.temp = {
        jobName: '',
        description: ''
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    handleCancel(row) {
      this.dialogStatus = 'cancel'
      this.dialogCancelVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          addController(this.temp).then(response => {
            this.dialogFormVisible = false
            this.getList()
          })
        }
      })
    },
    editUpdate(row) {
      this.temp = Object.assign({}, row)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      // this.temp = Object.assign({}, row) // copy obj
      // this.$router.push({ name: 'flink-job-edit', params: { jobName: row.jobName }})
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          updateController(tempData).then(response => {
            this.dialogFormVisible = false
            this.getList()
          })
        }
      })
    },
    getJobList() {
      jobScheduleList().then(response => {
        this.scheduleJob = response.data
      })
    },
    containerDel(row) {
      this.$confirm('确定要删除该容器么?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        const data = {
          'id': row.id
        }
        delContainer(data).then(response => {
          this.getList()
        })
      })
    }
  }
}
</script>
