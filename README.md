# 基于http协议的文件上传下载服务器
核心功能点: 
1. nginx 上传模块
2. nginx 文件浏览功能  autoindex on
3. 前端上传模块 webuploader

# 环境搭建
1. nginx版本 nginx-release-1.7.9.tar.gz
2. nginx上传模块　nginx-upload-module-2.3.0.tar.gz
3. 分别解压两个压缩包 
4. # tar -zxvf nginx-release-1.7.9.tar.gz
5. # tar -zxvf nginx-upload-module-2.3.0.tar.gz
6. # cd nginx-release-1.7.9
7. # auto/configure --prefix=/usr/local/nginx --add-module=../nginx-upload-module-2.3.0
8. # make
9. # make install
10. # 配置nginx conf(conf/nginx.conf), 新建目录 /home/upload, /home/download 并启动nginx服务
11. # 启动python服务  python manage.py runserver 0.0.0.0:8080
