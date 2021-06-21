<template>
  <div>
    <label>
      <textarea
        ref="mycode"
        v-model="value"
        class="codesql"
      />
    </label>
  </div>
</template>
<script>
import 'codemirror/theme/ambiance.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/hint/show-hint.css'

const CodeMirror = require('codemirror/lib/codemirror')
require('codemirror/addon/edit/matchbrackets')
require('codemirror/addon/selection/active-line')
require('codemirror/mode/sql/sql')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/hint/sql-hint')
export default {
  props: {
    value: {
      type: String,
      default: ''
    },
    sqlStyle: {
      type: String,
      default: 'default'
    },
    readOnly: {
      type: [Boolean, String]
    }
  },
  data() {
    return {
      editor: null
    }
  },
  computed: {
    // eslint-disable-next-line vue/return-in-computed-property
    newVal() {
      if (this.editor) {
        return this.editor.getValue()
      }
    }
  },
  watch: {
    newVal(newV, oldV) {
      if (this.editor) {
        this.$emit('changeTextarea', this.editor.getValue())
      }
    }
  },

  mounted() {
    const mime = 'text/x-mariadb'
    // const theme = 'xq-light'// 设置主题，不设置的会使用默认主题
    this.editor = CodeMirror.fromTextArea(this.$refs.mycode, {
      value: this.value,
      mode: mime, // 选择对应代码编辑器的语言，我这边选的是数据库，根据个人情况自行设置即可
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      matchBrackets: true,
      cursorHeight: 1,
      lineWrapping: true,
      readOnly: this.readOnly,
      // theme: theme,
      // autofocus: true,
      extraKeys: { 'Ctrl': 'autocomplete' }, // 自定义快捷键
      hintOptions: { // 自定义提示选项
        // 当匹配只有一项的时候是否自动补全
        completeSingle: false
        // tables: {
        //     users: ['name', 'score', 'birthDate'],
        //     countries: ['name', 'population', 'size']
        // }
      }
    })
    // 代码自动提示功能，记住使用cursorActivity事件不要使用change事件，这是一个坑，那样页面直接会卡死
    this.editor.on('inputRead', () => {
      this.editor.showHint()
    })
  },
  methods: {
    setVal() {
      if (this.editor) {
        if (this.value === '') {
          this.editor.setValue('')
        } else {
          this.editor.setValue(this.value)
        }
      }
    }
  }
}
</script>
<style>
  .CodeMirror {
    color: black;
    direction: ltr;
    line-height: 22px;
    height: 650px;
  }
  .CodeMirror-hints {
    z-index: 9999 !important;
  }
</style>
