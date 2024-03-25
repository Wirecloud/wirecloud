# Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.

import json
import logging
import os

from gunicorn import glogging


LOGLEVEL = os.environ.get("LOGLEVEL", "INFO").strip().upper()
LOG_FORMAT = os.environ.get("LOGFORMAT", "PLAIN").strip().upper()


config = {
    "version": 1,
    "disable_existing_loggers": True,
    "filters": {
        "require_debug_false": {
            "()": "django.utils.log.RequireDebugFalse"
        },
        "skip_unreadable_posts": {
            "()": "wirecloud.commons.utils.log.SkipUnreadablePosts",
        }
    },
    "formatters": {
        "console_output": {
            "format": "%(message)s" if LOG_FORMAT == "JSON" else "[%(asctime)s] [%(threadName)s] [%(levelname)s] %(message)s",
            "class": "wirecloud.glogger.JSONFormatter" if LOG_FORMAT == "JSON" else "wirecloud.glogger.NewLineFormatter",
        },
    },
    "handlers": {
        "console": {
            "level": LOGLEVEL,
            "class": "logging.StreamHandler",
            "formatter": "console_output",
        },
        "mail_admins": {
            "level": "ERROR",
            "filters": ["require_debug_false", "skip_unreadable_posts"],
            "class": "django.utils.log.AdminEmailHandler"
        }
    },
    "loggers": {
        "": {
            "handlers": ["console"],
        },
        "django.request": {
            "handlers": ["console", "mail_admins"],
            "level": "ERROR",
            "propagate": False,
        },
        "gunicorn.access": {
            "propagate": True,
        },
        "gunicorn.error": {
            "propagate": True,
        },
    },
    "root": {
        "level": LOGLEVEL,
        "handlers": ["console"],
    }
}


class JSONFormatter(logging.Formatter):

    def format(self, record):
        return json.dumps({
            "time": self.formatTime(record),
            "threadName": record.threadName,
            "levelname": record.levelname,
            "log": super().format(record)
        })


class NewLineFormatter(logging.Formatter):

    def format(self, record):
        msg = super().format(record)

        if record.message != "":
            parts = msg.split(record.message)
            msg = msg.replace("\n", "\n" + parts[0])

        return msg


class GunicornLogger(glogging.Logger):

    def setup(self, cfg):
        logging.config.dictConfig(config)
