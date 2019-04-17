# -*- coding: utf-8 -*-

import time
from functools import wraps
from django.http import HttpResponse, JsonResponse

import logging
LOGGER = logging.getLogger(__name__)

def json_response(func):
    """
    decorate for http response
    Args:
        func: function
    Res:
        wrapper: wrapper function for func
    """
    @wraps(func)
    def wrapper(self, request, **kwargs):
        try:
            response = None
            stime = time.time()
            resp = func(self, request, **kwargs)
            if isinstance(resp, HttpResponse):
                response = resp
            else:
                LOGGER.debug(resp)
                response = JsonResponse(resp, safe=False)
            return response
        except AssertionError as exc:
            LOGGER.error('%s %s', request.path, exc.message)
            if isinstance(exc.message, dict):
                return JsonResponse(exc.message, safe=False, status=exc.message["code"])
            else:
                return JsonResponse(
                    {
                        "code": 400,
                        "msg": exc.message
                    },
                    safe=False
                )
        except Exception as exc:
            LOGGER.exception(exc)
            res = {
                "code": 500,
                "msg": "unkown error"
            }
            return JsonResponse(res, safe=False, status=exc.message["code"])
        finally:
            etime = time.time()
            LOGGER.info(
                'Response: %s %.2f', request.path, etime - stime
            )
    return wrapper
