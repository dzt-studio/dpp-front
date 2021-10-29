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
      <el-select v-model="listQuery.jobStatus" placeholder="所有状态" clearable style="width: 110px" class="filter-item">
        <el-option v-for="item in importanceOptions" :key="item" :label="item" :value="item" />
      </el-select>
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
        创建作业
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
        label="AppId"
        sortable="custom"
        align="center"
        min-width="50px"
      >
        <template slot-scope="{row}">
          <span class="link-type" @click="linkFlinkUI(row)">{{ row.appId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="名称" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.jobName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" min-width="30px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.jobType }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="30px" align="center">
        <template slot-scope="{row}">
          <el-tag :type="row.jobStatus | statusFilter">
            {{ row.jobStatus }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="描述" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.describes }}</span>
        </template>
      </el-table-column>
      <el-table-column label="用户名" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.createdBy }}</span>
        </template>
      </el-table-column>
      <el-table-column label="运行时间" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ Date.parse(row.startTime) | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="运行时长" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.runTime | formatDuring() }}</span>
        </template>
      </el-table-column>
      <el-table-column label="日志" min-width="50px" align="center">
        <template slot-scope="{row}">
          <span v-if="row.jobStatus!=='CREATE'" class="link-type" @click="jobLog(row)">log</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="55px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" @click="row.jobType==='Flink Sql'?editUpdate(row):editJarUpdate(row)">
            编辑
          </el-button>
          <el-button v-if="row.jobStatus!=='RUNNING' && row.appId!==null && row.jobStatus!=='BUILDING'" size="mini" @click="row.jobType==='Flink Sql'?jobStrat(row):jobCommitWithJar(row)">
            启动
          </el-button>
          <el-button v-if="row.jobStatus==='RUNNING'" size="mini" type="danger" @click="jobCancel(row)">
            停止
          </el-button>
          <el-button v-if="row.jobStatus!=='RUNNING'" size="mini" type="danger" @click="jobDel(row)">
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
        label-width="70px"
        style="margin-right:50px;margin-left:50px"
      >
        <el-form-item label="类型">
          <el-tabs v-model="activeTab" @tab-click="tabClick">
            <el-tab-pane v-model="temp.jobType" label="Flink Sql" name="sql">以sql编辑器构建任务</el-tab-pane>
            <el-tab-pane v-model="temp.jobType" label="Flink Jar" name="jar">以上传jar包构建任务</el-tab-pane>
          </el-tabs>
        </el-form-item>
        <el-form-item label="名称" prop="jobName">
          <el-input v-model="temp.jobName" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="temp.describes" type="textarea" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="dialogStatus==='sql'?createSqlData():createJarData()">
          确认
        </el-button>
      </div>
    </el-dialog>
    <el-dialog title="日志" :visible.sync="dialogFormLog" style="width: 80%;margin-left: 15%">
      <el-form
        ref="logForm"
        label-position="left"
      >
        <textarea style="margin: 0px; width: 100%; height: 400px;resize:none" disabled="disabled">{{ log.logInfo }}</textarea>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import {
  jobList,
  jobFilter,
  createJob,
  jobCancel,
  commitJob,
  jobDel,
  runWithAppJob,
  jobLog,
  appContainerInfo,
  jobCommitWithJar
} from '@/api/job'
import { showLoading, hideLoading } from '@/utils/loading'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        RUNNING: 'success',
        FINISHED: 'info',
        FAILED: 'danger'
      }
      return statusMap[status]
    },
    parseTime(time, cFormat) {
      if (arguments.length === 0 || !time) {
        return null
      }
      const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
      let date
      if (typeof time === 'object') {
        date = time
      } else {
        if ((typeof time === 'string')) {
          if ((/^[0-9]+$/.test(time))) {
            // support "1548221490638"
            time = parseInt(time)
          } else {
            // support safari
            // https://stackoverflow.com/questions/4310953/invalid-date-in-safari
            time = time.replace(new RegExp(/-/gm), '/')
          }
        }

        if ((typeof time === 'number') && (time.toString().length === 10)) {
          time = time * 1000
        }
        date = new Date(time)
      }
      const formatObj = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
        a: date.getDay()
      }
      const time_str = format.replace(/{([ymdhisa])+}/g, (result, key) => {
        const value = formatObj[key]
        // Note: getDay() returns 0 on Sunday
        if (key === 'a') {
          return ['日', '一', '二', '三', '四', '五', '六'][value]
        }
        return value.toString().padStart(2, '0')
      })
      return time_str
    },
    formatDuring(mss) {
      const days = Math.floor(mss / (1000 * 60 * 60 * 24))
      const hours = Math.floor((mss % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((mss % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.round((mss % (1000 * 60)) / 1000)
      if (days !== 0) {
        return days + '天' + hours + '小时' + minutes + '分钟' + seconds + '秒'
      } else if (days === 0 && hours !== 0) {
        return hours + '小时' + minutes + '分钟' + seconds + '秒'
      } else if (days === 0 && hours === 0 && minutes !== 0) {
        return minutes + '分钟' + seconds + '秒'
      } else if (days === 0 && hours === 0 && minutes === 0 && seconds !== 0) {
        return seconds + '秒'
      }
    }
    // typeFilter(type) {
    //   return calendarTypeKeyValue[type]
    // }
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listQuery: {
        pageNum: 1,
        pageSize: 10,
        jobName: null,
        jobStatus: null
      },
      activeTab: 'sql',
      importanceOptions: ['RUNNING', 'FINISHED', 'FAILED'],
      // calendarTypeOptions,
      // sortOptions: [{ label: 'ID Ascending', key: '+id' }, { label: 'ID Descending', key: '-id' }],
      statusOptions: ['RUNNING', 'FINISHED', 'FAILED'],
      showReviewer: false,
      temp: {
        jobType: 'sql',
        jobName: '',
        describes: ''
      },
      log: {
        logInfo: '正在获取日志...'
      },
      dialogFormLog: false,
      dialogFormVisible: false,
      dialogStatus: 'sql',
      textMap: {
        update: 'Edit',
        create: '创建任务'
      },
      dialogCancelVisible: false,
      pvData: [],
      rules: {
        jobName: [{ required: true, message: '名称不能为空', trigger: 'change' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
  },
  beforeDestroy() {
    clearInterval(this.timer)
  },
  methods: {
    getList() {
      jobList(this.listQuery).then(response => {
        this.list = response.content.content
        this.total = response.content.totalSize
        // Just to simulate the time of the request
      })
    },
    handleFilter() {
      jobFilter(this.listQuery).then(response => {
        this.list = response.content.content
        this.total = response.content.totalSize
      })
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
      this.dialogStatus = 'sql'
      this.temp.jobType = 'Flink Sql'
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
    createSqlData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createJob(this.temp).then(response => {
            response.data
          })
          this.$router.push({ name: 'flink-job-edit', params: { jobName: this.temp.jobName }})
        }
      })
    },
    editUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.$router.push({ name: 'flink-job-edit', params: { jobName: row.jobName }})
    },
    createJarData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createJob(this.temp).then(response => {
            response.data
          })
          this.$router.push({ name: 'flink-jar-job-edit', params: { jobName: this.temp.jobName }})
        }
      })
    },
    editJarUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.$router.push({ name: 'flink-jar-job-edit', params: { jobName: row.jobName }})
    },
    jobStrat(row) {
      const parms = {
        'jobName': row.jobName
      }
      commitJob(parms).then(response => {
        this.getList()
      })
    },
    jobCommitWithJar(row) {
      const parms = {
        'jobName': row.jobName
      }
      jobCommitWithJar(parms).then(response => {
        this.getList()
      })
    },
    jobCancel(row) {
      this.$confirm('确定要停止该任务么?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        const parms = {
          'jobId': row.id
        }
        showLoading()
        jobCancel(parms).then(response => {
          hideLoading()
          this.getList()
        })
      }
      )
    },
    jobDel(row) {
      this.$confirm('确定要删除该任务么?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        const parms = {
          'jobId': row.id
        }
        jobDel(parms).then(response => {
          response.data
          this.getList()
        })
      })
    },
    tabClick(tab, event) {
      if (tab.$options.propsData.name === 'sql') {
        this.dialogStatus = 'sql'
        this.temp.jobType = 'Flink Sql'
      } else if (tab.$options.propsData.name === 'jar') {
        this.dialogStatus = 'jar'
        this.temp.jobType = 'Flink Jar'
      }
    },
    jobLog(row) {
      this.dialogFormLog = true
      const parms = {
        'jobId': row.id
      }
      jobLog(parms).then(response => {
        this.log.logInfo = response.content
      })
    },
    linkFlinkUI(row) {
      const parms = {
        'appId': row.appId
      }
      appContainerInfo(parms).then(response => {
        window.open(response.content + '/#/job/' + row.appId + '/overview', '_blank')
      })
    }
  }
}
</script>
