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
      <el-table-column label="作业名称" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.jobName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" min-width="30px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.jobType }}</span>
        </template>
      </el-table-column>
      <el-table-column label="CRON规则" min-width="50px" align="center">
        <template slot-scope="{row}">
          <el-tag :type="row.cron | statusFilter">
            {{ row.cron }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="50px" align="center">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="55px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" @click="editUpdate(row)">
            编辑
          </el-button>
          <el-button v-if="row.status ==='停用'" size="mini" @click="jobRestart(row)">
            启动
          </el-button>
          <el-button v-if="row.status==='启用'" size="mini" type="danger" @click="jobCancel(row)">
            停止
          </el-button>
          <el-button v-if="row.status!=='启用'" size="mini" type="danger" @click="jobDel(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" style="width: 60%;margin-left: 20%">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="70px"
        style="margin-left:50px;"
      >
        <el-form-item label="名称" prop="jobName">
          <el-select v-model="temp.jobName" placeholder="请选择调度作业" @focus="getJobList">
            <el-option v-for="item in scheduleJob" :key="item" :value="item" :label="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="cron" prop="cron">
          <el-input v-model="temp.cron" placeholder="请输入cron规则" />
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
import { cronList, cronCreate, enableScheduleJob, cronUpdate, restartCron, stopCron, delCron } from '@/api/scheduled'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { isValidCron } from 'cron-validator'

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
        id: '',
        jobName: '',
        cron: ''
      },
      scheduleJob: null,
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑任务',
        create: '创建任务'
      },
      dialogCancelVisible: false,
      pvData: [],
      rules: {
        jobName: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        cron: [{ required: true, message: 'cron不能为空', trigger: ['blur', 'change'] },
          { required: true, trigger: 'blur', validator: validatePass }]
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
      cronList(this.listQuery).then(response => {
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
          cronCreate(this.temp).then(response => {
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
          cronUpdate(tempData).then(response => {
            this.dialogFormVisible = false
            this.getList()
          })
        }
      })
    },
    getJobList() {
      enableScheduleJob().then(response => {
        this.scheduleJob = response.content
      })
    },
    jobCancel(row) {
      this.$confirm('确定要停止该任务么?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        const parms = {
          'id': row.id
        }
        stopCron(parms).then(response => {
          this.getList()
        })
      }
      )
    },
    jobRestart(row) {
      const parms = {
        'id': row.id
      }
      restartCron(parms).then(response => {
        this.getList()
        this.$notify({
          title: 'Success',
          message: '启动成功',
          type: 'success',
          duration: 2000
        })
      })
    },
    jobDel(row) {
      this.$confirm('确定要删除该任务么?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        const parms = {
          'id': row.id
        }
        delCron(parms).then(response => {
          this.getList()
        })
      })
    }
  }
}
</script>
