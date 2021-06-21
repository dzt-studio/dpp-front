import request from '@/utils/request'

export function containerList(data) {
  return request({
    url: '/container/list',
    method: 'post',
    data
  })
}
export function addController(data) {
  return request({
    url: '/container/create',
    method: 'post',
    data
  })
}
export function delContainer(data) {
  return request({
    url: '/container/delete',
    method: 'get',
    params: data
  })
}
export function updateController(data) {
  return request({
    url: '/container/update',
    method: 'post',
    data
  })
}
export function containerListNotPage() {
  return request({
    url: '/container/list-all',
    method: 'get'
  })
}