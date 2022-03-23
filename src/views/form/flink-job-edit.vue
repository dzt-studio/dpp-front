<template>
  <div>
    <h4 style="margin-left: 2%">
      {{ form.jobName }}
    </h4>
    <div style="margin-left: 2%;margin-top: 3%;border: solid 1px #d7d1d1;width: 95%;">
      <el-button type="primary" size="small" class="sql-btn" @click="formaterSql (form.flinkSql)">格式化</el-button>
      <el-button type="primary" size="small" class="sql-btn" @click="verifySql">语义校验</el-button>
    </div>
    <div style="width: 70%;margin-left: 2%;float:left;border-top: solid 1px #d7d1d1;border-right:solid 1px #d7d1d1;border-bottom:solid 1px #d7d1d1">
      <SqlEditor
        ref="sqleditor"
        style=""
        :value="form.flinkSql"
        @changeTextarea="changeTextarea($event)"
      />
    </div>
    <div style="width: 25%;float:right; margin-right: 3%;">
      <el-form ref="form" :rules="rules" :model="form" label-width="30%" style="border: solid 1px #d7d1d1;">
        <el-badge>运行参数</el-badge>
        <el-form-item label="容器策略">
          <el-tabs v-model="activeTab" @tab-click="tabClick">
            <el-tab-pane label="共享队列" name="share">
              <el-select v-model="form.containerMsg" placeholder="请选择容器配额" @focus="getContainerList">
                <el-option v-for="item in containers" :key="item.containerMsg" :value="item.containerId" :label="item.containerMsg">
                  <li @click="changeFv(item)">
                    <span>{{ item.containerMsg }}</span>
                  </li>
                </el-option>
              </el-select>
            </el-tab-pane>
            <el-tab-pane label="独享队列" name="alone" />
          </el-tabs>
        </el-form-item>
        <el-form-item v-if="activeTab=== 'alone'" label="Flink版本" prop="fv">
          <el-select v-model="form.fv" placeholder="请选择Flink版本" @focus="getFvList">
            <el-option v-for="item in fv" :key="item" :value="item" :label="item" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="activeTab=== 'alone'" label="JM内存(Mb)" prop="jm">
          <el-input-number v-model="form.jm" />
        </el-form-item>
        <el-form-item v-if="activeTab=== 'alone'" label="TM内存(Mb)" prop="tm">
          <el-input-number v-model="form.tm" />
        </el-form-item>
        <el-form-item v-if="activeTab=== 'alone'" label="Slot数" prop="ys">
          <el-input-number v-model="form.ys" />
        </el-form-item>
        <el-form-item label="最大并行数" prop="parallelism">
          <el-input-number v-model="form.parallelism" />
        </el-form-item>
        <el-form-item label="开启Checkpoint" prop="checkpointEnable">
          <el-switch v-model="form.checkpointEnable" />
        </el-form-item>
        <el-form-item v-if="form.checkpointEnable===true" label="Checkpoint时间间隔" prop="checkpointInterval">
          <el-input-number v-model="form.checkpointInterval" />
        </el-form-item>
        <el-form-item label="失败重启次数" prop="restartStrategyCount">
          <el-input-number v-model="form.restartStrategyCount" />
        </el-form-item>
        <el-form-item label="失败重启时间间隔" prop="restartStrategyTime">
          <el-input-number v-model="form.restartStrategyTime" />
        </el-form-item>
        <el-form-item label="开启任务调度" prop="enableSchedule">
          <el-switch v-model="form.enableSchedule" />
        </el-form-item>
        <el-form-item label="开启任务报警" prop="enableWarning">
          <el-switch v-model="form.enableWarning" />
        </el-form-item>
        <el-form-item v-if="form.enableWarning=== true" label="报警方式" prop="warnType">
          <el-select v-model="form.warnType" placeholder="请选择报警类型">
            <el-option v-for="item in warnType" :key="item" :value="item" :label="item" /></el-select>
        </el-form-item>
        <el-form-item v-if="form.enableWarning === true && form.warnType === '钉钉'" label="tokenId" prop="dingTokenId">
          <el-input v-model="form.dingTokenId" />
        </el-form-item>
        <el-form-item v-if="form.enableWarning === true && form.warnType === '邮件'" label="e-mail" prop="eMail">
          <el-input v-model="form.emailAdd" />
        </el-form-item>
        <el-form-item>
          <el-button v-if="form.jobStatus!=='RUNNING'" size="mini" type="primary" @click="onSubmit">运行</el-button>
          <el-button v-if="form.jobStatus==='RUNNING'" size="mini" type="danger" @click="jobCancel(form.jobId)">
            停止
          </el-button>
          <el-button size="mini" @click="onSave">保存</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div style="margin-left: 2%;">
      <textarea v-model="verifyForm.verifyInfo" disabled style="color: red;width: 97%;height: 140px;outline:none;resize:none;" />
    </div>
  </div>
</template>
<script>
import { format } from 'sql-formatter'
import SqlEditor from '@/views/form/sqlEditer'
import { createJob, getJob, commitJob, verifySql, jobCancel } from '@/api/job'
import { containerListNotPage, fvList } from '@/api/container'
import { showLoading, hideLoading } from '@/utils/loading'

export default {
  components: {
    SqlEditor
  },
  data() {
    return {
      verifyForm: {
        verifyInfo: ''
      },
      activeTab: '',
      jobName: { jobName: this.$route.params.jobName },
      form: {
        jobId: '',
        jobName: '',
        jobStatus: '',
        containerId: '',
        containerMsg: '',
        parallelism: '',
        checkpointEnable: false,
        checkpointInterval: '',
        restartStrategyCount: '',
        restartStrategyTime: '',
        flinkSql: '',
        enableSchedule: false,
        fv: '',
        containerType: '',
        jm: '',
        tm: '',
        ys: '',
        enableWarning: false,
        warnType: '',
        dingTokenId: '',
        emailAdd: ''
      },
      startType: '',
      warnType: ['钉钉', '邮件'],
      containers: null,
      fv: null,
      rules: {
        containerId: [{ required: true, message: '容器不能为空', trigger: 'change' }],
        parallelism: [{ required: true, message: '并行数不能为空', trigger: 'change' }],
        checkpointEnable: [{ required: true, message: '并行数不能为空', trigger: 'change' }],
        checkpointInterval: [{ required: true, message: '并行数不能为空', trigger: 'change' }],
        restartStrategyCount: [{ required: true, message: '并行数不能为空', trigger: 'change' }],
        restartStrategyTime: [{ required: true, message: '并行数不能为空', trigger: 'change' }],
        sqlDetails: [{ required: true, message: '并行数不能为空', trigger: 'change' }],
        jm: [{ required: true, message: 'JM内存未设置', trigger: 'change' }],
        tm: [{ required: true, message: 'TM内存未设置', trigger: 'change' }],
        fv: [{ required: true, message: '请选择flink版本', trigger: 'change' }],
        warnType: [{ required: true, message: '请选择报警方式', trigger: 'change' }],
        dingTokenId: [{ required: true, message: 'TokenId不能为空', trigger: 'change' }],
        eMail: [{ required: true, message: 'e-mail不能为空', trigger: 'change' }]
      }
    }
  },
  created() {
    // eslint-disable-next-line no-undef
    getJob(this.jobName).then(response => {
      this.dialogFormVisible = false
      const dom = this.$refs.sqleditor
      this.form.jobId = response.content.jobId
      this.form.jobName = response.content.jobName
      this.form.jobStatus = response.content.jobStatus
      dom.editor.setValue(format(response.content.flinkSql, { language: 'plsql' }))
      this.form.containerId = response.content.containerId
      this.form.containerMsg = response.content.containerMsg
      this.form.parallelism = response.content.parallelism
      this.form.checkpointEnable = response.content.checkpointEnable
      this.form.checkpointInterval = response.content.checkpointInterval
      this.form.restartStrategyCount = response.content.restartStrategyCount
      this.form.restartStrategyTime = response.content.restartStrategyTime
      this.form.enableSchedule = response.content.enableSchedule
      this.form.fv = response.content.fv
      if (response.content.containerType === 1) {
        this.activeTab = 'share'
        this.form.containerType = 1
      } else {
        this.activeTab = 'alone'
        this.form.containerType = 2
      }
      this.form.jm = response.content.jm
      this.form.tm = response.content.tm
      this.form.ys = response.content.ys
      this.form.enableWarning = response.content.enableWarning
      if (this.form.enableWarning) {
        this.form.warnType = response.content.warnType
        this.form.dingTokenId = response.content.dingTokenId
        this.form.eMail = response.content.eMail
      }
    })
  },
  methods: {
    changeTextarea(val) {
      this.$set(this.form, 'flinkSql', val)
    },
    formaterSql(val) {
      const dom = this.$refs.sqleditor
      dom.editor.setValue(format(dom.editor.getValue(), { language: 'plsql' }))
    },
    onSubmit() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          verifySql(this.form).then(response => {
            this.verifyForm.verifyInfo = response.content
            if (response.content === '校验成功') {
              createJob(this.form).then(response => {
                this.dialogFormVisible = false
                this.$notify({
                  title: 'Success',
                  message: 'Created Successfully',
                  type: 'success',
                  duration: 2000
                })
                if (response.code === 200) {
                  const parm = {
                    'jobName': this.form.jobName,
                    'startType': 2
                  }
                  commitJob(parm).then(response => {
                    this.dialogFormVisible = false
                    this.$notify({
                      title: 'Success',
                      message: 'Created Successfully',
                      type: 'success',
                      duration: 2000
                    })
                    this.$router.push({ name: 'flinkJob' })
                  })
                }
              })
            }
          })
        }
      })
    },
    onSave() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          verifySql(this.form).then(response => {
            this.verifyForm.verifyInfo = response.content
            createJob(this.form).then(() => {
              this.dialogFormVisible = false
              this.$notify({
                title: 'Success',
                message: 'Created Successfully',
                type: 'success',
                duration: 2000
              })
            })
          })
        }
      })
    },
    verifySql() {
      verifySql(this.form).then(response => {
        this.verifyForm.verifyInfo = response.content
      })
    },
    getContainerList() {
      containerListNotPage().then(response => {
        this.containers = response.content
      })
    },
    getFvList() {
      fvList().then(response => {
        this.fv = response.content
      })
    },
    jobCancel(jobId) {
      this.$confirm('确定要停止该任务么?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        const parms = {
          'jobId': jobId
        }
        showLoading()
        jobCancel(parms).then(response => {
          getJob(this.jobName).then(response => {
            hideLoading()
            this.dialogFormVisible = false
            const dom = this.$refs.sqleditor
            this.form.jobId = response.content.jobId
            this.form.jobName = response.content.jobName
            this.form.jobStatus = response.content.jobStatus
            dom.editor.setValue(format(response.content.flinkSql, { language: 'plsql' }))
            this.form.containerId = response.content.containerId
            this.form.containerMsg = response.content.containerMsg
            this.form.parallelism = response.content.parallelism
            this.form.checkpointEnable = response.content.checkpointEnable
            this.form.checkpointInterval = response.content.checkpointInterval
            this.form.restartStrategyCount = response.content.restartStrategyCount
            this.form.restartStrategyTime = response.content.restartStrategyTime
            this.form.enableSchedule = response.content.enableSchedule
            this.form.fv = response.content.fv
          })
        })
      }
      )
    },
    changeFv(item) {
      this.form.containerId = item.containerId
      this.form.containerMsg = item.containerMsg
      this.form.fv = item.containerVersion
    },
    tabClick(tab, event) {
      if (tab.$options.propsData.name === 'share') {
        this.form.containerType = 1
      } else {
        this.form.containerType = 2
      }
    }
  }
}
</script>
