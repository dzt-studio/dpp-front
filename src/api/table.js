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
