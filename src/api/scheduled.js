import request from '@/utils/request'

export function cronList(data) {
  return request({
    url: '/cron/list',
    method: 'post',
    data
  })
}
export function cronCreate(data) {
  return request({
    url: '/cron/create',
    method: 'post',
    data
  })
}
export function enableScheduleJob() {
  return request({
    url: '/cron/enable-schedule-job',
    method: 'get'
  })
}
export function cronUpdate(data) {
  return request({
    url: '/cron/update',
    method: 'post',
    data
  })
}
export function restartCron(data) {
  return request({
    url: '/cron/restart',
    method: 'get',
    params: data
  })
}
export function stopCron(data) {
  return request({
    url: '/cron/stop',
    method: 'get',
    params: data
  })
}
export function delCron(data) {
  return request({
    url: '/cron/delete',
    method: 'get',
    params: data
  })
}
