from .base import *  # noqa: F403

DEBUG = env_bool("DJANGO_DEBUG", False)  # noqa: F405
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
