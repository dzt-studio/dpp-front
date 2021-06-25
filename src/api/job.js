import request from '@/utils/request'

export function jobList(data) {
  return request({
    url: '/job/list',
    method: 'post',
    data
  })
}
export function getJob(data) {
  return request({
    url: '/job/info',
    method: 'get',
    params: data
  })
}
export function createJob(data) {
  return request({
    url: '/job/create-and-save',
    method: 'post',
    data
  })
}
export function jobDel(data) {
  return request({
    url: '/job/delete',
    method: 'get',
    params: data
  })
}
export function verifySql(data) {
  return request({
    url: '/job/verify-sql',
    method: 'post',
    data
  })
}
export function commitJob(data) {
  return request({
    url: '/job/commit',
    method: 'get',
    params: data
  })
}
export function jobLog(data) {
  return request({
    url: '/job/get-log',
    method: 'get',
    params: data
  })
}
export function appJarList(data) {
  return request({
    url: '/job/app-jar-list',
    method: 'get'
  })
}
export function uploadJob(data) {
  return request({
    url: '/job/jar-upload',
    method: 'post',
    data
  })
}
export function jobCancel(data) {
  return request({
    url: '/job/stop',
    method: 'get',
    params: data
  })
}
export function appContainerInfo(data) {
  return request({
    url: '/job/app-container-info',
    method: 'get',
    params: data
  })
}
export function jobCommitWithJar(data) {
  return request({
    url: '/job/job-commit-with-jar',
    method: 'get',
    params: data
  })
}
export function saveJarApp(data) {
  return request({
    url: '/job/create-and-save-with-jar',
    method: 'post',
    data
  })
}
