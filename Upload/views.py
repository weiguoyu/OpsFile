# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import shutil
import os
import subprocess
import time
import hashlib

from django.conf import settings
from django.views.generic import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .utils import json_response

import logging
LOGGER = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class UploadView(View):

    def upload(self, request):
        LOGGER.debug("request.POST: %s", request.POST)
        assert request.method == 'POST', {
            'code': 405,
            'msg': 'only POST method is allowed'
        }
        file_name = request.POST.get("file_name", None)
        file_path = request.POST.get("file_path", None)
        file_md5 = request.POST.get("file_md5", None)
        file_size = request.POST.get("file_size", None)
        dir_path = request.POST.get("dir_path", None)
        md5sum = request.POST.get("md5sum", None)
        

        assert file_name is not None, {
            "code": 500,
            "msg": 'file_name is required'
        }
        assert file_path is not None, {
            "code": 500,
            "msg": 'file_path is required'
        }
        assert file_md5 is not None, {
            "code": 500,
            "msg": 'file_md5 is required'
        }
        assert file_size is not None, {
            "code": 500,
            "msg": 'file_size is required'
        }
        assert dir_path is not None, {
            "code": 500,
            "msg": 'dir_path is required'
        }
        assert md5sum is not None, {
            "code": 500,
            "msg": 'md5sum is required'
        }
        assert md5sum == file_md5, {
            "code": 500,
            "msg": 'file md5 not match'
        } 

        download_root = settings.DOWNLOAD_ROOT
        download_dir = os.path.join(download_root, dir_path.strip('/'))
        LOGGER.debug("download_dir: %s", download_dir)
        if not os.path.exists(download_dir) or not os.path.isdir(download_dir):
            assert False, {
                "code": 400,
                "msg": 'download_dir %s not exist' % download_dir
            }
        file_download_path = os.path.join(download_dir, file_name)
        if os.path.exists(file_download_path):
            file_backup_path = file_download_path + "." + time.strftime('%Y-%m-%d_%H:%M:%S', time.localtime())
            shutil.move(file_download_path, file_backup_path)

            file_md5_download_path = ".".join([file_download_path, "md5"])
            file_md5_backup_path = ".".join([file_backup_path, "md5"])
            if os.path.exists(file_md5_download_path):
                shutil.move(file_md5_download_path, file_md5_backup_path)
            else:
                with open(file_backup_path) as file:
                    cur_md5 = hashlib.md5(file.read()).hexdigest()
                    with open(file_md5_backup_path, 'wb') as md5_file:
                        md5_file.write(cur_md5)

        shutil.copyfile(file_path, file_download_path)
        file_md5_download_path = ".".join([file_download_path, "md5"])
        with open(file_md5_download_path, 'wb') as md5_file:
            md5_file.write(file_md5)

        return {
            'code': 0,
            'msg': 'upload success'
        }

    def file_list(self, request):
        assert request.method == 'GET', {
            'code': 400,
            'msg': 'only GET method is allowed'
        }
        LOGGER.debug(request.GET)
        dir_path = request.GET.get("dir_path", None)
        LOGGER.debug("dir_path: %s", dir_path)
        assert dir_path, {
            'code': 400,
            'msg': 'dir_path is required'
        }
        absolute_path = os.path.join(settings.UPLOAD_PATH, dir_path.strip("/"))
        LOGGER.debug("absolute_path: %s", absolute_path)
        files = os.listdir(absolute_path)
        LOGGER.debug("files: %s", files)
        data = {
            "file": [],
            "dir": []
        }
        for file in files:
            file_path = os.path.join(settings.UPLOAD_PATH, file)
            if os.path.isdir(file_path):
                data["dir"].append(file)
            elif os.path.isfile(file_path):
                data["file"].append(file)
        return data


    @json_response
    def get(self, request, action):
        func = getattr(self, action, None)
        assert func, (404, '{0} not found'.format(request.path))
        return func(request)

    @json_response
    def post(self, request, action):
        func = getattr(self, action, None)
        assert func, (404, '{0} not found'.format(request.path))
        return func(request)
