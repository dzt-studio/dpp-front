<template>
  <div>
    <h4 style="margin-left: 2%">
      {{ form.jobName }}
    </h4>
    <div>
      <el-form ref="form" :rules="rules" :model="form" label-width="150px" style="border: solid 1px #d7d1d1;height: 650px">
        <el-form-item label="容器配额" prop="containerId" style="margin-top: 2%">
          <el-select v-model="form.containerMsg" placeholder="请选择容器配额" @focus="getContainerList">
            <el-option v-for="item in containers" :key="item.containerMsg" :value="item.containerId" :label="item.containerMsg">
              <li @click="changeFv(item)">
                <span>{{item.containerMsg}}</span>
              </li>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="flink版本" prop="fv" style="margin-top: 2%">
          <el-badge v-model="form.fv">
          </el-badge>
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
        <el-form-item>
          <el-button type="primary" @click="onSubmit">运行</el-button>
          <el-button @click="onSave">保存</el-button>
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
import sqlFormatter from 'sql-formatter'
import { uploadJob, getJob, appJarList, saveJarApp, jobCommitWithJar, containerVList } from '@/api/job'
import { containerListNotPage } from '@/api/container'
export default {
  data() {
    return {
      tempUrl: '',
      verifyForm: {
        verifyInfo: ''
      },
      form: {
        jobName: this.$route.params.jobName,
        appParams: '',
        containerId: '',
        fv: '',
        jarName: '',
        containerMsg: '',
        appMainClass: '',
        enableSchedule: false
      },
      containers: null,
      fvs: null,
      appJars: null,
      rules: {
        containerId: [{ required: true, message: '容器不能为空', trigger: 'change' }],
        jarName: [{ required: true, message: '应用不能为空', trigger: 'change' }],
        appMainClass: [{ required: true, message: '主类不能为空', trigger: 'change' }]
      }
    }
  },
  created() {
    // eslint-disable-next-line no-undef
    getJob(this.form).then(response => {
      this.dialogFormVisible = false
      this.form.containerId = response.content.containerId
      this.form.containerMsg = response.content.containerMsg
      this.form.appParams = response.content.appParams
      this.form.jarName = response.content.jarName
      this.form.appMainClass = response.content.mainClass
      this.form.enableSchedule = response.content.enableSchedule
      this.form.fv = response.content.fv
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
    formaterSql(val) {
      const dom = this.$refs.sqleditor
      dom.editor.setValue(sqlFormatter.format(dom.editor.getValue()))
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
    }
  }
}
</script>
