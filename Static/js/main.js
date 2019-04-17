/**
 * Copyright (c) Mohammad Naghavi <mohamnag@gmail.com>
 *
 * Licenced as stated by LICENSE file under root of this code.
 *
 * * NOTICE:
 *      If your nginx config varies from the default config
 *      provided in this code, you probably need to change
 *      value of filesBaseUrl on top of this module too.
 *
 * Created by mohamnag on 11/02/16.
 */



$(document).ready(function () {

    var filesBaseUrl = "/download";

    var fileListElement = $("#file-list");
    var fileItemElementTemplate = fileListElement.find("li").detach();

    function renderFileElement(directory, fileName, fileType, fileSize, fileDate) {

        var fileItemElement = fileItemElementTemplate.clone();

        fileItemElement.addClass(fileType);
        fileItemElement.find(".file-name").text(fileName);

        if (fileDate) {
            fileItemElement.find(".file-date").text(moment(fileDate).format("YYYY-MM-DD HH:mm:ss"));
        }

        if (fileType === "parent") {
            // navigate to parent dir
            fileItemElement.find(".file-link").click(function () {
                event.preventDefault();
                navigateTo(directory);
            });

        } else if (fileType === "directory") {
            // navigate to sub dir
            fileItemElement.find(".file-link").click(function () {
                event.preventDefault();
                navigateTo(directory + fileName + "/");
            });

        } else if (fileType === "other") {
            // nginx returns symlinks as type other,
            // lets try to follow the links
            event.preventDefault();
            fileItemElement.find(".file-link").click(function () {
                navigateTo(directory + fileName + "/");
            });

        } else {
            // just file dl
            fileItemElement.find(".file-link")
                .attr("href", filesBaseUrl + directory + fileName)
                .attr("target", "_blank");
        }

        if (fileSize) {
            fileItemElement.find(".file-size").text(fileSize);
        }

        return fileItemElement;
    }

    function getParentDir(path) {

        if (path.length <= 1) {
            return null;
        }

        var lastSlashPos = path.lastIndexOf("/", path.length - 2);
        var parentDir = lastSlashPos >= 0 ? path.substr(0, lastSlashPos + 1) : null;

        return parentDir;
    }

    function renderFileList(filesData, path) {

        var sortBy = $('input[name=sort]:checked').val();
        if (sortBy === "date") {
            console.log("sort by date");

            filesData.sort(function (fileA, fileB) {
                return fileB.mtime.getTime() - fileA.mtime.getTime();
            });

        } else if (sortBy === "name") {
            console.log("sort by name");

            filesData.sort(function (fileA, fileB) {
                return fileA.name.toLowerCase().localeCompare(fileB.name.toLowerCase());
            });

        } else if (sortBy === "size") {
            console.log("sort by size");

            filesData.sort(function (fileA, fileB) {
                var sizeA = fileA.rawSize ? fileA.rawSize : Number.MIN_VALUE;
                var sizeB = fileB.rawSize ? fileB.rawSize : Number.MIN_VALUE;
                return sizeA - sizeB;
            });
        }

        fileListElement.empty();

        var parentDir = getParentDir(path);

        if (parentDir) {
            fileListElement.append(renderFileElement(
                parentDir,
                "..",
                "parent"
            ));
        }

        filesData.forEach(function (fileData) {
            fileListElement.append(renderFileElement(
                path,
                fileData.name,
                fileData.type,
                fileData.size,
                fileData.mtime
            ));
        });
    }

    function navigateTo(path) {
        $.ajax({
            url: filesBaseUrl + path,

            dataType: "json",

            success: function (filesData) {
                // fix sizes and dates
                filesData.map(function (fileData) {
                    fileData.mtime = new Date(fileData.mtime);

                    if (fileData.hasOwnProperty("size")) {
                        fileData.rawSize = fileData.size;
                        fileData.size = fileSize(fileData.size);
                    }

                    return fileData;
                });

                renderFileList(filesData, path);

                $('input[name=sort]')
                    .unbind("change")
                    .on("change", function () {
                        renderFileList(filesData, path);
                    });

                console.log("replaceState", path);
                history.replaceState(null, path, '#' + path);


                isNavigating = false;
            },

            error: function (jqxhr, textStatus, errorThrown) {
                console.log(jqxhr, textStatus, errorThrown);

                if(textStatus === "timeout") {
                    alert("Request to server timed out, retry later!");

                } else if(textStatus === "abort") {
                    alert("Connection to server has been aborted, retry later!");

                } else if(textStatus === "parsererror") {
                    alert("Invalid response from server!");

                } else if(jqxhr.status === 404) {
                    alert("Server cant find this file/directory!");

                } else {
                    // also if(textStatus === "error")
                    alert("Something went wrong in communication to server, retry later!");
                }

                history.back();
            }
        });
    }

    function fileSize(bytes) {
        var exp = Math.log(bytes) / Math.log(1024) | 0;
        var value = bytes / Math.pow(1024, exp);

        if (exp == 0) {
            return value.toFixed(0) + ' bytes';

        } else {
            var result = value.toFixed(2);
            return result + ' ' + 'KMGTPEZY'[exp - 1] + 'B';
        }

    }

    var isNavigating = false;

    function navigateToUrlLocation() {
        var requestedPath = window.location.hash;
        var startPath = requestedPath ? requestedPath.substr(1) : "/";
        console.log("requestedPath: ",requestedPath, "startPath", startPath)
        navigateTo(startPath);
    }

    window.onpopstate = function () {
        console.log("onpopstate")
        if (!isNavigating) {
            navigateToUrlLocation();
        }
    };

    upload_init();
    navigateToUrlLocation();
});

function upload_init(){
    console.log("upload_init init")
    // 初始化提示消息
    $('#errorMsg').dialog({
        autoOpen: false,
        width: 600,
        buttons: {
            "确定": function () {
            $(this).dialog("close");
            }
        }
    });

    $('#successMsg').dialog({
        autoOpen: false,
        width: 600,
        buttons: {
            "确定": function () {
            $(this).dialog("close");
            window.location.reload();
            }
        }
    });

    //WebUploader实例
    var uploader = WebUploader.create({

        //设置选完文件后是否自动上传
        auto: false,


        //swf文件路径
        //swf: BASE_URL + '~/FileUpload/Uploader.swf',
        swf: 'assets/Uploader.swf',

        // 文件接收服务端。
        server: '/upload',

        // 选择文件的按钮。可选。
        // 内部根据当前运行是创建，可能是input元素，也可能是flash.
        pick: '#upload',

        // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
        resize: false

        //选择图片文件
        //accept: {
        //    title: 'Images',
        //    extensions: 'gif,jpg,jpeg,bmp,png',
        //    mimeTypes: 'image/*'
        //}
    });

    // global md5sum
    var md5sum = null;
    uploader.on('fileQueued', function(file){
        uploader.md5File(file)
        .progress(function(percentage){
            console.log('md5 percentage:', percentage);
        })
        .then(function(val){
            console.log('md5 result:', val);
            md5sum = val;
            uploader.upload();
        })
    })

    uploader.on('uploadBeforeSend', function (object, data, headers){
        var requestedPath = window.location.hash;
        var startPath = requestedPath ? requestedPath.substr(1) : "/";
        data.dir_path = startPath;
        data.md5sum = md5sum
    })

    uploader.on('uploadAccept', function (object, ret){
        var filename = object.file.name;
        var err_msg = "";
        if (ret.code !==0 ){
            err_msg = ret.msg ? ret.msg: "unknown error"
        }
        if (err_msg){
            $('#errorMsg').html(filename + "上传失败, 错误消息: " + err_msg).dialog('open');
        } else {
            $('#successMsg').html(filename + "上传成功").dialog('open');
        }
    });
}

