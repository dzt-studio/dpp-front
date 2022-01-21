<template>
  <div>
    <h4 style="margin-left: 2%">
      {{ form.jobName }}
    </h4>
    <div>
      <el-form ref="form" :rules="rules" :model="form" label-width="150px" style="border: solid 1px #d7d1d1;">
<!--        <el-form-item label="容器配额" prop="containerId" style="margin-top: 2%">-->
<!--          <el-select v-model="form.containerMsg" placeholder="请选择容器配额" @focus="getContainerList">-->
<!--            <el-option v-for="item in containers" :key="item.containerMsg" :value="item.containerId" :label="item.containerMsg">-->
<!--              <li @click="changeFv(item)">-->
<!--                <span>{{ item.containerMsg }}</span>-->
<!--              </li>-->
<!--            </el-option>-->
<!--          </el-select>-->
<!--        </el-form-item>-->
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
            <el-tab-pane label="独享队列" name="alone">
            </el-tab-pane>
            <el-form-item v-if="activeTab=== 'alone'" prop="fv">
              <el-select v-model="form.fv" placeholder="请选择Flink版本" @focus="getFvList">
                <el-option v-for="item in fv" :key="item" :value="item" :label="item">
                </el-option>
              </el-select>
            </el-form-item>
          </el-tabs>
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
        <el-form-item label="flink版本" prop="fv" style="margin-top: 2%">
          <el-badge v-model="form.fv" />
        </el-form-item>
        <el-form-item label="应用程序" prop="jarName">
          <el-select v-model="form.jarName" placeholder="请选择应用程序" @focus="getAppJarList">
            <el-option v-for="item in appJars" :key="item.id" :value="item.jarName" :label="item.jarName" />
          </el-select>
        </el-form-item>
        <el-form-item prop="upFile">
          <input id="jars" type="file" @change="getFile($event)">
        </el-form-item>
        <el-form-item>
          <el-button @click="upload($event)">上传</el-button>
        </el-form-item>
        <el-form-item label="指定主类" prop="appMainClass" style="width: 30%">
          <el-input v-model="form.appMainClass" />
        </el-form-item>
        <el-form-item label="参数" prop="parameters" style="width: 30%">
          <el-input v-model="form.appParams" />
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
        <el-form-item v-if="form.enableWarning === true && form.warnType === '钉钉'" label="tokenId" prop="dingTokenId" style="width: 30%">
          <el-input v-model="form.dingTokenId" />
        </el-form-item>
        <el-form-item v-if="form.enableWarning === true && form.warnType === '邮件'" label="e-mail" prop="emailAdd" style="width: 30%">
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
  </div>
</template>
<style>
  .el-badge__content {
    background-color: #409eff;
    margin-top: 17px;
  }
</style>
<script>
import { uploadJob, getJob, appJarList, saveJarApp, jobCommitWithJar, jobCancel } from '@/api/job'
import { containerListNotPage, fvList } from '@/api/container'
import { hideLoading, showLoading } from '@/utils/loading'
export default {
  data() {
    return {
      tempUrl: '',
      verifyForm: {
        verifyInfo: ''
      },
      activeTab: '',
      form: {
        jobId: '',
        jobName: this.$route.params.jobName,
        jobStatus: '',
        appParams: '',
        containerId: '',
        fv: '',
        jarName: '',
        containerMsg: '',
        appMainClass: '',
        enableSchedule: false,
        containerType: '',
        jm: '',
        tm: '',
        ys: '',
        enableWarning: false,
        warnType: '',
        dingTokenId: '',
        emailAdd: ''
      },
      warnType: ['钉钉', '邮件'],
      containers: null,
      fv: null,
      appJars: null,
      rules: {
        containerId: [{ required: true, message: '容器不能为空', trigger: 'change' }],
        jarName: [{ required: true, message: '应用不能为空', trigger: 'change' }],
        appMainClass: [{ required: true, message: '主类不能为空', trigger: 'change' }],
        warnType: [{ required: true, message: '请选择报警方式', trigger: 'change' }],
        dingTokenId: [{ required: true, message: 'TokenId不能为空', trigger: 'change' }],
        emailAdd: [{ required: true, message: 'e-mail不能为空', trigger: 'change' }]
      }
    }
  },
  created() {
    // eslint-disable-next-line no-undef
    getJob(this.form).then(response => {
      this.dialogFormVisible = false
      this.form.jobId = response.content.jobId
      this.form.containerId = response.content.containerId
      this.form.containerMsg = response.content.containerMsg
      this.form.appParams = response.content.appParams
      this.form.jarName = response.content.jarName
      this.form.jobStatus = response.content.jobStatus
      this.form.appMainClass = response.content.mainClass
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
        this.form.emailAdd = response.content.emailAdd
      }
    })
  },
  methods: {
    getFile(event) {
      this.file = event.target.files[0]
      console.log(this.file)
    },
    rmImage() {
      this.emitInput('')
    },
    handleImageSuccess() {
      this.emitInput(this.form.localUrl)
    },
    changeTextarea(val) {
      this.$set(this.form, 'flinkSql', val)
    },
    onSubmit() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          saveJarApp(this.form).then(response => {
            this.dialogFormVisible = false
            this.$notify({
              message: response.message,
              duration: response.code
            })
            if (response.code === 200) {
              const parm = {
                'jobName': this.form.jobName
              }
              jobCommitWithJar(parm).then(response => {
                this.dialogFormVisible = false
                this.$notify({
                  message: response.message,
                  duration: response.code
                })
                this.$router.push({ name: 'flinkJob' })
              })
            }
          })
        }
      })
    },
    upload(event) {
      if (this.file !== undefined) {
        event.preventDefault()
        const formData = new FormData()
        formData.append('file', this.file)
        uploadJob(formData).then(() => {
          this.dialogFormVisible = false
          this.$notify({
            title: 'Success',
            message: '上传成功',
            type: 'success',
            duration: 2000
          })
        })
      } else {
        this.$confirm('请选择上传文件！', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      }
    },
    onSave(event) {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          saveJarApp(this.form).then(() => {
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Created Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    getContainerList() {
      containerListNotPage().then(response => {
        this.containers = response.content
      })
    },
    changeFv(item) {
      this.form.containerId = item.containerId
      this.form.containerMsg = item.containerMsg
      this.form.fv = item.containerVersion
    },
    getAppJarList() {
      appJarList().then(response => {
        this.appJars = response.content
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
            this.form.containerId = response.content.containerId
            this.form.containerMsg = response.content.containerMsg
            this.form.appParams = response.content.appParams
            this.form.jarName = response.content.jarName
            this.form.jobStatus = response.content.jobStatus
            this.form.appMainClass = response.content.mainClass
            this.form.enableSchedule = response.content.enableSchedule
            this.form.fv = response.content.fv
          })
        })
      }
      )
    },
    tabClick(tab, event) {
      if (tab.$options.propsData.name === 'share') {
        this.form.containerType = 1
      } else {
        this.form.containerType = 2
      }
    },
    getFvList() {
      fvList().then(response => {
        this.fv = response.content
      })
    }
  }
}
</script>
