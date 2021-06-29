FROM node:10.16.2-alpine

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    &&apk --update add tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Chongqing" > /etc/timezone \
    && apk del tzdata
RUN mkdir -p /usr/app
COPY ./ /usr/app
WORKDIR /usr/app
ENV NODE_ENV=production
CMD npm run dev
