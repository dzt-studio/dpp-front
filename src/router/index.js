import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },

  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },

  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [{
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('@/views/dashboard/index'),
      meta: { title: 'Dashboard', icon: 'dashboard' }
    }]
  },
  {
    path: '/container-manage',
    component: Layout,
    redirect: '/container-manage',
    children: [{
      path: 'container',
      name: '容器管理',
      component: () => import('@/views/table/container-list-table'),
      meta: { title: '容器管理', icon: 'el-icon-s-help' }
    }]
  },
  {
    path: '/job-manage',
    component: Layout,
    redirect: '/job-manage/job',
    name: '作业管理',
    meta: { title: '作业管理', icon: 'el-icon-s-help' },
    children: [
      {
        path: 'flink-job',
        name: 'flinkJob',
        component: () => import('@/views/table/flink-job-list-table'),
        meta: { title: 'Flink作业', icon: 'tree' }
      },
      {
        path: 'flink-job-edit',
        name: 'flink-job-edit',
        hidden: true,
        component: () => import('@/views/form/flink-job-edit'),
        meta: { title: '作业编辑', icon: 'table' }
      },
      {
        path: 'flink-jar-job-edit',
        name: 'flink-jar-job-edit',
        hidden: true,
        component: () => import('@/views/form/flink-job-jar-edit'),
        meta: { title: '作业编辑', icon: 'table' }
      },
      {
        path: 'schedule-job',
        name: 'scheduleJob',
        component: () => import('@/views/table/job-scheduled-table'),
        meta: { title: '作业调度', icon: 'el-icon-timer' }
      }
    ]
  },
  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
